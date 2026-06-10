import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

type BrandLogoProps = {
  variant?: "full" | "icon";
  href?: string;
  className?: string;
  priority?: boolean;
  /** Light circular badge behind icon — useful on dark footers */
  iconBadge?: boolean;
};

export function BrandLogo({
  variant = "full",
  href = "/",
  className = "",
  priority = false,
  iconBadge = false,
}: BrandLogoProps) {
  const isIcon = variant === "icon";
  const src = isIcon ? BRAND.icon : BRAND.logo;
  const width = isIcon ? 48 : 280;
  const height = isIcon ? 48 : 80;

  const image = isIcon ? (
    <span
      className={
        iconBadge
          ? "brand-icon-badge inline-flex h-12 w-12 items-center justify-center"
          : "inline-flex h-12 w-12 items-center justify-center"
      }
    >
      <Image
        src={src}
        alt={BRAND.name}
        width={width}
        height={height}
        priority={priority}
        className="h-10 w-10 object-contain"
      />
    </span>
  ) : (
    <Image
      src={src}
      alt={BRAND.name}
      width={width}
      height={height}
      priority={priority}
      className="h-auto w-auto max-h-16 sm:max-h-20"
    />
  );

  if (!href) {
    return <span className={`inline-flex items-center ${className}`}>{image}</span>;
  }

  return (
    <Link href={href} className={`inline-flex items-center ${className}`}>
      {image}
    </Link>
  );
}
