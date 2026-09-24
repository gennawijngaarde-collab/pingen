'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { fmt } from '@/i18n/fmt';
import type { SettingsDictionary } from '@/i18n/sections/settings';
import {
  supabase,
  isDemoMode,
  getUserPinterestAccounts,
  getUserSubscription,
  connectPinterestAccount,
  updateOwnProfile,
  type PinterestAccount,
} from '@/lib/supabase';
import { compressProfileImage } from '@/lib/profileImage';
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

const MIN_PASSWORD_LENGTH = 6;

type PlanKey = 'starter' | 'pro' | 'business';

const getPlanFeatures = (s: SettingsDictionary): Record<PlanKey, string[]> => ({
  starter: [
    s.features.starterPins,
    s.features.starterAccounts,
    s.features.basicTemplates,
    s.features.basicAnalytics,
  ],
  pro: [
    s.features.proPins,
    s.features.proAccounts,
    s.features.premiumTemplates,
    s.features.aiGeneration,
    s.features.advancedAnalytics,
    s.features.prioritySupport,
  ],
  business: [
    s.features.unlimitedPins,
    s.features.businessAccounts,
    s.features.automationApi,
    s.features.advancedAi,
    s.features.dedicatedSupport,
    s.features.teamCollaboration,
  ],
});

