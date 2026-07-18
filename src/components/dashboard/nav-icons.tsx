import type { DashboardIconName } from "./nav-types";

type IconProps = { className?: string };

function Icon({
  className = "h-5 w-5",
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function DashboardNavIcon({
  name,
  className = "h-5 w-5",
}: {
  name: DashboardIconName;
  className?: string;
}) {
  switch (name) {
    case "home":
      return (
        <Icon className={className}>
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </Icon>
      );
    case "properties":
      return (
        <Icon className={className}>
          <path d="M3 21h18" />
          <path d="M5 21V8l7-4 7 4v13" />
          <path d="M10 21v-6h4v6" />
        </Icon>
      );
    case "rent":
      return (
        <Icon className={className}>
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </Icon>
      );
    case "bank":
      return (
        <Icon className={className}>
          <path d="M3 10 12 3l9 7" />
          <path d="M5 10v8h14v-8" />
          <path d="M3 21h18" />
          <path d="M9 14h.01M12 14h.01M15 14h.01" />
        </Icon>
      );
    case "documents":
      return (
        <Icon className={className}>
          <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M9 13h6M9 17h6" />
        </Icon>
      );
    case "repairs":
      return (
        <Icon className={className}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </Icon>
      );
    case "reports":
      return (
        <Icon className={className}>
          <path d="M4 19h16" />
          <path d="M7 16V9" />
          <path d="M12 16V5" />
          <path d="M17 16v-4" />
        </Icon>
      );
    case "crm":
    case "people":
      return (
        <Icon className={className}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9.5" cy="7" r="3.5" />
          <path d="M20 21v-2a3.5 3.5 0 0 0-2.5-3.35" />
          <path d="M16 3.1a3.5 3.5 0 0 1 0 6.8" />
        </Icon>
      );
    case "settings":
      return (
        <Icon className={className}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </Icon>
      );
    case "faq":
      return (
        <Icon className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.1 9a3 3 0 1 1 4.4 2.7c-.7.5-1.1 1-1.1 1.8V14" />
          <path d="M12 17h.01" />
        </Icon>
      );
    case "tools":
      return (
        <Icon className={className}>
          <path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L3 18l3 3 6.1-6.1a4 4 0 0 0 5.6-5.6" />
          <path d="m15 7 2 2" />
        </Icon>
      );
    case "more":
      return (
        <Icon className={className}>
          <circle cx="6" cy="12" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.1" fill="currentColor" stroke="none" />
        </Icon>
      );
    default:
      return null;
  }
}
