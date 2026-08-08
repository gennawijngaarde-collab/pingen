import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { supabase, isDemoMode, type User } from '@/lib/supabase';
import { demoOAuthSignIn } from '@/lib/localdb';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Invalide les réponses getSession périmées (évite d'écraser un login réussi)
  const authEpochRef = useRef(0);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data as User);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  const applySessionSync = useCallback(
    (sessionUser: SupabaseUser | null) => {
      authEpochRef.current += 1;
      flushSync(() => {
        setUser(sessionUser);
        if (!sessionUser) {
          setProfile(null);
        }
      });
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    const epochAtStart = authEpochRef.current;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        // Ignore si démonté, ou si un login/logout a eu lieu entre-temps
        if (cancelled || epochAtStart !== authEpochRef.current) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          void fetchProfile(session.user.id);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error loading session:', error);
        if (!cancelled && epochAtStart === authEpochRef.current) {
          setUser(null);
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      const nextUser = data.session?.user ?? data.user ?? null;
      applySessionSync(nextUser);
      setIsLoading(false);
      if (nextUser) {
        await fetchProfile(nextUser.id);
      }
    },
    [applySessionSync, fetchProfile]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const nextUser = data.session?.user ?? data.user ?? null;
      if (!nextUser) {
        throw new Error('Connexion réussie mais session introuvable. Réessaie.');
      }
      applySessionSync(nextUser);
      setIsLoading(false);
      await fetchProfile(nextUser.id);
    },
    [applySessionSync, fetchProfile]
  );

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'github') => {
      if (!isDemoMode) {
        throw new Error("La connexion OAuth n'est pas configurée sur cet environnement.");
      }
      await demoOAuthSignIn(provider);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Connexion OAuth échouée. Réessaie.');
      }
      applySessionSync(session.user);
      setIsLoading(false);
      await fetchProfile(session.user.id);
    },
    [applySessionSync, fetchProfile]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    applySessionSync(null);
    setIsLoading(false);
  }, [applySessionSync]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        signInWithOAuth,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
