type BankConnectionDisplay = {
  institution_name: string | null;
  account_name: string | null;
  account_mask: string | null;
};

export function formatBankLabel(connection: BankConnectionDisplay | null) {
  if (!connection) return null;
  const institution = connection.institution_name ?? "Bank";
  const mask = connection.account_mask ? `••••${connection.account_mask}` : "";
  const name = connection.account_name ?? "Account";
  return `${institution} — ${name}${mask ? ` ${mask}` : ""}`;
}