export function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { t, dateLocale } = useI18n();
  const s = t.settings;

  const planPrices = useMemo<Record<PlanKey, string>>(
    () => ({
      starter: t.common.free,
      pro: s.planPricePro,
      business: s.planPriceBusiness,
    }),
    [t.common.free, s.planPricePro, s.planPriceBusiness]
  );
  const planFeatures = useMemo(() => getPlanFeatures(s), [s]);
  const notificationItems = useMemo(
    () => [
      { title: s.notifPinsPublishedTitle, description: s.notifPinsPublishedDesc, defaultChecked: true },
      { title: s.notifWeeklyReportsTitle, description: s.notifWeeklyReportsDesc, defaultChecked: true },
      { title: s.notifNewFeaturesTitle, description: s.notifNewFeaturesDesc, defaultChecked: false },
      { title: s.notifTipsTitle, description: s.notifTipsDesc, defaultChecked: true },
    ],
    [s]
  );
  const currentPlan: PlanKey = profile?.plan || 'starter';
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [accounts, setAccounts] = useState<PinterestAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isConnectingPinterest, setIsConnectingPinterest] = useState(false);
  const [pinterestStatus, setPinterestStatus] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);

  useEffect(() => {
    void fetchPinterestRuntimeConfig();
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
    setAvatarUrl(profile?.avatar_url || null);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    try {
      setBio(localStorage.getItem(`pingen_profile_bio_${user.id}`) || '');
    } catch {
      setBio('');
    }
  }, [user]);

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
        title: s.oauthCanceledTitle,
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
        title: s.oauthInvalidTitle,
        description: s.oauthInvalidDesc,
        variant: 'destructive',
      });
      clearOAuthParams();
      return;
    }

    sessionStorage.setItem(lockKey, 'processing');
    clearOAuthState();
    setIsConnectingPinterest(true);
    setPinterestStatus(s.finalizingConnection);

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
          title: s.pinterestConnectedTitle,
          description: fmt(s.pinterestConnectedDesc, {
            username: result.user.username,
            count: result.boards.length,
          }),
        });
        setPinterestStatus(null);
      } catch (error) {
        console.error(error);
        sessionStorage.removeItem(lockKey);
        toast({
          title: s.pinterestConnectFailedTitle,
          description: error instanceof Error ? error.message : s.pinterestConnectFailedDesc,
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
        title: s.nameRequiredTitle,
        description: s.nameRequiredDesc,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    const { error } = await updateOwnProfile(user.id, {
      full_name: fullName,
      avatar_url: avatarUrl,
    });
    setIsSaving(false);

    if (error) {
      toast({
        title: s.errorTitle,
        description: error,
        variant: 'destructive',
      });
      return;
    }

    try {
      localStorage.setItem(`pingen_profile_bio_${user.id}`, bio.trim());
    } catch {
      // ignore quota
    }

    await refreshProfile();
    toast({
      title: s.profileSavedTitle,
      description: s.profileSavedDesc,
    });
  };

  const persistAvatar = async (nextUrl: string | null): Promise<boolean> => {
    if (!user) return false;
    setIsSavingPhoto(true);
    const { error } = await updateOwnProfile(user.id, { avatar_url: nextUrl });
    setIsSavingPhoto(false);
    if (error) {
      toast({
        title: s.photoNotSavedTitle,
        description: error,
        variant: 'destructive',
      });
      return false;
    }
    setAvatarUrl(nextUrl);
    await refreshProfile();
    return true;
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsSavingPhoto(true);
    try {
      const dataUrl = await compressProfileImage(file);
      const saved = await persistAvatar(dataUrl);
      if (saved) toast({ title: s.photoUpdatedTitle });
    } catch (error) {
      setIsSavingPhoto(false);
      toast({
        title: s.photoFailedTitle,
        description: error instanceof Error ? error.message : s.photoFailedDesc,
        variant: 'destructive',
      });
    }
  };

  const handlePhotoDelete = async () => {
    const saved = await persistAvatar(null);
    if (saved) toast({ title: s.photoDeletedTitle });
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: s.missingFieldsTitle,
        description: s.missingFieldsDesc,
        variant: 'destructive',
      });
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast({
        title: s.passwordTooShortTitle,
        description: fmt(s.passwordTooShortDesc, { min: MIN_PASSWORD_LENGTH }),
        variant: 'destructive',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: s.passwordMismatchTitle,
        description: s.passwordMismatchDesc,
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
        title: s.passwordUpdatedTitle,
        description: isDemoMode ? s.passwordUpdatedDemoDesc : s.passwordUpdatedDesc,
      });
    } catch (error) {
      toast({
        title: s.errorTitle,
        description: error instanceof Error ? error.message : s.passwordChangeFailedDesc,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handleConnectPinterest = async () => {
    if (!user) return;

    setIsConnectingPinterest(true);
    setPinterestStatus(null);

    try {
      const config = await fetchPinterestRuntimeConfig();

      if (config.appId || config.configured || hasPinterestConfig) {
        setPinterestStatus(s.redirectingToPinterest);
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
        title: s.demoConnectedTitle,
        description: s.demoConnectedDesc,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: s.errorTitle,
        description: error instanceof Error ? error.message : s.connectFailedDesc,
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
        title: s.errorTitle,
        description: s.disconnectFailedDesc,
        variant: 'destructive',
      });
      return;
    }

    const refreshed = await getUserPinterestAccounts(user!.id);
    setAccounts(refreshed || []);
    await syncAccountCount((refreshed || []).length);
    toast({ title: s.accountDisconnectedTitle });
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
        title: s.paymentCanceledTitle,
        description: s.paymentCanceledDesc,
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
          title: fmt(s.planActivatedTitle, { plan: confirmed.plan }),
          description: s.paymentConfirmedDesc,
        });
      } catch (error) {
        toast({
          title: s.paymentNotConfirmedTitle,
          description: error instanceof Error ? error.message : s.paymentNotConfirmedDesc,
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
        clearBillingParams();
      }
    })();
  }, [refreshProfile, searchParams, setSearchParams, toast, user, s]);

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
          description: error instanceof Error ? error.message : s.checkoutFailedDesc,
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
          description: error instanceof Error ? error.message : s.portalFailedDesc,
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
        title: s.errorTitle,
        description: s.planChangeFailedDesc,
        variant: 'destructive',
      });
      return;
    }

    await refreshProfile();
    toast({
      title:
        plan === 'starter'
          ? s.subscriptionCanceledTitle
          : fmt(s.planActivatedExclaimTitle, { plan }),
      description: stripeReady ? s.subscriptionUpdatedDesc : s.planUpdatedNoStripeDesc,
    });
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsSaving(false);
    toast({
      title: s.notificationsSavedTitle,
      description: s.notificationsSavedDesc,
    });
  };

  const formatDate = (iso: string) => format(new Date(iso), 'PPP', { locale: dateLocale });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{s.title}</h2>
        <p className="text-muted-foreground">{s.subtitle}</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-auto">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            {s.tabProfile}
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Lock className="w-4 h-4" />
            {s.tabAccount}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            {s.tabNotifications}
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="w-4 h-4" />
            {s.tabBilling}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{s.photoTitle}</CardTitle>
              <CardDescription>{s.photoDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                <Avatar className="w-24 h-24 shrink-0">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3 min-w-0 w-full">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      void handlePhotoChange(event);
                    }}
                  />
                  <div className="flex flex-wrap gap-2 min-w-0">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-w-0"
                      disabled={isSavingPhoto}
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {isSavingPhoto ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 mr-2 shrink-0" />
                      )}
                      <span className="truncate">{s.changePhoto}</span>
                    </Button>
                    {avatarUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-red-600 shrink-0 px-3"
                        disabled={isSavingPhoto}
                        onClick={() => {
                          void handlePhotoDelete();
                        }}
                        aria-label={s.deletePhotoAria}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline ml-2">{s.delete}</span>
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{s.photoHint}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{s.personalInfoTitle}</CardTitle>
              <CardDescription>{s.personalInfoDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{s.firstName}</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{s.lastName}</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{s.email}</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || ''}
                  disabled
                />
                <p className="text-sm text-muted-foreground">{s.emailHint}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">{s.bio}</Label>
                <Textarea
                  id="bio"
                  placeholder={s.bioPlaceholder}
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? s.saving : s.save}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{s.pinterestAccountsTitle}</CardTitle>
              <CardDescription>{s.pinterestAccountsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {(isConnectingPinterest || pinterestStatus) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg border p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {pinterestStatus || s.connecting}
                </div>
              )}

              {isLoadingAccounts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {s.noPinterestAccounts}
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
                          {fmt(s.connectedOn, { date: formatDate(account.created_at) })}
                          {account.boards?.length
                            ? ` · ${fmt(s.boardsCount, { count: account.boards.length })}`
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
                      {s.disconnect}
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
                    {s.connectingShort}
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    {accounts.length === 0 ? s.connectFirstAccount : s.connectAnotherAccount}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{s.changePasswordTitle}</CardTitle>
              <CardDescription>{s.changePasswordDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{s.currentPassword}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{s.newPassword}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{s.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={isSaving}>
                {isSaving ? s.updating : s.update}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{s.notificationsTitle}</CardTitle>
              <CardDescription>{s.notificationsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {notificationItems.map((item, index) => (
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
                {isSaving ? s.saving : s.save}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{s.currentPlanTitle}</CardTitle>
              <CardDescription>
                {stripeReady ? s.billingStripeReadyDesc : s.billingStripeNotReadyDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg capitalize">
                      {profile?.plan || 'Starter'}
                    </h3>
                    <Badge className="bg-primary">{s.active}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{planPrices[currentPlan]}</p>
                </div>
                {profile?.plan === 'starter' && (
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => handleChangePlan('pro')}
                    disabled={isSaving}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {s.upgrade}
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">{s.includedInPlan}</h4>
                <ul className="space-y-2">
                  {planFeatures[currentPlan].map((feature, index) => (
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
                      {profile?.plan === 'pro' ? s.switchToBusiness : s.switchToPro}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => handleChangePlan('starter')}
                      disabled={isSaving}
                    >
                      {s.cancelSubscription}
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
                    {s.switchToBusinessWithPrice}
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
