import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (currentUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data) {
        // If FPO role, ensure fpos table record is linked
        if (data.role === 'fpo' && !data.fpo_id) {
          try {
            const { data: existingFpo } = await supabase.from('fpos').select('id').eq('profile_id', currentUser.id).maybeSingle();
            if (existingFpo) {
              data.fpo_id = existingFpo.id;
              await supabase.from('profiles').update({ fpo_id: existingFpo.id }).eq('id', currentUser.id);
            } else {
              const fpoName = data.full_name?.toLowerCase().includes('fpo') || data.full_name?.toLowerCase().includes('producer')
                ? data.full_name
                : `${data.full_name || 'Farmer'} Farmer Producer Co.`;
              const { data: newFpo } = await supabase.from('fpos').insert({
                name: fpoName,
                district: data.district || 'Latur',
                state: 'Maharashtra',
                contact_person: data.full_name || 'FPO Manager',
                profile_id: currentUser.id,
                total_members: 0,
              }).select().single();
              if (newFpo) {
                data.fpo_id = newFpo.id;
                await supabase.from('profiles').update({ fpo_id: newFpo.id }).eq('id', currentUser.id);
              }
            }
          } catch (fpoErr) {
            console.warn('FPO link error in fetchProfile:', fpoErr);
          }
        }
        setProfile(data);
      } else {
        const userRole = currentUser.user_metadata?.role || 'farmer';
        const fullName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Farmer';
        const fallbackProfile = {
          id: currentUser.id,
          full_name: fullName,
          role: userRole,
          updated_at: new Date().toISOString()
        };
        try {
          await supabase.from('profiles').upsert(fallbackProfile);
        } catch (_) {}
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password, fullName, role = 'farmer') => {
    // Security: Only allow public signup for farmer, buyer, or fpo. Admin must be provisioned via backend seed script.
    const allowedRoles = ['farmer', 'buyer', 'fpo'];
    const sanitizedRole = allowedRoles.includes(role) ? role : 'farmer';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: sanitizedRole,
        },
      },
    });
    if (error) throw error;

    if (data.user) {
      let fpoId = null;
      if (sanitizedRole === 'fpo') {
        const fpoName = fullName.toLowerCase().includes('fpo') || fullName.toLowerCase().includes('producer') || fullName.toLowerCase().includes('cooperative')
          ? fullName
          : `${fullName} Farmer Producer Co.`;
        try {
          const { data: fpoData } = await supabase.from('fpos').insert({
            name: fpoName,
            district: 'Latur',
            state: 'Maharashtra',
            contact_person: fullName,
            profile_id: data.user.id,
            total_members: 0,
          }).select().single();
          if (fpoData) {
            fpoId = fpoData.id;
          }
        } catch (e) {
          console.warn('FPO table insert on signup fallback:', e);
        }
      }

      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        role: sanitizedRole,
        fpo_id: fpoId,
        updated_at: new Date().toISOString(),
      });
    }

    return data;
  };

  const loginWithGoogle = async (role = 'farmer') => {
    const targetPath = role === 'farmer' ? '/farmer/dashboard' : `/${role}-dashboard`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${targetPath}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, setProfile, refreshProfile, loading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
