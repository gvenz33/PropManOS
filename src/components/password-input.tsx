"use client";

import { useState } from "react";

type Props = {
  id: string;
  name: string;
  label?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

export function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  required,
  minLength,
  value,
  defaultValue,
  onChange,
  disabled,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
      ) : null}
      <div className={label ? "relative mt-1" : "relative"}>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 pr-10 text-sm outline-none ring-[var(--accent)] focus:ring-2 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--muted)] hover:text-[var(--foreground)]"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l18 18" />
              <path d="M10.58 10.58A2 2 0 0 0 12 15a2 2 0 0 0 1.42-.58" />
              <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c5 0 9.27 3.11 11 7.5a11.8 11.8 0 0 1-1.56 2.84" />
              <path d="M6.11 6.11A11.8 11.8 0 0 0 1 12.5C2.73 16.89 7 20 12 20a10.9 10.9 0 0 0 4.12-.8" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12.5C3.73 8.11 8 5 13 5s9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S3.73 16.89 2 12.5Z" />
              <circle cx="13" cy="12.5" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
