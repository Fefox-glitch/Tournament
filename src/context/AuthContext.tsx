import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'team_captain' | 'fan';

export interface UserRoleRecord {
  role: UserRole;
  tournament_mode: '12' | '8' | null;
  team_id: string | null;
  team_id8: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  userRole: UserRoleRecord | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, asFan?: boolean) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRoleRecord | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchRole(userId: string) {
    const { data } = await supabase
      .from('user_roles')
      .select('role, tournament_mode, team_id, team_id8')
      .eq('user_id', userId)
      .maybeSingle();
    setUserRole(data as UserRoleRecord | null);
  }

  async function refreshRole() {
    if (user) await fetchRole(user.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchRole(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      (async () => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchRole(s.user.id);
        } else {
          setUserRole(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }

  async function signUp(email: string, password: string, asFan = false): Promise<string | null> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    // Auto-assign fan role immediately so they don't land on pending screen
    if (asFan && data.user) {
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'fan',
        tournament_mode: null,
        team_id: null,
        team_id8: null,
      });
    }
    return null;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user, userRole, loading, signIn, signUp, signOut, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
