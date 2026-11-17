// Server code only. Checks a Cloudflare Turnstile answer with the secret key.
// Without TURNSTILE_SECRET_KEY the check is off (returns true), so the site keeps working before the keys are set.

export const turnstileOn = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyHuman(token: unknown, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token || token.length > 4096) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) });
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const d = (await r.json()) as { success?: boolean };
    return d.success === true;
  } catch {
    return false;
  }
}
