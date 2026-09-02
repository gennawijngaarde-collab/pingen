export interface SignupNotifyPayload {
  email: string;
  fullName: string;
}

/** Notifie l’admin (Resend) d’une nouvelle inscription. Échec silencieux. */
export async function notifySignup(payload: SignupNotifyPayload): Promise<void> {
  try {
    await fetch('/api/email/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'signup',
        email: payload.email,
        fullName: payload.fullName,
      }),
    });
  } catch {
    // L’inscription ne doit pas échouer si Resend n’est pas encore configuré.
  }
}
