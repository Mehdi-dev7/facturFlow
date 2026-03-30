"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  /** Lien de navigation — ignoré si onCtaClick est fourni */
  ctaHref?: string;
  ctaIcon?: React.ReactNode;
  ctaVariant?: "default" | "gradient" | "outline";
  /** Callback au clic — remplace la navigation si fourni */
  onCtaClick?: () => void;
  /** Boutons / actions supplémentaires affichés à gauche du CTA principal */
  extraActions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  ctaIcon,
  ctaVariant = "gradient",
  onCtaClick,
  extraActions,
}: PageHeaderProps) {
  const hasCta = ctaLabel && (ctaHref || onCtaClick);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl xs:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>

      {(hasCta || extraActions) && (
        <div className="flex items-center gap-2 lg:ml-auto">
          {/* Actions secondaires (ex: bouton Importer un BC) */}
          {extraActions}

          {/* CTA principal */}
          {hasCta && (
            onCtaClick ? (
              <Button
                variant={ctaVariant}
                size="lg"
                className="h-11 sm:h-12 px-6 sm:px-8 font-ui text-sm sm:text-base transition-all duration-300 cursor-pointer hover:scale-103 w-auto"
                onClick={onCtaClick}
              >
                {ctaIcon}
                {ctaLabel}
              </Button>
            ) : (
              <Button
                variant={ctaVariant}
                size="lg"
                className="h-11 sm:h-12 px-6 sm:px-8 font-ui text-sm sm:text-base transition-all duration-300 cursor-pointer hover:scale-103 w-auto"
                asChild
              >
                <Link href={ctaHref!}>
                  {ctaIcon}
                  {ctaLabel}
                </Link>
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
