import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginUser(formData);
      login(data.user, data.token);
      toast.success('Successfully logged in');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const { data } = await loginUser({ email: 'demo@ecotrace.com', password: 'demo123' });
      login(data.user, data.token);
      toast.success('Demo login successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 fade-in">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="/earth.svg" alt="EcoTrace Logo" className="w-8 h-8" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-400">
              EcoTrace
            </span>
          </Link>
        </div>

        <div className="p-8 sm:p-12 border border-[var(--border)] rounded-3xl bg-transparent shadow-sm transition-colors duration-300 hover:border-green-500/50">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Welcome Back</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Email Address</label>
              <input 
                type="email" 
                required
                className="input-field" 
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="input-field pr-10" 
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-green-500 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full mt-8 bg-green-600 text-white font-medium rounded-xl px-5 py-3 transition-all hover:bg-green-700 shadow-sm"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--background)] text-[var(--text-muted)]">Or try it out</span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full bg-transparent border border-[var(--border)] text-green-500 font-medium rounded-xl px-5 py-3 transition-colors hover:border-green-500/50 hover:bg-green-500/5 text-sm"
          >
            Use Demo Account
          </button>

          <p className="text-center mt-6 text-[var(--text-muted)] text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-500 hover:text-green-400 font-medium transition-colors">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
