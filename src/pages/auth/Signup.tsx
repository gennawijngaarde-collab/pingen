'use client';

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { isDemoMode } from '@/lib/supabase';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Check } from 'lucide-react';

export function Signup() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { signUp, signInWithOAuth, isAuthenticated, isLoading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(ROUTES.dashboard, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const validatePassword = (pass: string) => {
    return {
      length: pass.length >= 8,
      number: /\d/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    };
  };

  const passwordChecks = validatePassword(password);
  const allChecksPassed = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    if (!allChecksPassed) {
      setError('Le mot de passe ne respecte pas les critères de sécurité');
      setIsLoading(false);
      return;
    }

    try {
      await signUp(email.trim(), password, fullName.trim());
      if (!isDemoMode) {
        setIsSuccess(true);
        setIsLoading(false);
      }
      // En mode démo, useEffect redirige vers le dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'inscription");
      setIsLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: 'google' | 'github') => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'inscription");
      setIsLoading(false);
    }
  };

  if (authLoading || (isAuthenticated && !isSuccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Inscription réussie !</CardTitle>
            <CardDescription>
              Vérifiez votre email pour confirmer votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Un email de confirmation a été envoyé à <strong>{email}</strong>.
              Cliquez sur le lien pour activer votre compte.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Aller à la connexion
            </Button>
          </CardContent>
        </Card>
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
          <Link to={ROUTES.home} className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <span className="font-bold text-2xl">PinGen</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t.auth.signupTitle}</CardTitle>
            <CardDescription className="text-center">{t.auth.signupSubtitle}</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t.auth.fullName}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jean Dupont"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

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
                    autoComplete="new-password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="space-y-1 mt-2">
                  <p className="text-xs text-muted-foreground">{t.auth.passwordRules}</p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`text-xs flex items-center gap-1 ${passwordChecks.length ? 'text-green-600' : 'text-muted-foreground'}`}
                    >
                      <Check className={`w-3 h-3 ${passwordChecks.length ? 'opacity-100' : 'opacity-0'}`} />
                      {t.auth.ruleLength}
                    </span>
                    <span
                      className={`text-xs flex items-center gap-1 ${passwordChecks.number ? 'text-green-600' : 'text-muted-foreground'}`}
                    >
                      <Check className={`w-3 h-3 ${passwordChecks.number ? 'opacity-100' : 'opacity-0'}`} />
                      {t.auth.ruleNumber}
                    </span>
                    <span
                      className={`text-xs flex items-center gap-1 ${passwordChecks.special ? 'text-green-600' : 'text-muted-foreground'}`}
                    >
                      <Check className={`w-3 h-3 ${passwordChecks.special ? 'opacity-100' : 'opacity-0'}`} />
                      {t.auth.ruleSpecial}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
                    required
                    disabled={isLoading}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" className="rounded border-gray-300 mt-1" required />
                <span className="text-sm text-muted-foreground">
                  {t.auth.acceptTerms}{' '}
                  <Link to={ROUTES.terms} className="text-primary hover:underline">
                    {t.auth.terms}
                  </Link>{' '}
                  {t.auth.and}{' '}
                  <Link to={ROUTES.privacy} className="text-primary hover:underline">
                    {t.auth.privacy}
                  </Link>
                </span>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading || !allChecksPassed}
              >
                {isLoading ? t.auth.creatingAccount : t.auth.submitSignup}
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
                onClick={() => void handleOAuthSignup('google')}
                disabled={isLoading}
              >
                Google
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => void handleOAuthSignup('github')}
                disabled={isLoading}
              >
                GitHub
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              {t.auth.hasAccount}{' '}
              <Link to={ROUTES.login} className="text-primary hover:underline">
                {t.common.login}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
