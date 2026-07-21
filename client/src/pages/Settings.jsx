import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUserProfile, updateUserProfile, updateUserPassword } from '../api';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { setUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [memberSince, setMemberSince] = useState('');
  const [email, setEmail] = useState('');
  
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  // Form states
  const [formData, setFormData] = useState({ name: '', company: '' });
  
  // Password states (optional)
  const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getUserProfile();
      const data = res.data.user;
      setFormData({ name: data.name || '', company: data.company || '' });
      setEmail(data.email || '');
      
      if (data.createdAt) {
        const date = new Date(data.createdAt);
        setMemberSince(date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
      }
    } catch (error) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.error('Name cannot be empty');
    }

    const isPasswordAttempt = pwdData.currentPassword || pwdData.newPassword || pwdData.confirmPassword;

    if (isPasswordAttempt) {
      if (!pwdData.currentPassword || !pwdData.newPassword || !pwdData.confirmPassword) {
        return toast.error('All password fields are required to change password');
      }
      if (pwdData.newPassword.length < 6) {
        return toast.error('New password must be at least 6 characters');
      }
      if (pwdData.newPassword !== pwdData.confirmPassword) {
        return toast.error('New passwords do not match');
      }
    }

    setSaving(true);
    try {
      // 1. Update Profile
      const profileRes = await updateUserProfile(formData);
      
      // 2. Update Password (if filled)
      if (isPasswordAttempt) {
        await updateUserPassword({
          currentPassword: pwdData.currentPassword,
          newPassword: pwdData.newPassword
        });
        setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }

      toast.success('Settings updated successfully');
      
      if (setUser && profileRes.data.user) {
        setUser(profileRes.data.user);
      }
      setEditMode(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 fade-in">
        <div className="w-full max-w-md my-8">
          <div className="p-8 sm:p-12 border border-[var(--border)] rounded-3xl bg-transparent animate-pulse shadow-sm">
            <div className="w-20 h-20 bg-[var(--border)] rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-[var(--border)] w-48 mx-auto rounded mb-2"></div>
            <div className="h-4 bg-[var(--border)] w-32 mx-auto rounded mb-8"></div>
            <div className="h-12 bg-[var(--border)] w-full rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 fade-in">
      <div className="w-full max-w-md my-8">
        
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <img src="/earth.svg" alt="EcoTrace Logo" className="w-8 h-8" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-400">
              EcoTrace
            </span>
          </div>
        </div>

        <div className="p-8 sm:p-12 border border-[var(--border)] rounded-3xl bg-[var(--card)] shadow-sm transition-colors duration-300 hover:border-green-500/50">
          
          {!editMode ? (
            // VIEW MODE
            <div className="fade-in">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-md shadow-green-900/30">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{formData.name}</h2>
                {memberSince && <p className="text-sm text-[var(--text-muted)] mt-1">Member since {memberSince}</p>}
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Email Address</p>
                  <p className="text-[var(--text-primary)]">{email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Company Name</p>
                  <p className="text-[var(--text-primary)]">{formData.company || '—'}</p>
                </div>
              </div>

              <button 
                onClick={() => setEditMode(true)}
                className="w-full bg-green-600 text-white font-medium rounded-xl px-5 py-3 transition-all hover:bg-green-700 shadow-sm"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            // EDIT MODE
            <form onSubmit={handleSave} className="fade-in">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm shadow-green-900/30">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Email Address</label>
                  <p className="text-[var(--text-primary)] py-2">{email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    className="input-field" 
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Company Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Your Company"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                
                <div className="mt-8 pt-6 border-t border-[var(--border)] space-y-4">
                  <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Change Password (Optional)</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword.current ? "text" : "password"} 
                        className="input-field pr-10" 
                        placeholder="••••••••"
                        value={pwdData.currentPassword}
                        onChange={(e) => setPwdData({...pwdData, currentPassword: e.target.value})}
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-green-500 transition-colors"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPassword.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">New Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword.new ? "text" : "password"} 
                        className="input-field pr-10" 
                        placeholder="••••••••"
                        value={pwdData.newPassword}
                        onChange={(e) => setPwdData({...pwdData, newPassword: e.target.value})}
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-green-500 transition-colors"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword.confirm ? "text" : "password"} 
                        className="input-field pr-10" 
                        placeholder="••••••••"
                        value={pwdData.confirmPassword}
                        onChange={(e) => setPwdData({...pwdData, confirmPassword: e.target.value})}
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-green-500 transition-colors"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 space-y-3">
                  <button 
                    type="submit" 
                    className="w-full bg-green-600 text-white font-medium rounded-xl px-5 py-3 transition-all hover:bg-green-700 shadow-sm"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditMode(false);
                      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="w-full text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium transition-colors py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
