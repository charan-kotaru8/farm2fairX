import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout() {
  const { user, profile, logout } = useAuth();
  const userRole = profile?.role || user?.user_metadata?.role || 'farmer';
  const dashboardPath = userRole === 'farmer' ? '/farmer/dashboard' : `/${userRole}-dashboard`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-heading font-bold text-primary flex items-center gap-2">
            🌾 Farm2Fair
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link to={dashboardPath} className="text-sm font-medium text-primary hover:underline">
                  Dashboard ({userRole})
                </Link>
                <button 
                  onClick={logout} 
                  className="text-sm font-medium text-muted-foreground hover:text-danger"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium hover:text-primary">Login</Link>
                <Link to="/signup" className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
