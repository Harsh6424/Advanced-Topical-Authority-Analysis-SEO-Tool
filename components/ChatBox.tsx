import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SendIcon } from './Icons';

interface ChatBoxProps {
    history: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (message: string) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ history, isLoading, onSendMessage }) => {
    const [input, setInput] = useState('');
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    return (
        <div className="bg-gray-800/70 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-cyan-300">Ask a Follow-up Question</h3>
            <div className="h-64 overflow-y-auto pr-2 space-y-4 mb-4 bg-gray-900/50 p-4 rounded-md">
                {history.length === 0 && (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-400">Ask the AI anything about this analysis...</p>
                    </div>
                )}
                {history.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-xl px-4 py-2 rounded-lg ${
                                message.role === 'user'
                                ? 'bg-cyan-800 text-white'
                                : 'bg-gray-700 text-gray-200'
                            }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="max-w-md px-4 py-2 rounded-lg bg-gray-700 text-gray-200">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                            </div>
                         </div>
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    placeholder="E.g., Which subcategory has the most articles?"
                    disabled={isLoading}
                    rows={1}
                    className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 resize-none"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-2 rounded-full bg-cyan-600 text-white hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                    aria-label="Send message"
                >
                    <SendIcon className="w-5 h-5"/>
                </button>
            </form>
        </div>
    );
};

export default ChatBox;