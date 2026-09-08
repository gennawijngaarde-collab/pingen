'use client';

import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ROUTES, isDashboardPath, safeInternalPath } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { isDemoMode } from '@/lib/supabase';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/localdb';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { signIn, signInWithOAuth, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState(isDemoMode ? DEMO_EMAIL : '');
  const [password, setPassword] = useState(isDemoMode ? DEMO_PASSWORD : '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirection fiable après auth (évite la course navigate vs ProtectedRoute)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const from = safeInternalPath((location.state as { from?: string } | null)?.from);
      navigate(isDashboardPath(from) ? from : ROUTES.dashboard, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la connexion');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      await signIn(DEMO_EMAIL, DEMO_PASSWORD);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la connexion');
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la connexion');
      setIsLoading(false);
    }
  };

  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher variant="outline" />
      </div>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link to={ROUTES.home} className="flex items-center">
            <span className="font-bold text-4xl bg-gradient-to-r from-[#3B9EFF] to-[#7C3AED] bg-clip-text text-transparent">GX</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t.auth.loginTitle}</CardTitle>
            <CardDescription className="text-center">{t.auth.loginSubtitle}</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isDemoMode && (
              <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {t.auth.demoMode}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {t.auth.demoHint} ({DEMO_EMAIL}).
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => void handleDemoLogin()}
                  disabled={isLoading}
                >
                  {isLoading ? t.auth.loggingIn : t.auth.demoLogin}
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.auth.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.auth.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? t.auth.loggingIn : t.auth.submitLogin}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t.auth.orContinueWith}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => void handleOAuthLogin('google')}
                disabled={isLoading}
              >
                Google
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => void handleOAuthLogin('github')}
                disabled={isLoading}
              >
                GitHub
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              {t.auth.noAccount}{' '}
              <Link to={ROUTES.signup} className="text-primary hover:underline">
                {t.auth.createAccount}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
