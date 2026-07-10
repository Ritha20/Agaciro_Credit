const BASE_URL = "https://sandbox.momodeveloper.mtn.com";
const ENV = process.env.MOMO_ENV || "sandbox";

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.MOMO_API_USER}:${process.env.MOMO_API_KEY}`
  ).toString("base64");

  const res = await fetch(`${BASE_URL}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY!,
      "Content-Length": "0",
    },
  });

  if (!res.ok) throw new Error(`MoMo token error: ${res.status}`);
  const data = await res.json() as any;
  if (!data.access_token) throw new Error("No access token returned");
  return data.access_token;
}

export async function validateMoMoAccount(
  phone: string
): Promise<{ valid: boolean; name?: string }> {
  try {
    const token = await getAccessToken();
    // Strip all non-digits, remove leading 0, ensure country code
    let msisdn = phone.replace(/\D/g, "");
    if (msisdn.startsWith("0")) msisdn = "250" + msisdn.slice(1);

    const res = await fetch(
      `${BASE_URL}/collection/v1_0/accountholder/msisdn/${msisdn}/basicuserinfo`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY!,
          "X-Target-Environment": ENV,
        },
      }
    );

    if (res.ok) {
      const data = await res.json() as any;
      return { valid: true, name: data.name || data.given_name };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export async function getMoMoBalance(): Promise<{
  amount: number;
  currency: string;
} | null> {
  try {
    const token = await getAccessToken();

    const res = await fetch(`${BASE_URL}/collection/v2_0/account/balance`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY!,
        "X-Target-Environment": ENV,
      },
    });

    if (res.ok) {
      const data = await res.json() as any;
      return {
        amount: parseFloat(data.availableBalance || "0"),
        currency: data.currency || "RWF",
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Convert balance to a 0–100 score
export function balanceToScore(amount: number, currency: string): number {
  // Normalise everything to RWF
  let rwf = amount;
  if (currency === "EUR") rwf = amount * 1300;
  else if (currency === "USD") rwf = amount * 1200;
  else if (currency === "KES") rwf = amount * 9.3;
  else if (currency === "TZS") rwf = amount * 0.44;

  if (rwf >= 500_000) return 100;
  if (rwf >= 200_000) return 85;
  if (rwf >= 100_000) return 70;
  if (rwf >= 50_000)  return 55;
  if (rwf >= 20_000)  return 40;
  if (rwf >= 5_000)   return 25;
  return 10;
}
