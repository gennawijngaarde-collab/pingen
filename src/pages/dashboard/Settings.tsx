'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  supabase,
  isDemoMode,
  getUserPinterestAccounts,
  getUserSubscription,
  connectPinterestAccount,
  type PinterestAccount,
} from '@/lib/supabase';
import {
  confirmStripeCheckout,
  fetchStripeStatus,
  openStripePortal,
  startStripeCheckout,
  type PaidPlan,
} from '@/lib/stripe';
import {
  hasPinterestConfig,
  startPinterestOAuth,
  completePinterestOAuth,
  peekOAuthState,
  clearOAuthState,
  mockPinterestService,
  fetchPinterestRuntimeConfig,
  savePinterestCredentials,
  getPinterestRedirectUri,
  type PinterestRuntimeConfig,
} from '@/lib/pinterest';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { COMPANY } from '@/lib/company';
import {
  User,
  Lock,
  Bell,
  CreditCard,
  Link as LinkIcon,
  Camera,
  Check,
  Sparkles,
  Trash2,
  Loader2,
} from 'lucide-react';

const PLAN_PRICES: Record<string, string> = {
  starter: 'Gratuit',
  pro: '19€/mois',
  business: '49€/mois',
};

export function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const [isSaving, setIsSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accounts, setAccounts] = useState<PinterestAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isConnectingPinterest, setIsConnectingPinterest] = useState(false);
  const [pinterestStatus, setPinterestStatus] = useState<string | null>(null);
  const [pinterestConfig, setPinterestConfig] = useState<PinterestRuntimeConfig | null>(null);
  const [pinterestAppIdInput, setPinterestAppIdInput] = useState('');
  const [pinterestAppSecretInput, setPinterestAppSecretInput] = useState('');
  const [isSavingPinterestKeys, setIsSavingPinterestKeys] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);

  const pinterestReady = Boolean(pinterestConfig?.configured || hasPinterestConfig);
  const redirectUri =
    pinterestConfig?.redirectUri ||
    (typeof window !== 'undefined' ? getPinterestRedirectUri() : 'http://localhost:5173/dashboard/settings');

  useEffect(() => {
    void fetchPinterestRuntimeConfig().then((config) => {
      setPinterestConfig(config);
      if (config.appId) setPinterestAppIdInput(config.appId);
    });
    void fetchStripeStatus().then((status) => setStripeReady(status.configured));
  }, []);

  useEffect(() => {
    if (!user) return;
    void getUserSubscription(user.id)
      .then((sub) => {
        if (sub && typeof sub.stripe_customer_id === 'string') {
          setStripeCustomerId(sub.stripe_customer_id);
        }
      })
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    setFirstName(profile?.full_name?.split(' ')[0] || '');
    setLastName(profile?.full_name?.split(' ').slice(1).join(' ') || '');
  }, [profile]);

  const loadAccounts = useCallback(async () => {
    if (!user) return;
    setIsLoadingAccounts(true);
    try {
      const data = await getUserPinterestAccounts(user.id);
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading Pinterest accounts:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [user]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Callback OAuth Pinterest : ?code=...&state=...
  useEffect(() => {
    if (!user) return;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error');

    if (!code && !oauthError) return;

    const clearOAuthParams = () => {
      const next = new URLSearchParams(searchParams);
      next.delete('code');
      next.delete('state');
      next.delete('error');
      next.set('tab', 'account');
      setSearchParams(next, { replace: true });
    };

    if (oauthError) {
      toast({
        title: 'Connexion Pinterest annulée',
        description: oauthError,
        variant: 'destructive',
      });
      clearOAuthParams();
      return;
    }

    const lockKey = `pinterest_oauth_lock_${code}`;
    if (sessionStorage.getItem(lockKey) === 'done' || sessionStorage.getItem(lockKey) === 'processing') {
      return;
    }

    if (!peekOAuthState(state)) {
      toast({
        title: 'Session OAuth invalide',
        description: 'Relancez la connexion Pinterest depuis les paramètres.',
        variant: 'destructive',
      });
      clearOAuthParams();
      return;
    }

    sessionStorage.setItem(lockKey, 'processing');
    clearOAuthState();
    setIsConnectingPinterest(true);
    setPinterestStatus('Finalisation de la connexion Pinterest…');

    void (async () => {
      try {
        const result = await completePinterestOAuth(code!);

        await connectPinterestAccount({
          user_id: user.id,
          pinterest_user_id: result.user.id,
          username: result.user.username,
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          token_expires_at: new Date(
            Date.now() + result.expires_in * 1000
          ).toISOString(),
          boards: result.boards.map((b) => ({
            id: b.id,
            name: b.name,
            description: b.description,
            image_url: b.image_url,
            pin_count: b.pin_count,
          })),
        });

        const refreshed = await getUserPinterestAccounts(user.id);
        setAccounts(refreshed || []);
        await syncAccountCount((refreshed || []).length);

        sessionStorage.setItem(lockKey, 'done');
        toast({
          title: 'Compte Pinterest connecté',
          description: `@${result.user.username} — ${result.boards.length} tableau(x) synchronisé(s).`,
        });
        setPinterestStatus(null);
      } catch (error) {
        console.error(error);
        sessionStorage.removeItem(lockKey);
        toast({
          title: 'Échec connexion Pinterest',
          description:
            error instanceof Error
              ? error.message
              : 'Impossible de finaliser OAuth. Vérifiez App ID, Secret et Redirect URI.',
          variant: 'destructive',
        });
        setPinterestStatus(null);
      } finally {
        setIsConnectingPinterest(false);
        clearOAuthParams();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, searchParams]);

  const handleTabChange = (tab: string) => {
    setSearchParams(tab === 'profile' ? {} : { tab });
  };

  const syncAccountCount = async (count: number) => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ pinterest_accounts_connected: count })
      .eq('id', user.id);
    await refreshProfile();
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      toast({
        title: 'Nom requis',
        description: 'Veuillez renseigner au moins un prénom.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);
    setIsSaving(false);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le profil.',
        variant: 'destructive',
      });
      return;
    }

    await refreshProfile();
    toast({
      title: 'Profil sauvegardé',
      description: 'Vos informations ont été mises à jour.',
    });
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Champs manquants',
        description: 'Remplissez tous les champs pour changer le mot de passe.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: 'Mot de passe trop court',
        description: 'Le mot de passe doit contenir au moins 6 caractères.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Confirmation incorrecte',
        description: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (!isDemoMode) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: 'Mot de passe mis à jour',
        description: isDemoMode
          ? 'Mode démo : changement simulé.'
          : 'Votre mot de passe a été changé.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de changer le mot de passe.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePinterestKeys = async () => {
    setIsSavingPinterestKeys(true);
    try {
      const result = await savePinterestCredentials(
        pinterestAppIdInput.trim(),
        pinterestAppSecretInput.trim()
      );
      if (!result.ok) {
        throw new Error(result.error || 'Échec de la sauvegarde');
      }
      const config = await fetchPinterestRuntimeConfig();
      setPinterestConfig(config);
      setPinterestAppSecretInput('');
      toast({
        title: 'Clés Pinterest enregistrées',
        description: result.message || 'Tu peux maintenant connecter ton vrai compte Pinterest.',
      });
    } catch (error) {
      toast({
        title: 'Impossible d’enregistrer les clés',
        description: error instanceof Error ? error.message : 'Réessaie.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPinterestKeys(false);
    }
  };

  const handleCopyRedirectUri = async () => {
    try {
      await navigator.clipboard.writeText(redirectUri);
      toast({ title: 'Redirect URI copiée', description: redirectUri });
    } catch {
      toast({
        title: 'Copie manuelle',
        description: redirectUri,
      });
    }
  };

  const handleConnectPinterest = async () => {
    if (!user) return;

    setIsConnectingPinterest(true);
    setPinterestStatus(null);

    try {
      const config = await fetchPinterestRuntimeConfig();
      setPinterestConfig(config);

      if (config.configured || hasPinterestConfig) {
        setPinterestStatus('Redirection vers Pinterest…');
        await startPinterestOAuth();
        return;
      }

      // Mode démo : simule un vrai compte avec boards
      const index = accounts.length + 1;
      const mockUser = mockPinterestService.user;
      const mockBoards = await mockPinterestService.getBoards();

      await connectPinterestAccount({
        user_id: user.id,
        pinterest_user_id: `${mockUser.id}_${Date.now()}`,
        username: `${(profile?.full_name || mockUser.username).split(' ')[0].toLowerCase()}_pin_${index}`,
        access_token: 'demo-access-token',
        refresh_token: 'demo-refresh-token',
        token_expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        boards: mockBoards.map((b) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          image_url: b.image_url,
          pin_count: b.pin_count,
        })),
      });

      const refreshed = await getUserPinterestAccounts(user.id);
      setAccounts(refreshed || []);
      await syncAccountCount((refreshed || []).length);

      toast({
        title: 'Compte Pinterest connecté (démo)',
        description:
          'Compte simulé. Pour le vrai Pinterest : crée une app sur developers.pinterest.com et colle App ID + Secret ci-dessous.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Impossible de connecter le compte.',
        variant: 'destructive',
      });
    } finally {
      setIsConnectingPinterest(false);
      setPinterestStatus(null);
    }
  };

  const handleDisconnectPinterest = async (accountId: string) => {
    const { error } = await supabase
      .from('pinterest_accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de déconnecter le compte.',
        variant: 'destructive',
      });
      return;
    }

    const refreshed = await getUserPinterestAccounts(user!.id);
    setAccounts(refreshed || []);
    await syncAccountCount((refreshed || []).length);
    toast({ title: 'Compte déconnecté' });
  };

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');
    if (!user || (!sessionId && !canceled)) return;

    const clearBillingParams = () => {
      const next = new URLSearchParams(searchParams);
      next.delete('session_id');
      next.delete('canceled');
      next.set('tab', 'billing');
      setSearchParams(next, { replace: true });
    };

    if (canceled) {
      toast({
        title: 'Paiement annulé',
        description: 'Aucun changement n’a été appliqué à votre plan.',
      });
      clearBillingParams();
      return;
    }

    if (!sessionId) return;
    const lockKey = `stripe_session_${sessionId}`;
    if (sessionStorage.getItem(lockKey)) return;
    sessionStorage.setItem(lockKey, 'processing');

    void (async () => {
      setIsSaving(true);
      try {
        const confirmed = await confirmStripeCheckout(sessionId, user.id);
        const { error } = await supabase
          .from('profiles')
          .update({ plan: confirmed.plan })
          .eq('id', user.id);
        if (error) throw error;

        if (confirmed.customerId) {
          setStripeCustomerId(confirmed.customerId);
          const existing = await getUserSubscription(user.id);
          if (existing?.id) {
            await supabase
              .from('subscriptions')
              .update({
                stripe_customer_id: confirmed.customerId,
                stripe_subscription_id: confirmed.subscriptionId ?? null,
                plan: confirmed.plan,
                status: 'active',
              })
              .eq('id', existing.id);
          } else {
            await supabase.from('subscriptions').insert({
              user_id: user.id,
              stripe_customer_id: confirmed.customerId,
              stripe_subscription_id: confirmed.subscriptionId ?? null,
              plan: confirmed.plan,
              status: 'active',
            });
          }
        }

        await refreshProfile();
        toast({
          title: `Plan ${confirmed.plan} activé`,
          description: 'Votre paiement Stripe a bien été confirmé.',
        });
      } catch (error) {
        toast({
          title: 'Paiement non confirmé',
          description: error instanceof Error ? error.message : 'Réessaie depuis Facturation.',
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
        clearBillingParams();
      }
    })();
  }, [refreshProfile, searchParams, setSearchParams, toast, user]);

  const handleChangePlan = async (plan: 'starter' | 'pro' | 'business') => {
    if (!user) return;

    if (plan !== 'starter' && stripeReady) {
      setIsSaving(true);
      try {
        await startStripeCheckout(plan as PaidPlan, user.id, user.email || '');
      } catch (error) {
        setIsSaving(false);
        toast({
          title: 'Stripe',
          description: error instanceof Error ? error.message : 'Impossible de lancer le paiement.',
          variant: 'destructive',
        });
      }
      return;
    }

    if (plan === 'starter' && stripeReady && stripeCustomerId) {
      setIsSaving(true);
      try {
        await openStripePortal(stripeCustomerId);
      } catch (error) {
        setIsSaving(false);
        toast({
          title: 'Stripe',
          description: error instanceof Error ? error.message : 'Impossible d’ouvrir le portail.',
          variant: 'destructive',
        });
      }
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ plan })
      .eq('id', user.id);
    setIsSaving(false);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de changer de plan.',
        variant: 'destructive',
      });
      return;
    }

    await refreshProfile();
    toast({
      title: plan === 'starter' ? 'Abonnement annulé' : `Plan ${plan} activé !`,
      description: stripeReady
        ? 'Votre abonnement a été mis à jour.'
        : 'Stripe n’est pas encore configuré : le plan a été mis à jour sans paiement.',
    });
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsSaving(false);
    toast({
      title: 'Préférences sauvegardées',
      description: 'Vos préférences de notification ont été enregistrées.',
    });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Paramètres</h2>
        <p className="text-muted-foreground">
          Gérez votre compte et vos préférences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-auto">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Lock className="w-4 h-4" />
            Compte
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Abonnement
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Photo de profil</CardTitle>
              <CardDescription>
                Cette photo sera visible sur votre profil public
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Button variant="outline">
                      <Camera className="w-4 h-4 mr-2" />
                      Changer la photo
                    </Button>
                    <Button variant="ghost" className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG ou GIF. Max 2MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos informations de profil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || ''}
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  Pour changer votre email, contactez le support.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Parlez-nous de vous..."
                  rows={4}
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comptes Pinterest connectés</CardTitle>
              <CardDescription>
                Connectez vos comptes Pinterest pour publier automatiquement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`rounded-lg border p-3 text-sm ${
                  pinterestReady
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                {pinterestReady ? (
                  <p>
                    API Pinterest <strong>prête</strong>. Redirect URI (exacte) dans ton app
                    développeur :{' '}
                    <code className="text-xs break-all">{redirectUri}</code>
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium">Configurer l’API développeur Pinterest</p>
                    <ol className="list-decimal pl-4 space-y-1 text-xs sm:text-sm">
                      <li>
                        Ouvre{' '}
                        <a
                          href="https://developers.pinterest.com/apps/"
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-medium"
                        >
                          developers.pinterest.com/apps
                        </a>{' '}
                        (compte Business Pinterest)
                      </li>
                      <li>
                        À la création de l’app, le champ <strong>Website / URL du site</strong> doit
                        être une URL publique HTTPS — pas localhost. Utilise{' '}
                        <code className="break-all">{COMPANY.siteUrl}</code>
                      </li>
                      <li>
                        Politique de confidentialité :{' '}
                        <code className="break-all">{COMPANY.privacyUrl}</code>
                      </li>
                      <li>
                        Ensuite Manage → Configure → Redirect URIs. Si localhost est refusé, ajoute{' '}
                        <code className="break-all">
                          https://pingenx.io/dashboard/settings
                        </code>
                        . En local, ajoute aussi{' '}
                        <code className="break-all">{redirectUri}</code>
                      </li>
                      <li>Copie App ID + App secret et colle-les ci-dessous</li>
                      <li>Clique « Connecter mon compte Pinterest » (vrai OAuth)</li>
                    </ol>
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-sm font-medium">Clés de ton app Pinterest</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleCopyRedirectUri()}
                    >
                      Copier redirect URI
                    </Button>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a
                        href="https://developers.pinterest.com/apps/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ouvrir My Apps
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pinterestAppId">App ID</Label>
                    <Input
                      id="pinterestAppId"
                      placeholder="ex. 148xxxx"
                      value={pinterestAppIdInput}
                      onChange={(e) => setPinterestAppIdInput(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pinterestAppSecret">App secret</Label>
                    <Input
                      id="pinterestAppSecret"
                      type="password"
                      placeholder={pinterestConfig?.hasSecret ? '•••••••• (déjà enregistré)' : 'App secret key'}
                      value={pinterestAppSecretInput}
                      onChange={(e) => setPinterestAppSecretInput(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => void handleSavePinterestKeys()}
                  disabled={
                    isSavingPinterestKeys ||
                    !pinterestAppIdInput.trim() ||
                    !pinterestAppSecretInput.trim()
                  }
                >
                  {isSavingPinterestKeys ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    'Enregistrer les clés API'
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Le secret est stocké côté serveur local (<code>.env</code>), pas dans le
                  navigateur. Aucun redémarrage nécessaire après enregistrement.
                </p>
              </div>

              {(isConnectingPinterest || pinterestStatus) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg border p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {pinterestStatus || 'Connexion en cours…'}
                </div>
              )}

              {isLoadingAccounts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun compte Pinterest connecté.
                </p>
              ) : (
                accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">@{account.username}</p>
                        <p className="text-sm text-muted-foreground">
                          Connecté le {formatDate(account.created_at)}
                          {account.boards?.length
                            ? ` · ${account.boards.length} tableau(x)`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnectPinterest(account.id)}
                      disabled={isConnectingPinterest}
                    >
                      Déconnecter
                    </Button>
                  </div>
                ))
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  void handleConnectPinterest();
                }}
                disabled={isConnectingPinterest}
              >
                {isConnectingPinterest ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connexion…
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    {accounts.length === 0
                      ? 'Connecter mon compte Pinterest'
                      : 'Connecter un autre compte'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
              <CardDescription>
                Mettez à jour votre mot de passe pour plus de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={isSaving}>
                {isSaving ? 'Mise à jour...' : 'Mettre à jour'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
              <CardDescription>
                Choisissez comment vous souhaitez être notifié
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  title: 'Pins publiés',
                  description: 'Recevez une notification quand un Pin est publié',
                  defaultChecked: true,
                },
                {
                  title: 'Rapports hebdomadaires',
                  description: 'Recevez un résumé de vos performances chaque semaine',
                  defaultChecked: true,
                },
                {
                  title: 'Nouvelles fonctionnalités',
                  description: 'Soyez informé des nouvelles fonctionnalités',
                  defaultChecked: false,
                },
                {
                  title: 'Conseils et astuces',
                  description: 'Recevez des conseils pour améliorer vos Pins',
                  defaultChecked: true,
                },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <Switch defaultChecked={item.defaultChecked} />
                </div>
              ))}
              <Separator />
              <Button onClick={handleSaveNotifications} disabled={isSaving}>
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan actuel</CardTitle>
              <CardDescription>
                {stripeReady
                  ? 'Les upgrades Pro (19€) et Business (49€) passent par Stripe Checkout.'
                  : 'Stripe n’est pas encore configuré : les changements de plan restent locaux jusqu’à STRIPE_SECRET_KEY.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg capitalize">
                      {profile?.plan || 'Starter'}
                    </h3>
                    <Badge className="bg-primary">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {PLAN_PRICES[profile?.plan || 'starter']}
                  </p>
                </div>
                {profile?.plan === 'starter' && (
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => handleChangePlan('pro')}
                    disabled={isSaving}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Upgrader
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Inclus dans votre plan:</h4>
                <ul className="space-y-2">
                  {(
                    {
                      starter: [
                        '10 Pins par mois',
                        '1 compte Pinterest',
                        'Templates de base',
                        'Analytics basiques',
                      ],
                      pro: [
                        '100 Pins par mois',
                        '3 comptes Pinterest',
                        'Templates premium',
                        'Génération IA',
                        'Analytics avancés',
                        'Support prioritaire',
                      ],
                      business: [
                        'Pins illimités',
                        '10 comptes Pinterest',
                        'API d\'automatisation',
                        'Génération IA avancée',
                        'Support dédié 24/7',
                        'Collaboration d\'équipe',
                      ],
                    }[profile?.plan || 'starter']
                  ).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {profile?.plan !== 'starter' ? (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleChangePlan(profile?.plan === 'pro' ? 'business' : 'pro')
                      }
                      disabled={isSaving}
                    >
                      {profile?.plan === 'pro' ? 'Passer à Business' : 'Passer à Pro'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => handleChangePlan('starter')}
                      disabled={isSaving}
                    >
                      Annuler l'abonnement
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Separator />
                  <Button
                    variant="outline"
                    onClick={() => handleChangePlan('business')}
                    disabled={isSaving}
                  >
                    Passer à Business (49€/mois)
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
