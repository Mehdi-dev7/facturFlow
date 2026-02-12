"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MonthSelectorProps {
  value: Date;
  onChange: (date: Date) => void;
}

export function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const [open, setOpen] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(value.getFullYear(), i, 1);
    return { date, label: format(date, "MMMM", { locale: fr }) };
  });

  const currentLabel = format(value, "MMMM yyyy", { locale: fr });

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/20 dark:hover:bg-primary/80 dark:text-violet-400 dark:hover:text-violet-300 cursor-pointer"
        onClick={() => onChange(subMonths(value, 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 px-3 gap-2 text-sm font-medium capitalize border-slate-300 dark:border-violet-500/30 bg-white/80 dark:bg-violet-950/30 hover:bg-violet-50 dark:hover:bg-violet-500/10 text-slate-700 dark:text-slate-100 cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-violet-500" />
            {currentLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-44">
          {months.map((m) => (
            <DropdownMenuItem
              key={m.label}
              className={`capitalize cursor-pointer ${
                m.date.getMonth() === value.getMonth()
                  ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-semibold"
                  : ""
              }`}
              onClick={() => {
                onChange(m.date);
                setOpen(false);
              }}
            >
              {m.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/20 dark:hover:bg-primary/80 dark:text-violet-400 dark:hover:text-violet-300 cursor-pointer"
        onClick={() => onChange(addMonths(value, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
