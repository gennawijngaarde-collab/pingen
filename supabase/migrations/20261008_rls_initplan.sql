-- Performance: evaluate auth.uid() once per statement instead of once per row
-- (Supabase advisor auth_rls_initplan). Semantics unchanged.

ALTER POLICY "Users can view own usage" ON public.api_usage
  USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view own analytics" ON public.pin_analytics
  USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can create own pins" ON public.pins
  WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete own pins" ON public.pins
  USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update own pins" ON public.pins
  USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view own pins" ON public.pins
  USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can create own pinterest accounts" ON public.pinterest_accounts
  WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete own pinterest accounts" ON public.pinterest_accounts
  USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update own pinterest accounts" ON public.pinterest_accounts
  USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view own pinterest accounts" ON public.pinterest_accounts
  USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert own profile" ON public.profiles
  WITH CHECK (((select auth.uid()) = id));
ALTER POLICY "Users can update own profile" ON public.profiles
  USING (((select auth.uid()) = id));
ALTER POLICY "Users can view own profile" ON public.profiles
  USING (((select auth.uid()) = id));
ALTER POLICY "Users can view own subscription" ON public.subscriptions
  USING (((select auth.uid()) = user_id));
