"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaIcon?: React.ReactNode;
  ctaVariant?: "default" | "gradient" | "outline";
}

export function PageHeader({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  ctaIcon,
  ctaVariant = "gradient",
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {ctaLabel && ctaHref && (
        <Button
          variant={ctaVariant}
          size="lg"
          className="h-11 sm:h-12 px-6 sm:px-8 font-ui text-sm sm:text-base transition-all duration-300 cursor-pointer hover:scale-105 w-auto"
          asChild
        >
          <Link href={ctaHref}>
            {ctaIcon}
            {ctaLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
