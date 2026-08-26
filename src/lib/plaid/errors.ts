import { AxiosError } from "axios";

type PlaidErrorBody = {
  error_message?: string;
  error_code?: string;
  display_message?: string;
  error_type?: string;
};

export function plaidErrorMessage(error: unknown, fallback = "Plaid request failed") {
  if (error instanceof AxiosError) {
    const data = error.response?.data as PlaidErrorBody | undefined;
    if (data?.display_message) return data.display_message;
    if (data?.error_message) {
      return data.error_code ? `${data.error_message} (${data.error_code})` : data.error_message;
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
