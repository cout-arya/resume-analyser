const mongoose = require('mongoose');
const Session = require('./models/Session');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const session = await Session.findOne().sort({ createdAt: -1 });
        if (!session) {
            console.log("No sessions found");
        } else {
            console.log("Session ID:", session.sessionId);
            session.files.forEach(f => {
                console.log(`File type: ${f.type}`);
                console.log(`File text length: ${f.text ? f.text.length : 0}`);
            });
        }
        process.exit(0);
    })
    .catch(console.error);
