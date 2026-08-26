import {
  Configuration,
  CountryCode,
  DepositoryAccountSubtype,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from "plaid";

export type BankConnectionPurpose = "payout" | "payment";

/** Link uses Auth so landlords/tenants can connect a checking account without Transfer approval. */
const PLAID_LINK_PRODUCTS = [Products.Auth];

export function isPlaidConfigured() {
  return Boolean(process.env.PLAID_CLIENT_ID?.trim() && process.env.PLAID_SECRET?.trim());
}

export function getPlaidEnv() {
  const env = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();
  if (env === "production" || env === "development" || env === "sandbox") return env;
  return "sandbox";
}

export function getPlaidClient() {
  const clientId = process.env.PLAID_CLIENT_ID?.trim();
  const secret = process.env.PLAID_SECRET?.trim();
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

export function plaidLinkProducts() {
  return PLAID_LINK_PRODUCTS;
}

export function plaidCountryCodes() {
  return [CountryCode.Us];
}

export function plaidCheckingAccountFilters() {
  return {
    depository: {
      account_subtypes: [DepositoryAccountSubtype.Checking],
    },
  };
}
