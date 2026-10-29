const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function getSecret(): string {
  return (
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ??
    "1x0000000000000000000000000000000AA"
  );
}

export async function verifyCaptcha(token: string): Promise<boolean> {
  if (!token) return false;

  const formData = new URLSearchParams();
  formData.append("secret", getSecret());
  formData.append("response", token);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      cache: "no-store",
    });

    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification failed:", err);
    return false;
  }
}