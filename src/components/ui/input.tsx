import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, onClick, onFocus, ...props }: React.ComponentProps<"input">) {

  // ── Date : tout l'input ouvre le sélecteur (pas seulement l'icône calendrier)
  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (type === "date") {
      try {
        (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
      } catch {
        // showPicker non supporté sur certains navigateurs anciens — comportement natif en fallback
      }
    }
    onClick?.(e);
  };

  // ── Number : sélectionne tout au focus → taper remplace directement la valeur
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === "number") {
      e.target.select();
    }
    onFocus?.(e);
  };

  return (
    <input
      type={type}
      data-slot="input"
      onClick={handleClick}
      onFocus={handleFocus}
      className={cn(
        "file:text-foreground placeholder:text-slate-400 dark:placeholder:text-violet-300/50 text-slate-900 dark:text-slate-50 selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Date : curseur pointer sur tout l'input pour indiquer que c'est cliquable
        type === "date" && "cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
