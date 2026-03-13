import Image from "next/image";

interface LogoProps {
  variant?: "full" | "icon";
  theme?: "light" | "dark";
  width?: number;
  height?: number;
  className?: string;
}

export default function Logo({
  variant = "full",
  theme = "light",
  width,
  height,
  className,
}: LogoProps) {
  if (variant === "icon") {
    return (
      <Image
        src="/logo/icon.svg"
        alt="FacturNow"
        width={width ?? 40}
        height={height ?? 40}
        className={className}
        priority
      />
    );
  }

  const src = theme === "dark" ? "/logo/logo-white.svg" : "/logo/logo.svg";

  return (
    <Image
      src={src}
      alt="FacturNow"
      width={width ?? 200}
      height={height ?? 40}
      className={className}
      priority
    />
  );
}
