"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({ icon, title, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon && (
        <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-violet-500/10 flex items-center justify-center mb-4 text-slate-400 dark:text-violet-400">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</p>
      <p className="text-xs text-slate-400 dark:text-violet-400 mt-1 text-center max-w-sm">{description}</p>
      {ctaLabel && ctaHref && (
        <Button variant="gradient" className="mt-6 cursor-pointer" asChild>
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}
