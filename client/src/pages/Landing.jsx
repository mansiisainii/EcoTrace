
import React from 'react';
import { MessageSquare, Calculator, TrendingDown, Bot, BarChart3, LineChart, Lightbulb } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Landing = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemoLogin = async () => {
    try {
      const { data } = await loginUser({ email: 'demo@ecotrace.com', password: 'demo123' });
      
      // Prevent frontend context variables from loading data maps as undefined keys
      const safeUserSession = data.user 
        ? { ...data.user, companyName: data.user.company || data.user.name } 
        : { name: "Demo Administrator", companyName: "Acme Corporation" };

      login(safeUserSession, data.token);
      toast.success("Welcome to Demo Dashboard View");
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error("Demo authentication pipeline connection dropped. Check MongoDB clusters.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] fade-in">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#030712] to-[#0a1628] px-4 py-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/[8%] rounded-full blur-[160px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Left Side */}
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
              <img src="/earth.svg" alt="EcoTrace Logo" className="w-8 h-8" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-400">
                EcoTrace
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              Track Your Company's Carbon Footprint with AI
            </h1>
            
            <p className="text-lg font-normal leading-relaxed text-[var(--text-muted)] max-w-2xl mx-auto lg:mx-0 mt-2 mb-4">
              Tell our AI what your business does. We calculate the CO2. You reduce it.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link to="/register" className="w-full sm:w-auto bg-green-600 text-white font-medium rounded-xl px-5 py-3 transition-all hover:bg-green-700 shadow-sm text-center">
                Get Started Free
              </Link>
              <button onClick={handleDemoLogin} className="w-full sm:w-auto bg-transparent border border-[var(--border)] text-green-500 font-medium rounded-xl px-5 py-3 transition-colors hover:border-green-500/50 hover:bg-green-500/5 text-sm text-center">
                View Live Demo
              </button>
            </div>
          </div>

          {/* Right Side - Static Visual Component */}
          <div className="relative h-[400px] items-center justify-center hidden md:flex">
            <div className="absolute inset-0 bg-green-500/5 blur-[120px] rounded-full"></div>
            {/* Removed the inline float animation style parameter entirely */}
            <div className="card bg-[var(--card)] border border-green-500/30 p-8 shadow-2xl relative z-10 transform-none transition-none">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1 px-3 py-1 bg-[var(--background)] rounded-full border border-[var(--border)]">Sample Metric</div>
                <span className="text-5xl font-bold text-green-500">952 <span className="text-2xl">kg CO2e</span></span>
                <span className="text-lg text-[var(--text-muted)] mt-2">Electricity • Scope 2</span>
                <div className="w-full h-1 bg-[var(--border)] rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-green-500 w-[60%]"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 bg-[#0a1628]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">How It Works</h2>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto">Three simple steps to understand and reduce your environmental impact.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">Describe Your Activity</h3>
              <p className="text-[var(--text-muted)]">Type naturally: "We used 2000 kWh in our Mumbai office"</p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <Calculator className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">AI Calculates CO2</h3>
              <p className="text-[var(--text-muted)]">Our AI extracts data and Climatiq API calculates exact emissions</p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <TrendingDown className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">Reduce & Report</h3>
              <p className="text-[var(--text-muted)]">Get smart recommendations and track progress over time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--card)] py-8 px-4 text-center text-[var(--text-muted)]">
      </footer>
    </div>
  );
};

export default Landing;