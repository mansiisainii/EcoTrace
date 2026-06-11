import React, { useState, useRef, useEffect } from 'react';
import { Leaf, Send, Zap, Plane, Package, Fuel } from 'lucide-react';
import { extractEmission, calculateEmission } from '../api';
import toast from 'react-hot-toast';

const AIChat = ({ onNewLog }) => {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hi! I'm EcoTrace AI\nTell me about any business activity and I'll calculate its carbon footprint.\n\nTry: 'We used 2000 kWh electricity in our Mumbai office'\nOr: 'Shipped 500kg goods from Delhi to London by air'\nOr: '5 employees flew from Bangalore to Dubai in economy'"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const messagesEndRef = useRef(null);

  const placeholders = [
    "We used 2000 kWh in Mumbai...",
    "Shipped 500kg to London...",
    "5 employees flew to Dubai...",
    "Generator burned 100L diesel..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const extractRes = await extractEmission(userMessage);
      
      if (!extractRes.data.success) {
         setMessages((prev) => [...prev, { 
           role: 'bot', 
           text: "Could not understand, please be more specific about the activity, quantity, and unit." 
         }]);
         setLoading(false);
         return;
      }

      if (extractRes.data.clarification_needed) {
        setMessages((prev) => [...prev, { 
          role: 'bot', 
          text: extractRes.data.clarification_needed 
        }]);
        setLoading(false);
        return;
      }

      const calcRes = await calculateEmission(extractRes.data.data);
      
      if (calcRes.data.success) {
        setMessages((prev) => [...prev, {
          role: 'bot',
          isCard: true,
          data: calcRes.data.data
        }]);
        if (onNewLog) onNewLog();
      } else {
        toast.error("Calculation failed, try again");
        setMessages((prev) => [...prev, { 
          role: 'bot', 
          text: "I extracted the data but failed to calculate the emissions. Please try again." 
        }]);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Calculation failed, try again";
      toast.error(msg);
      setMessages((prev) => [...prev, { 
        role: 'bot', 
        text: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (text) => {
    setInput(text);
  };

  return (
    <div className="card flex flex-col h-[600px] md:h-[500px] p-0 overflow-hidden border border-[var(--border)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] p-4 flex justify-between items-center bg-[var(--background)]">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-500" />
          <span className="font-semibold text-[var(--text-primary)]">EcoTrace AI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-500 font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[var(--background)]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.isCard ? (
              <div className="border border-green-500/50 bg-green-900/20 rounded-2xl p-4 max-w-[85%] md:max-w-[70%]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">✅</span>
                  <span className="font-semibold text-green-400">Logged Successfully</span>
                </div>
                <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                  {msg.data.co2e.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-base font-normal text-[var(--text-muted)]">kg CO2e</span>
                </div>
                <div className="text-[var(--text-muted)] text-sm">
                  {msg.data.category} • Scope {msg.data.scope}
                </div>
                {msg.data.region && (
                  <div className="text-[var(--text-muted)] text-sm mt-1">
                    Region: <span className="uppercase">{msg.data.region}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={`rounded-2xl px-4 py-3 max-w-[85%] md:max-w-[70%] whitespace-pre-line ${
                msg.role === 'user' 
                  ? 'bg-green-600 text-white rounded-tr-sm' 
                  : 'bg-[var(--card)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-4 py-4 flex gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--border)] p-4 bg-[var(--background)] flex flex-col gap-3">
        {/* Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          <button onClick={() => handleChipClick("We used 2000 kWh electricity in our office this month")} className="flex-shrink-0 flex items-center gap-1 border border-gray-700 hover:border-green-500 text-xs px-3 py-1.5 rounded-full transition-colors text-[var(--text-primary)]">
            <Zap className="w-3 h-3 text-green-500" /> Electricity Usage
          </button>
          <button onClick={() => handleChipClick("5 employees flew from Mumbai to Dubai in economy")} className="flex-shrink-0 flex items-center gap-1 border border-gray-700 hover:border-green-500 text-xs px-3 py-1.5 rounded-full transition-colors text-[var(--text-primary)]">
            <Plane className="w-3 h-3 text-green-500" /> Business Travel
          </button>
          <button onClick={() => handleChipClick("We shipped 500kg goods from Delhi to London by air")} className="flex-shrink-0 flex items-center gap-1 border border-gray-700 hover:border-green-500 text-xs px-3 py-1.5 rounded-full transition-colors text-[var(--text-primary)]">
            <Package className="w-3 h-3 text-green-500" /> Shipping
          </button>
          <button onClick={() => handleChipClick("Our generator burned 100 litres of diesel")} className="flex-shrink-0 flex items-center gap-1 border border-gray-700 hover:border-green-500 text-xs px-3 py-1.5 rounded-full transition-colors text-[var(--text-primary)]">
            <Fuel className="w-3 h-3 text-green-500" /> Fuel Usage
          </button>
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholders[placeholderIndex]}
            className="input-field"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="btn-primary px-4 flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
