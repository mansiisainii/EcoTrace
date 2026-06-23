import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', companyName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await registerUser(formData);
      login(data.user, data.token);
      toast.success('Registration successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 fade-in">
      <div className="w-full max-w-md my-8">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="/earth.svg" alt="EcoTrace Logo" className="w-8 h-8" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-400">
              EcoTrace
            </span>
          </Link>
        </div>

        <div className="card shadow-xl shadow-green-900/5">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Create an Account</h2>
            <p className="text-[var(--text-muted)] mt-2">Start tracking your carbon footprint</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Full Name</label>
              <input 
                type="text" 
                required
                className="input-field" 
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Company Name</label>
              <input 
                type="text" 
                required
                className="input-field" 
                placeholder="Acme Corp"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              />
            </div>

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
              className="btn-primary w-full mt-6"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-[var(--text-muted)] text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-green-500 hover:text-green-400 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
