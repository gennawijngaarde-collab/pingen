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
import { notifySignup } from '@/lib/email';
import { ROUTES } from '@/lib/routes';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ needsEmailConfirmation: boolean }>;
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

  const fetchProfile = useCallback(async (authUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile(data as User);
        return;
      }

      const fullName =
        typeof authUser.user_metadata?.full_name === 'string'
          ? authUser.user_metadata.full_name
          : null;

      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: authUser.id, full_name: fullName })
        .select('*')
        .single();

      if (insertError) throw insertError;
      setProfile(created as User);
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
          void fetchProfile(session.user);
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
        void fetchProfile(session.user);
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
          // Quand "Confirm email" est activé, il n'y a pas de session immédiate.
          // On redirige donc le lien de confirmation vers la page login.
          emailRedirectTo: `${window.location.origin}${ROUTES.login}`,
        },
      });
      if (error) throw error;
      const sessionUser = data.session?.user ?? null;
      if (sessionUser) {
        applySessionSync(sessionUser);
        setIsLoading(false);
        await fetchProfile(sessionUser);
      } else {
        // Email confirmation: user créé mais pas de session => on NE connecte PAS l'utilisateur.
        applySessionSync(null);
        setIsLoading(false);
      }
      void notifySignup({ email, fullName });
      return { needsEmailConfirmation: !sessionUser };
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
      await fetchProfile(nextUser);
    },
    [applySessionSync, fetchProfile]
  );

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'github') => {
      if (isDemoMode) {
        await demoOAuthSignIn(provider);
      } else {
        const redirectTo = `${window.location.origin}${ROUTES.dashboard}`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo },
        });
        if (error) throw error;
        // En OAuth réel, Supabase redirige : rien d’autre à faire ici.
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Connexion OAuth échouée. Réessaie.');
      applySessionSync(session.user);
      setIsLoading(false);
      await fetchProfile(session.user);
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
      await fetchProfile(user);
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
