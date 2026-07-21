import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Maximize2, Minimize2 } from 'lucide-react';
import { askHelpChat } from '../api';
import { useLocation } from 'react-router-dom';

const HelpChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! 👋 I'm the EcoTrace Guide. Ask me anything about how to use the app — navigation, filters, Scope 1/2/3, charts, and more!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);
  
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await askHelpChat(
        userMessage,
        messages
      );
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Something went wrong — please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-3 sm:right-6 z-50 flex items-center justify-center group">
        {!isOpen && (
          <span className="animate-ping [animation-duration:3s] absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-20"></span>
        )}
        
        <div className="absolute right-full mr-4 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          Help Assistant
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-green-600 hover:bg-green-500 rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-green-900/40 transition-all duration-200"
        >
          <img src="/earth.svg" alt="Help Assistant" className="w-6 h-6" />
        </button>
      </div>

      {isOpen && (
        <div className={`fixed bottom-24 right-3 sm:right-6 z-50 ${isExpanded ? 'w-[calc(100vw-24px)] sm:w-[480px] h-[80vh] sm:h-[600px]' : 'w-[calc(100vw-24px)] sm:w-96 h-[60vh] sm:h-[500px]'} transition-all duration-300 ease-in-out rounded-2xl shadow-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col overflow-hidden fade-in`}>
          <div className="bg-green-600 p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/earth.svg" alt="EcoTrace" className="w-4 h-4" />
              <span className="font-semibold text-white">EcoTrace Guide</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white hover:text-green-200 transition-colors duration-200 p-1 rounded-lg hover:bg-white/10"
                aria-label={isExpanded ? "Minimize chat" : "Expand chat"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setIsExpanded(false);
                }} 
                className="text-white hover:text-green-200 transition-colors duration-200 p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 text-sm max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-green-600 text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-[var(--border)] text-[var(--text-primary)] rounded-2xl rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--border)] text-[var(--text-primary)] rounded-2xl rounded-tl-sm px-3 py-2 text-sm max-w-[85%] flex items-center gap-1 min-h-[36px]">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-[var(--border)] p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="input-field flex-1"
              disabled={loading}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn-primary p-3 flex items-center justify-center rounded-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpChatWidget;
