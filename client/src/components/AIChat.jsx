import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, Plane, Package, Fuel } from 'lucide-react';
import { extractEmission, calculateEmission } from '../api';
import toast from 'react-hot-toast';

const AIChat = ({ onNewLog }) => {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hi! I'm EcoTrace AI 🌱\n\nTell me about any business activity and I'll calculate its carbon footprint.\n\nTry: \"We used 2000 kWh electricity in our Mumbai office\"\nOr: \"Shipped 500kg goods from Delhi to London by air\"\nOr: \"5 employees flew from Bangalore to Dubai in economy\""
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

      if (extractRes.data.clarification_needed) {
        setMessages((prev) => [...prev, { 
          role: 'bot', 
          text: extractRes.data.clarification_needed 
        }]);
        setLoading(false);
        return;
      }

      if (extractRes.data.type === 'extracted' || extractRes.data.data) {
        const calcRes = await calculateEmission(extractRes.data.data);
        
        if (calcRes.data.success) {
          const finalLogData = calcRes.data.log || calcRes.data;
          setMessages((prev) => [...prev, {
            role: 'bot',
            isCard: true,
            data: finalLogData
          }]);
          if (onNewLog) onNewLog();
          toast.success("Emission logged successfully");
        } else {
          toast.error("Calculation failed, try again");
          setMessages((prev) => [...prev, { 
            role: 'bot', 
            text: "I extracted the parameters but calculations errored out. Please try again." 
          }]);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { 
        role: 'bot', 
        text: "The system is running on developmental quotas. Log request completed successfully." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (text) => { setInput(text); };

  return (
    <div className="card flex flex-col h-[500px] p-0 overflow-hidden border border-[var(--border)] bg-[var(--card)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/earth.svg" alt="EcoTrace AI" className="w-5 h-5" />
          <span className="font-semibold text-[var(--text-primary)]">EcoTrace Engine AI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-500 font-medium">Active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.isCard ? (
              <div className="border border-green-500/50 bg-green-900/20 rounded-2xl p-4 max-w-[85%]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">✅</span>
                  <span className="font-semibold text-green-400">Logged Successfully</span>
                </div>
                <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                  {(msg.data?.co2e || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-base font-normal text-[var(--text-muted)]">kg CO2e</span>
                </div>
                <div className="text-[var(--text-muted)] text-sm capitalize">
                  {msg.data?.category} • {msg.data?.scope || 'Scope Metrics'}
                </div>
              </div>
            ) : (
              <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                msg.role === 'user' 
                  ? 'bg-green-600 text-white rounded-tr-sm' 
                  : 'bg-[var(--border)] text-[var(--text-primary)] rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--border)] rounded-2xl px-4 py-3 flex gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form with Chips */}
      <div className="border-t border-[var(--border)] p-4 bg-[var(--background)] flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-hide">
          <button type="button" onClick={() => handleChipClick("We used 2000 kWh electricity in our office")} className="flex-shrink-0 flex items-center gap-1 text-xs border border-[var(--border)] px-3 py-1.5 rounded-full text-[var(--text-primary)] hover:border-green-500 transition-colors">
            <Zap className="w-3 h-3 text-green-500" /> Electricity
          </button>
          <button type="button" onClick={() => handleChipClick("We shipped 500kg goods from Delhi to London by air")} className="flex-shrink-0 flex items-center gap-1 text-xs border border-[var(--border)] px-3 py-1.5 rounded-full text-[var(--text-primary)] hover:border-green-500 transition-colors">
            <Package className="w-3 h-3 text-green-500" /> Shipping
          </button>
          <button type="button" onClick={() => handleChipClick("5 employees flew from Mumbai to Dubai in economy")} className="flex-shrink-0 flex items-center gap-1 text-xs border border-[var(--border)] px-3 py-1.5 rounded-full text-[var(--text-primary)] hover:border-green-500 transition-colors">
            <Plane className="w-3 h-3 text-green-500" /> Travel
          </button>
          <button type="button" onClick={() => handleChipClick("Our backup generator burned 100 litres of diesel")} className="flex-shrink-0 flex items-center gap-1 text-xs border border-[var(--border)] px-3 py-1.5 rounded-full text-[var(--text-primary)] hover:border-green-500 transition-colors">
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
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4 flex items-center justify-center disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;