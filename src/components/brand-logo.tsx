import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

type BrandLogoProps = {
  variant?: "full" | "icon";
  href?: string;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  variant = "full",
  href = "/",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const isIcon = variant === "icon";
  const src = isIcon ? BRAND.icon : BRAND.logo;
  const width = isIcon ? 44 : 280;
  const height = isIcon ? 44 : 80;

  const image = (
    <Image
      src={src}
      alt={BRAND.name}
      width={width}
      height={height}
      priority={priority}
      className={isIcon ? "rounded-full" : "h-auto w-auto max-h-16 sm:max-h-20"}
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
