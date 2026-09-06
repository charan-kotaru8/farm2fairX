import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const userRole = profile?.role || user?.user_metadata?.role || 'farmer';
  const dashboardPath = userRole === 'farmer' ? '/farmer/dashboard' : `/${userRole}-dashboard`;

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center">
      <h1 className="text-5xl md:text-6xl font-bold text-primary mb-6">
        From Farm to Fair Value
      </h1>
      <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
        Empowering farmers with AI-driven market intelligence, connecting them directly to verified buyers for the best possible prices.
      </p>
      <div className="flex gap-4">
        {user ? (
          <button 
            onClick={() => navigate(dashboardPath)}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium text-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <span>🌾</span> Go to Dashboard ({userRole})
          </button>
        ) : (
          <>
            <button 
              onClick={() => navigate('/signup')}
              className="bg-accent text-accent-foreground px-8 py-3 rounded-xl font-medium text-lg hover:bg-accent/90 transition-colors shadow-sm"
            >
              Get Started
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="bg-white text-foreground border border-border px-8 py-3 rounded-xl font-medium text-lg hover:bg-muted transition-colors shadow-sm"
            >
              Login
            </button>
          </>
        )}
      </div>
      
      <div className="mt-24 grid md:grid-cols-3 gap-8 w-full max-w-5xl text-left">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-border">
          <div className="text-secondary mb-4 text-3xl">🔍</div>
          <h3 className="text-xl font-semibold mb-2">Discover</h3>
          <p className="text-muted-foreground">Access real-time market trends and AI-driven price recommendations.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-border">
          <div className="text-secondary mb-4 text-3xl">⚖️</div>
          <h3 className="text-xl font-semibold mb-2">Compare</h3>
          <p className="text-muted-foreground">Compare offers from multiple verified buyers transparently.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-border">
          <div className="text-secondary mb-4 text-3xl">🚀</div>
          <h3 className="text-xl font-semibold mb-2">Sell Better</h3>
          <p className="text-muted-foreground">Make informed decisions and get paid securely and on time.</p>
        </div>
      </div>
    </div>
  );
}
