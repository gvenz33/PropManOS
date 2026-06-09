"use client";

type Props = {
  message: string;
  formAction: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
};

export function ConfirmSubmitButton({ message, formAction, children, className }: Props) {
  return (
    <button
      type="submit"
      formAction={formAction}
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {children}
    </button>
  );
}
