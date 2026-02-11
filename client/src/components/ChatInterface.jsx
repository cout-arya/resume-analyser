import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ChatInterface = ({ sessionId, isReady }) => {
    const [messages, setMessages] = useState([
        { role: 'system', content: 'Upload your Resume and Job Description to start analyzing!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isReady && messages.length === 1) {
            setMessages(prev => [...prev, { role: 'system', content: 'Documents processed. You can now ask questions specifically about your fit for this role.' }]);
        }
    }, [isReady]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !sessionId || !isReady) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:4000/api/chat', {
                sessionId,
                question: userMsg
            });

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data.answer,
                citations: response.data.citations
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'system', content: 'Error generating response. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : msg.role === 'system' ? 'bg-gray-400' : 'bg-green-600'
                                }`}>
                                {msg.role === 'user' ? <User size={16} className="text-white" /> : msg.role === 'system' ? <Bot size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
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

            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-2">
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
