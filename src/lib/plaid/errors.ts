type PlaidErrorBody = {
  error_message?: string;
  error_code?: string;
  display_message?: string | null;
  error_type?: string;
  request_id?: string;
};

function asPlaidErrorBody(value: unknown): PlaidErrorBody | null {
  if (!value || typeof value !== "object") return null;
  return value as PlaidErrorBody;
}

export function plaidErrorMessage(error: unknown, fallback = "Plaid request failed") {
  const anyError = error as {
    response?: { data?: unknown; status?: number };
    data?: unknown;
    message?: string;
    error_message?: string;
    error_code?: string;
    display_message?: string;
  };

  const data =
    asPlaidErrorBody(anyError?.response?.data) ??
    asPlaidErrorBody(anyError?.data) ??
    asPlaidErrorBody(error);

  if (data?.display_message) return data.display_message;
  if (data?.error_message) {
    const code = data.error_code ? ` (${data.error_code})` : "";
    return `${data.error_message}${code}`;
  }

  if (typeof anyError?.message === "string" && anyError.message && !/^Request failed with status code \d+$/.test(anyError.message)) {
    return anyError.message;
  }

  if (anyError?.response?.status) {
    return `${fallback} (HTTP ${anyError.response.status})`;
  }

  return fallback;
}

export function plaidErrorDetails(error: unknown) {
  const anyError = error as { response?: { data?: unknown; status?: number } };
  return {
    status: anyError?.response?.status ?? null,
    body: anyError?.response?.data ?? null,
    message: plaidErrorMessage(error),
  };
}
