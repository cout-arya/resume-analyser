import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, BarChart2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';

const SUGGESTED_QUESTIONS = [
    "Am I a strong fit for this role?",
    "What skills am I missing?",
    "How should I rewrite my professional summary?",
    "What are my top 3 strengths for this job?",
    "What experience gaps should I address?"
];

const ChatInterface = ({ sessionId, isReady }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { api } = useAuth();
    const { conversationHistory, setConversationHistory, chatMessages, setChatMessages } = useSession();

    // Alias for readability
    const messages = chatMessages;
    const setMessages = setChatMessages;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Add "documents processed" message when ready and not already shown
    useEffect(() => {
        if (isReady && messages.length === 1 && messages[0].role === 'system') {
            setMessages(prev => [...prev, { role: 'system', content: 'Documents processed. You can now ask questions specifically about your fit for this role.' }]);
        }
    }, [isReady, messages, setMessages]);

    const handleSend = async (question) => {
        const userMsg = typeof question === 'string' ? question : input;
        if (!userMsg.trim() || !sessionId || !isReady) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const response = await api.post('/api/chat', {
                sessionId,
                question: userMsg,
                conversationHistory
            });

            const { answer, topRelevanceScore, citations, conversationHistory: updatedHistory } = response.data;

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: answer,
                citations,
                relevanceScore: topRelevanceScore
            }]);

            // Update shared conversation history
            if (updatedHistory) {
                setConversationHistory(updatedHistory);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'system', content: 'Error generating response. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSend(input);
    };

    const handleChipClick = (question) => {
        handleSend(question);
    };

    const clearConversation = () => {
        setConversationHistory([]);
        setMessages([
            { role: 'system', content: 'Upload your Resume and Job Description to start analyzing!' },
            ...(isReady ? [{ role: 'system', content: 'Documents processed. You can now ask questions specifically about your fit for this role.' }] : [])
        ]);
    };

    // Only show chips when conversation is empty (no user messages yet)
    const showChips = isReady && !messages.some(m => m.role === 'user');

    /**
     * Render relevance badge for assistant messages.
     */
    const renderRelevanceBadge = (score) => {
        if (score === undefined || score === null) return null;
        const pct = Math.round(score * 100);
        let colorClasses;
        let note = '';

        if (pct >= 80) {
            colorClasses = 'text-lime-700 bg-lime-100 border-lime-400';
        } else if (pct >= 60) {
            colorClasses = 'text-amber-700 bg-amber-100 border-amber-400';
        } else {
            colorClasses = 'text-rose-700 bg-rose-100 border-rose-400';
            note = ' — Low relevance';
        }

        return (
            <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest ${colorClasses} border-2 px-2 py-0.5 rounded-lg shadow-[2px_2px_0px_#18181b] mt-3`}>
                <BarChart2 size={12} strokeWidth={3} />
                {pct}% relevance{note}
            </span>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-[2rem] shadow-[8px_8px_0px_#18181b] border-[3px] border-zinc-900 overflow-hidden">
            {/* Header with clear button */}
            {messages.some(m => m.role === 'user') && (
                <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-zinc-900 bg-lime-400">
                    <span className="font-black text-sm uppercase tracking-widest text-zinc-900">Career Chat</span>
                    <button
                        onClick={clearConversation}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-900 bg-white px-3 py-1.5 rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b] hover:bg-rose-400 hover:text-zinc-900 transition-colors"
                    >
                        <Trash2 size={14} strokeWidth={2.5} />
                        Clear conversation
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b] ${msg.role === 'user' ? 'bg-zinc-900' : msg.role === 'system' ? 'bg-zinc-300' : 'bg-lime-400'
                                }`}>
                                {msg.role === 'user' ? <User size={20} className="text-white" strokeWidth={2.5} /> : <Bot size={20} className="text-zinc-900" strokeWidth={2.5} />}
                            </div>

                            <div className={`p-4 text-sm border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b] ${msg.role === 'user'
                                ? 'bg-zinc-900 text-white rounded-2xl rounded-tr-none'
                                : msg.role === 'system'
                                    ? 'bg-zinc-200 text-zinc-800 rounded-2xl font-bold'
                                    : 'bg-white text-zinc-900 rounded-2xl rounded-tl-none font-medium'
                                }`}>
                                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert font-medium' : ''}`}>
                                    <ReactMarkdown>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>

                                {/* Relevance badge for assistant messages */}
                                {msg.role === 'assistant' && renderRelevanceBadge(msg.relevanceScore)}

                                {msg.citations && msg.citations.length > 0 && (
                                    <div className="mt-4 pt-3 border-t-2 border-dashed border-zinc-200 text-xs text-zinc-600 font-bold">
                                        <p className="mb-2 uppercase tracking-widest text-zinc-400">Sources:</p>
                                        {msg.citations.map((cite, i) => (
                                            <div key={i} className="mb-2 pl-3 border-l-[3px] border-lime-400 bg-zinc-50 p-2 rounded-r-lg line-clamp-2">
                                                <span className="text-zinc-900 font-black">[{cite.docType}]</span> {cite.text.substring(0, 100)}...
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Suggested question chips */}
                {showChips && (
                    <div className="flex flex-wrap gap-3 justify-center pt-8">
                        {SUGGESTED_QUESTIONS.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleChipClick(q)}
                                className="inline-flex items-center px-4 py-2 bg-lime-100 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-zinc-900 text-zinc-900 hover:bg-lime-400 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#18181b] shadow-[2px_2px_0px_#18181b] cursor-pointer transition-all"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-lime-400 p-3 rounded-2xl rounded-tl-none border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b] flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-zinc-900" strokeWidth={3} />
                            <span className="text-sm font-black uppercase tracking-widest text-zinc-900">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 bg-white border-t-[3px] border-zinc-900 flex gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isReady ? "Ask about your resume..." : "Upload documents first..."}
                    disabled={!isReady || loading}
                    className="flex-1 px-5 py-3 border-[3px] border-zinc-900 bg-zinc-50 rounded-xl font-bold focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_#18181b] transition-all disabled:bg-zinc-200 disabled:cursor-not-allowed placeholder-zinc-400"
                />
                <button
                    type="submit"
                    disabled={!isReady || loading || !input.trim()}
                    className="px-5 py-3 bg-zinc-900 text-lime-400 border-[3px] border-zinc-900 rounded-xl font-black hover:-translate-y-1 hover:text-white shadow-[4px_4px_0px_#a3e635] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none transition-all flex items-center justify-center"
                >
                    <Send size={24} strokeWidth={2.5} />
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;
