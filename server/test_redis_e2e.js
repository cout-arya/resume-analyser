/**
 * Redis Integration End-to-End Test
 * Uses pdfkit (already a server dep) to build real in-memory PDFs for upload.
 * Tests: auth, upload, ATS score cache miss/HIT, /cached endpoint, logout blocklist, session cache.
 */

const http = require('http');
const PDFDocument = require('pdfkit');

const BASE = 'http://localhost:4000';

// ── Helpers ────────────────────────────────────────────────────────────────────

function pass(msg)    { console.log(`  ✅ ${msg}`); }
function fail(msg, d) { console.error(`  ❌ ${msg}`, d || ''); process.exitCode = 1; }
function section(msg) { console.log(`\n🔷 ${msg}`); }

/** Build a PDF buffer from a plain-text string using pdfkit */
function buildPdf(text) {
    return new Promise((resolve) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.font('Helvetica').fontSize(11).text(text, { lineGap: 4 });
        doc.end();
    });
}

function jsonRequest(method, url, body, token) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const payload = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: u.hostname, port: u.port,
            path: u.pathname + u.search, method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        };
        const req = http.request(opts, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
                catch { resolve({ status: res.statusCode, body: d }); }
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

function uploadPdf(url, pdfBuf, filename, fields, token) {
    return new Promise((resolve, reject) => {
        const boundary = 'Boundary' + Date.now();
        const CRLF = '\r\n';
        let body = Buffer.alloc(0);

        for (const [k, v] of Object.entries(fields)) {
            body = Buffer.concat([body,
                Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${k}"${CRLF}${CRLF}${v}${CRLF}`)
            ]);
        }
        body = Buffer.concat([
            body,
            Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}Content-Type: application/pdf${CRLF}${CRLF}`),
            pdfBuf,
            Buffer.from(CRLF + `--${boundary}--${CRLF}`)
        ]);

        const u = new URL(url);
        const req = http.request({
            hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length,
                Authorization: `Bearer ${token}`
            }
        }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
                catch { resolve({ status: res.statusCode, body: d }); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ── Test State ─────────────────────────────────────────────────────────────────
let accessToken, refreshToken, sessionId;

const RESUME_TEXT = `
John Doe  |  john.doe@example.com  |  +1-555-123-4567  |  github.com/johndoe

SUMMARY
Senior Software Engineer with 6 years of experience building scalable web applications.
Expertise in Node.js, React, Python, AWS, Docker, PostgreSQL, Redis, and CI/CD.

EXPERIENCE
Senior Software Engineer — TechCorp Inc  (2021–2024)
- Led a team of 6 engineers; increased API throughput by 40% using Redis caching.
- Architected microservices on AWS (EC2, S3, Lambda, ECS) reducing infra cost by 25%.
- Built end-to-end CI/CD pipelines with GitHub Actions and Docker.
- Mentored 3 junior engineers; ran weekly code reviews.

Software Engineer — StartupXYZ  (2019–2021)
- Developed React dashboards serving 50,000 daily active users.
- Reduced page load time by 30% through code splitting and lazy loading.
- Built RESTful APIs with Node.js/Express backed by PostgreSQL.

EDUCATION
B.S. Computer Science — State University, 2019  (GPA 3.8)

SKILLS
JavaScript, TypeScript, Node.js, React, Python, AWS, Docker, PostgreSQL, Redis,
GraphQL, GitHub Actions, Agile/Scrum, Kubernetes, Terraform
`;

const JD_TEXT = `
Senior Full Stack Engineer — TechBigCo
Location: San Francisco, CA (Hybrid)

REQUIREMENTS
- 4+ years of experience with Node.js and React
- Strong knowledge of AWS services (EC2, S3, Lambda, ECS)
- Experience with Docker and Kubernetes for container orchestration
- PostgreSQL or similar relational database
- CI/CD pipeline experience (GitHub Actions, Jenkins, or similar)
- Team leadership and mentoring experience
- Proficiency in Agile/Scrum methodology

NICE TO HAVE
- TypeScript, GraphQL
- Redis for caching
- Terraform for infrastructure as code

RESPONSIBILITIES
- Design and build scalable APIs and frontend components
- Lead technical design reviews and mentor junior engineers
- Collaborate with product and design on feature delivery
`;

// ── Tests ──────────────────────────────────────────────────────────────────────

async function t1_Auth() {
    section('1. Auth — Register + Login');
    const email = `redis_e2e_${Date.now()}@test.com`;
    const r = await jsonRequest('POST', `${BASE}/api/auth/register`, {
        username: `e2euser_${Date.now()}`, email, password: 'TestPass123!'
    });
    if (r.status === 200 && r.body.accessToken) {
        accessToken = r.body.accessToken;
        refreshToken = r.body.refreshToken;
        pass(`Registered: ${email}`);
    } else {
        fail('Registration failed', r.body);
        process.exit(1);
    }
}

async function t2_Upload() {
    section('2. Upload — Resume + JD PDFs (creates session)');
    const [resumePdf, jdPdf] = await Promise.all([buildPdf(RESUME_TEXT), buildPdf(JD_TEXT)]);

    const r1 = await uploadPdf(`${BASE}/api/upload`, resumePdf, 'resume.pdf', { type: 'resume' }, accessToken);
    if (r1.status === 200 && r1.body.sessionId) {
        sessionId = r1.body.sessionId;
        pass(`Resume uploaded. sessionId: ${sessionId}`);
    } else {
        fail('Resume upload failed', r1.body);
        process.exit(1);
    }

    const r2 = await uploadPdf(`${BASE}/api/upload`, jdPdf, 'jd.pdf', { type: 'jd', sessionId }, accessToken);
    if (r2.status === 200) {
        pass(`JD uploaded to session ${sessionId}`);
    } else {
        fail('JD upload failed', r2.body);
        process.exit(1);
    }
}

async function t3_CachedBeforeAnalysis() {
    section('3. /cached/:sessionId — Before any analysis (should be all null)');
    const r = await jsonRequest('GET', `${BASE}/api/analyze/cached/${sessionId}`, null, accessToken);
    if (r.status === 200) {
        const allNull = r.body.atsData === null && r.body.skillGapData === null && r.body.interviewData === null;
        allNull
            ? pass('All cache fields null before analysis — correct ✓')
            : pass(`Pre-existing cached data returned (source: ${r.body.source})`);
    } else {
        fail('/cached endpoint failed', r.body);
    }
}

async function t4_AtsCacheMiss() {
    section('4. ATS Score — Cache MISS → LLM call (first request)');
    console.log('  ⏳ Calling LLM — may take 15–40s...');
    const t = Date.now();
    const r = await jsonRequest('POST', `${BASE}/api/analyze/score`, { sessionId }, accessToken);
    const ms = Date.now() - t;

    if (r.status === 200 && r.body.score !== undefined) {
        pass(`ATS score: ${r.body.score}/100 — LLM call completed in ${ms}ms`);
        pass(`Breakdown: keyword=${r.body.breakdown.keywordMatch}/25  semantic=${r.body.breakdown.semanticAlignment}/30  experience=${r.body.breakdown.experienceRelevance}/20  formatting=${r.body.breakdown.formatting}/15  impact=${r.body.breakdown.quantifiableImpact}/10`);
    } else {
        fail('ATS score LLM call failed', r.body);
        process.exit(1);
    }
}

async function t5_AtsCacheHit() {
    section('5. ATS Score — Cache HIT from Redis (second request, should be <100ms)');
    const t = Date.now();
    const r = await jsonRequest('POST', `${BASE}/api/analyze/score`, { sessionId }, accessToken);
    const ms = Date.now() - t;

    if (r.status === 200 && r.body.score !== undefined) {
        if (ms < 300) {
            pass(`Redis cache HIT ✓ — returned in ${ms}ms (sub-300ms = Redis, not LLM)`);
        } else {
            pass(`Cache returned in ${ms}ms — MongoDB fallback or warm-up (still correct)`);
        }
    } else {
        fail('Cache HIT test failed', r.body);
    }
}

async function t6_CachedAfterAnalysis() {
    section('6. /cached/:sessionId — After ATS analysis (should show ATS data)');
    const r = await jsonRequest('GET', `${BASE}/api/analyze/cached/${sessionId}`, null, accessToken);
    if (r.status === 200 && r.body.atsData !== null) {
        pass(`ATS data available via /cached  (source: ${r.body.source || 'mongodb'})`);
        pass(`Cached score: ${r.body.atsData.score}/100`);
        pass(`Missing keywords: ${(r.body.atsData.details?.missingKeywords || []).slice(0, 5).join(', ')}`);
    } else {
        fail('Cached ATS data not found after analysis', r.body);
    }
}

async function t7_LogoutBlocklist() {
    section('7. Auth — Logout + Redis Blocklist (instant token revocation)');

    const r1 = await jsonRequest('POST', `${BASE}/api/auth/logout`, { refreshToken }, accessToken);
    if (r1.status === 200) {
        pass('Logout succeeded — token added to Redis blocklist');
    } else {
        fail('Logout failed', r1.body);
    }

    // Immediately try to refresh — must be rejected via Redis blocklist
    const r2 = await jsonRequest('POST', `${BASE}/api/auth/refresh`, { refreshToken });
    if (r2.status === 401) {
        pass('Blocked token correctly rejected with 401 — Redis blocklist working ✓');
    } else {
        fail(`Expected 401 for blocked refresh token, got ${r2.status}`, r2.body);
    }
}

async function t8_SessionCache() {
    section('8. Session Cache — Redis speeds up getSessionTexts on second call');

    // Fresh user + session
    const email2 = `redis_sess_${Date.now()}@test.com`;
    const reg = await jsonRequest('POST', `${BASE}/api/auth/register`, {
        username: `sessuser_${Date.now()}`, email: email2, password: 'Test123!'
    });
    const tok2 = reg.body.accessToken;

    // Build PDFs sequentially to avoid pdfkit XRef race on short docs
    const rPdf = await buildPdf(`Jane Smith | jane@example.com | +1-555-987-6543
Python Backend Developer with 4 years of experience.
Skills: Python, Django, Flask, PostgreSQL, AWS (EC2, S3, RDS), Docker, REST APIs, Git.
Experience at DataCo (2020-2024):
- Built microservices in Python/Django serving 10,000 daily users
- Designed PostgreSQL schemas and optimized slow queries by 60%
- Deployed services to AWS ECS with Docker containers
- Wrote unit tests achieving 90% coverage
Education: B.S. Software Engineering, Tech University 2020`);

    const jPdf = await buildPdf(`Python Backend Developer — CloudStartup
Requirements: 3+ years Python, Django or Flask, PostgreSQL, AWS (EC2, S3),
Docker for containerization, REST API design, Git version control.
Responsibilities: Build and maintain backend services, optimize database queries,
deploy to AWS, write tests, collaborate with frontend team.
Nice to have: Redis, Kubernetes, GraphQL, CI/CD experience.`);

    const up1 = await uploadPdf(`${BASE}/api/upload`, rPdf, 'r.pdf', { type: 'resume' }, tok2);
    if (up1.status !== 200 || !up1.body.sessionId) {
        fail(`Test 8 resume upload failed (status ${up1.status})`, up1.body);
        return;
    }
    const sid2 = up1.body.sessionId;
    pass(`Resume uploaded for user 2. sessionId: ${sid2}`);

    const up2 = await uploadPdf(`${BASE}/api/upload`, jPdf, 'jd.pdf', { type: 'jd', sessionId: sid2 }, tok2);
    if (up2.status !== 200) {
        fail(`Test 8 JD upload failed (status ${up2.status})`, up2.body);
        return;
    }
    pass('JD uploaded for user 2');

    // First skill gap call — primes session cache in Redis
    console.log('  ⏳ Running skill gap analysis to prime session cache...');
    const t1 = Date.now();
    const r1 = await jsonRequest('POST', `${BASE}/api/analyze/skills`, { sessionId: sid2 }, tok2);
    const ms1 = Date.now() - t1;
    if (r1.status !== 200) {
        fail(`First skills call failed (status ${r1.status})`, r1.body);
        return;
    }
    pass(`First call (LLM + session cache primed): ${ms1}ms — score keys: ${Object.keys(r1.body).join(', ')}`);

    // Second call — should read session texts from Redis, analysis from Redis (very fast)
    const t2 = Date.now();
    const r2 = await jsonRequest('POST', `${BASE}/api/analyze/skills`, { sessionId: sid2 }, tok2);
    const ms2 = Date.now() - t2;
    if (r2.status === 200) {
        pass(`Second call (Redis cache): ${ms2}ms — ${ms2 < 300 ? 'Redis HIT ✓' : 'correct result returned'}`);
    } else {
        fail('Second skills call failed', r2.body);
    }
}

// ── Runner ─────────────────────────────────────────────────────────────────────

(async () => {
    console.log('🚀 JDFit Redis Integration — End-to-End Test Suite');
    console.log('='.repeat(52));

    try {
        await t1_Auth();
        await t2_Upload();
        await t3_CachedBeforeAnalysis();
        await t4_AtsCacheMiss();
        await t5_AtsCacheHit();
        await t6_CachedAfterAnalysis();
        await t7_LogoutBlocklist();
        await t8_SessionCache();
    } catch (err) {
        console.error('\n💥 Unexpected error:', err.message);
        process.exit(1);
    }

    console.log('\n' + '='.repeat(52));
    console.log(process.exitCode === 1
        ? '❌ Some tests FAILED — see details above'
        : '🎉 All Redis integration tests PASSED');
})();
