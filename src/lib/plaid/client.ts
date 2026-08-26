import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from "plaid";

export type BankConnectionPurpose = "payout" | "payment";

export function cleanPlaidEnvValue(value: string | undefined | null) {
  return (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

export function isPlaidConfigured() {
  return Boolean(
    cleanPlaidEnvValue(process.env.PLAID_CLIENT_ID) &&
      cleanPlaidEnvValue(process.env.PLAID_SECRET),
  );
}

export function getPlaidEnv() {
  const env = cleanPlaidEnvValue(process.env.PLAID_ENV || "sandbox").toLowerCase();
  if (env === "production" || env === "development" || env === "sandbox") return env;
  return "sandbox";
}

export function getPlaidConfigStatus() {
  const clientId = cleanPlaidEnvValue(process.env.PLAID_CLIENT_ID);
  const secret = cleanPlaidEnvValue(process.env.PLAID_SECRET);
  const env = getPlaidEnv();
  const secretLooksStripe = /^sk_(live|test)_/i.test(secret);
  return {
    configured: Boolean(clientId && secret),
    env,
    clientIdLast4: clientId ? clientId.slice(-4) : null,
    clientIdPresent: Boolean(clientId),
    secretPresent: Boolean(secret),
    secretLooksSandbox:
      secret.startsWith("sandbox-") || secret.toLowerCase().includes("sandbox"),
    secretLooksStripe,
  };
}

/** Human-readable setup problem, or null if keys look usable. */
export function getPlaidConfigProblem() {
  const status = getPlaidConfigStatus();
  if (!status.clientIdPresent) {
    return "PLAID_CLIENT_ID is missing in Vercel. Paste Client ID from dashboard.plaid.com → Developers → Keys.";
  }
  if (!status.secretPresent) {
    return "PLAID_SECRET is missing in Vercel. Paste the Sandbox secret from the same Plaid Keys page.";
  }
  if (status.secretLooksStripe) {
    return "PLAID_SECRET looks like a Stripe key (sk_live_/sk_test_). Use the Plaid secret from dashboard.plaid.com, not Stripe.";
  }
  return null;
}

export function getPlaidClient() {
  const clientId = cleanPlaidEnvValue(process.env.PLAID_CLIENT_ID);
  const secret = cleanPlaidEnvValue(process.env.PLAID_SECRET);
  if (!clientId || !secret) {
    throw new Error("Plaid is not configured");
  }

  const env = getPlaidEnv();
  const basePath =
    env === "production"
      ? PlaidEnvironments.production
      : env === "development"
        ? PlaidEnvironments.development
        : PlaidEnvironments.sandbox;

  return new PlaidApi(
    new Configuration({
      basePath,
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": clientId,
          "PLAID-SECRET": secret,
        },
      },
    }),
  );
}

/** Link products — Auth is preferred; link-token route may fall back to Transactions. */
export function plaidLinkProducts() {
  return [Products.Auth];
}

export function plaidCountryCodes() {
  return [CountryCode.Us];
}
