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
    }, [isReady]);

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
        } catch (error) {
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
            colorClasses = 'text-emerald-600 bg-emerald-50';
        } else if (pct >= 60) {
            colorClasses = 'text-amber-600 bg-amber-50';
        } else {
            colorClasses = 'text-red-600 bg-red-50';
            note = ' — Low relevance';
        }

        return (
            <span className={`inline-flex items-center gap-1 text-xs ${colorClasses} px-2 py-0.5 rounded-full mt-1`}>
                <BarChart2 size={10} />
                {pct}% relevance{note}
            </span>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header with clear button */}
            {messages.some(m => m.role === 'user') && (
                <div className="flex items-center justify-end px-4 py-2 border-b border-gray-100 bg-gray-50">
                    <button
                        onClick={clearConversation}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={12} />
                        Clear conversation
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : msg.role === 'system' ? 'bg-gray-400' : 'bg-green-600'
                                }`}>
                                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                            </div>

                            <div className={`p-3 rounded-lg text-sm ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : msg.role === 'system'
                                    ? 'bg-gray-200 text-gray-700'
                                    : 'bg-white border border-gray-200 shadow-sm rounded-tl-none'
                                }`}>
                                <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>

                                {/* Relevance badge for assistant messages */}
                                {msg.role === 'assistant' && renderRelevanceBadge(msg.relevanceScore)}

                                {msg.citations && msg.citations.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                                        <p className="font-semibold mb-1">Sources:</p>
                                        {msg.citations.map((cite, i) => (
                                            <div key={i} className="mb-1 pl-2 border-l-2 border-green-200 line-clamp-2">
                                                [{cite.docType}] {cite.text.substring(0, 100)}...
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
                    <div className="flex flex-wrap gap-2 justify-center py-2">
                        {SUGGESTED_QUESTIONS.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleChipClick(q)}
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm border border-indigo-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 bg-white border-t border-gray-200 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isReady ? "Ask about your resume..." : "Upload documents first..."}
                    disabled={!isReady || loading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                    type="submit"
                    disabled={!isReady || loading || !input.trim()}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;
