import React, { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
              <img src="/earth.svg" alt="EcoTrace Logo" className="w-6 h-6" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-400">
                EcoTrace
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              <Link 
                to="/dashboard" 
                className={`font-medium transition-all duration-200 relative ${isActive('/dashboard') ? 'text-green-500' : 'text-[var(--text-muted)] hover:text-green-400'}`}
              >
                Dashboard
                {isActive('/dashboard') && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-green-500 rounded-full"></span>
                )}
              </Link>
              <Link 
                to="/reports" 
                className={`font-medium transition-all duration-200 relative ${isActive('/reports') ? 'text-green-500' : 'text-[var(--text-muted)] hover:text-green-400'}`}
              >
                Reports
                {isActive('/reports') && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-green-500 rounded-full"></span>
                )}
              </Link>
              
              <div className="h-6 w-px bg-[var(--border)] mx-2"></div>
              
              <ThemeToggle />
              
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {user?.companyName || user?.name || 'User'}
              </span>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          {user && (
            <div className="flex md:hidden items-center gap-4">
              <ThemeToggle />
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[var(--text-primary)]"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--card)] fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/dashboard" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard') ? 'text-green-500 bg-green-500/10' : 'text-[var(--text-muted)] hover:text-green-400'}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/reports" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/reports') ? 'text-green-500 bg-green-500/10' : 'text-[var(--text-muted)] hover:text-green-400'}`}
            >
              Reports
            </Link>
            <div className="border-t border-[var(--border)] my-2"></div>
            <div className="px-3 py-2 text-sm text-[var(--text-muted)]">
              Signed in as <span className="font-semibold text-[var(--text-primary)]">{user?.companyName || user?.name || 'User'}</span>
            </div>
            <button 
              onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
