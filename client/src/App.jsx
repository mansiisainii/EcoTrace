import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';

const ProtectedRoute = () => {
  const { user } = useAuth();
  
  if (!user && !localStorage.getItem('token')) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: 'var(--card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--primary)',
                  secondary: 'white',
                },
              },
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
