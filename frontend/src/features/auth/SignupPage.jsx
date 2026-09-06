import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { user, profile, signup, loginWithGoogle } = useAuth();
  const [role, setRole] = useState('farmer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      const userRole = profile?.role || user?.user_metadata?.role || role || 'farmer';
      const targetPath = userRole === 'farmer' ? '/farmer/dashboard' : `/${userRole}-dashboard`;
      navigate(targetPath, { replace: true });
    }
  }, [user, profile, navigate, role]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await signup(email, password, fullName, role);
      setSuccessMsg('Account created successfully! Redirecting...');
      setTimeout(() => {
        const targetPath = role === 'farmer' ? '/farmer/dashboard' : `/${role}-dashboard`;
        navigate(targetPath);
      }, 1200);
    } catch (err) {
      console.error('Signup error:', err);
      setErrorMsg(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle(role);
    } catch (err) {
      console.error('Google signup error:', err);
      setErrorMsg(err.message || 'Google signup failed');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-border w-full max-w-md">
        <h2 className="text-2xl font-bold text-primary mb-2 text-center">Create an Account</h2>
        <p className="text-sm text-center text-muted-foreground mb-6">Join Farm2Fair with your role</p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-danger border border-red-200 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-success border border-green-200 text-sm rounded-lg">
            {successMsg}
          </div>
        )}

        {/* Role Picker */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-2">I am registering as a...</label>
          <div className="grid grid-cols-3 gap-2">
            {['farmer', 'buyer', 'fpo'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium capitalize transition-all ${
                  role === r 
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                    : 'bg-white text-foreground border-border hover:bg-slate-50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-border rounded-lg px-4 py-2.5 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors shadow-sm mb-4 disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {googleLoading ? 'Connecting...' : 'Sign up with Google'}
        </button>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Or with email</span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input 
              type="text" 
              required 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary" 
              placeholder="Ramesh Patil" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary" 
              placeholder="ramesh@example.com" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input 
              type="password" 
              required 
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 outline-none focus:border-primary" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || googleLoading}
            className="bg-primary text-primary-foreground font-medium rounded-lg px-4 py-2.5 mt-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <a href="/login" className="text-secondary hover:underline font-medium">Log in</a>
        </div>
      </div>
    </div>
  );
}
