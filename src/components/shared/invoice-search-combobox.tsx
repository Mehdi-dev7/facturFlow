"use client";

// Combobox de recherche de factures — remplace le <Select> simple sur les pages
// avoirs, reçus, bons de livraison. Filtre en temps réel par n°, client, montant.
//
// ⚠️ Le dropdown est rendu en `position: fixed` via createPortal pour s'échapper
// des parents avec backdrop-blur ou overflow:hidden (qui créent un stacking context).

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, X, Check } from "lucide-react";
import type { SavedInvoice } from "@/hooks/use-invoices";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientName(client: SavedInvoice["client"]): string {
  if (client.companyName) return client.companyName;
  return [client.firstName, client.lastName].filter(Boolean).join(" ") || client.email;
}

function formatAmount(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvoiceSearchComboboxProps {
  /** Liste de factures déjà filtrée par le parent (ex: PAID seulement pour avoirs) */
  invoices: SavedInvoice[];
  /** ID de la facture sélectionnée */
  value: string;
  /** Callback quand l'utilisateur sélectionne une facture */
  onChange: (invoiceId: string) => void;
  /** Texte du placeholder quand rien n'est sélectionné */
  placeholder?: string;
  /** Classe CSS additionnelle pour le wrapper */
  className?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function InvoiceSearchCombobox({
  invoices,
  value,
  onChange,
  placeholder = "Sélectionner une facture...",
  className = "",
}: InvoiceSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Position du dropdown en fixed (calculée depuis le trigger)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Attendre le montage côté client pour createPortal
  useEffect(() => { setMounted(true); }, []);

  // Calcul de la position fixed à partir du trigger
  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 320; // max-height approx

    // Si pas assez de place en dessous → ouvrir au-dessus
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setDropdownStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  // Fermer au clic extérieur (trigger + dropdown)
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
      setQuery("");
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // Mettre à jour la position si scroll/resize pendant que c'est ouvert
  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [open, updateDropdownPosition]);

  // Focus input dès l'ouverture
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Facture actuellement sélectionnée
  const selectedInvoice = useMemo(
    () => invoices.find((inv) => inv.id === value) ?? null,
    [invoices, value],
  );

  // Filtrage intelligent selon la nature de la requête :
  // - Chiffres uniquement → recherche par montant (préfixe sur la partie entière)
  // - Texte → recherche par n° de facture (contient) et nom client (contient)
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return invoices;

    const isAmountQuery = /^\d[\d\s]*$/.test(q); // que des chiffres (et espaces)

    if (isAmountQuery) {
      // Comparer sur la partie entière du montant (sans espace), ex: "150" → 150€, 1500€...
      const digits = q.replace(/\s/g, "");
      return invoices.filter((inv) =>
        String(Math.floor(inv.total)).startsWith(digits),
      );
    }

    // Recherche textuelle : n° facture ou client
    const qLower = q.toLowerCase();
    return invoices.filter((inv) => {
      const client = getClientName(inv.client).toLowerCase();
      return inv.number.toLowerCase().includes(qLower) || client.includes(qLower);
    });
  }, [invoices, query]);

  const handleSelect = useCallback(
    (invoiceId: string) => {
      onChange(invoiceId);
      setOpen(false);
      setQuery("");
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      setOpen(false);
      setQuery("");
    },
    [onChange],
  );

  const handleToggle = useCallback(() => {
    if (!open) updateDropdownPosition();
    setOpen((prev) => !prev);
    if (open) setQuery("");
  }, [open, updateDropdownPosition]);

  // ── Dropdown rendu via portal (hors de tout stacking context) ──────────────
  const dropdown = mounted && open ? createPortal(
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      role="listbox"
      aria-label="Sélectionner une facture"
      className="rounded-xl border border-primary/20 dark:border-violet-400/30
        bg-linear-to-b from-violet-50 via-white to-white
        dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438]
        shadow-xl dark:shadow-violet-950/60
        overflow-hidden"
    >
      {/* Input de recherche */}
      <div className="sticky top-0 px-2.5 pt-2.5 pb-1.5 bg-violet-50 dark:bg-[#2a2254] border-b border-slate-200/60 dark:border-violet-500/20">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 dark:text-violet-400/60 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="N° facture, client ou montant (chiffres)..."
            className="w-full pl-8 pr-3 py-1.5
              rounded-lg border border-slate-200 dark:border-violet-400/20
              bg-white dark:bg-[#1e1845]
              text-[11px] xs:text-xs sm:text-sm
              text-slate-900 dark:text-violet-100
              placeholder:text-slate-400 dark:placeholder:text-violet-400/50
              focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-violet-500/30
              transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-violet-400/60 dark:hover:text-violet-300 cursor-pointer"
              aria-label="Effacer la recherche"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Liste des résultats */}
      <div className="max-h-60 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <p className="px-4 py-3 text-xs text-slate-400 dark:text-violet-400/60 italic text-center">
            Aucune facture ne correspond à &quot;{query}&quot;
          </p>
        ) : (
          filtered.map((inv) => {
            const isSelected = inv.id === value;
            return (
              <button
                key={inv.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(inv.id)}
                className={`w-full flex items-center gap-2 xs:gap-3 px-3 py-2.5
                  text-left transition-colors cursor-pointer
                  ${isSelected
                    ? "bg-violet-100 dark:bg-violet-500/25"
                    : "hover:bg-violet-50 dark:hover:bg-violet-500/10"
                  }`}
              >
                <span className="font-bold text-[11px] xs:text-xs sm:text-sm text-violet-700 dark:text-violet-300 shrink-0 tabular-nums">
                  {inv.number}
                </span>
                <span className="flex-1 text-[10px] xs:text-[11px] sm:text-xs text-slate-500 dark:text-violet-400/80 truncate">
                  {getClientName(inv.client)}
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] xs:text-xs sm:text-sm font-semibold text-slate-700 dark:text-violet-200 tabular-nums">
                    {formatAmount(inv.total)}
                  </span>
                  {isSelected && (
                    <Check className="size-3 text-violet-600 dark:text-violet-400" />
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Compteur quand recherche active */}
      {query && filtered.length > 0 && (
        <div className="border-t border-slate-200/60 dark:border-violet-500/20 px-3 py-1.5">
          <p className="text-[10px] xs:text-[11px] text-slate-400 dark:text-violet-400/50">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""} sur {invoices.length}
          </p>
        </div>
      )}
    </div>,
    document.body,
  ) : null;

  return (
    <div className={`relative flex-1 max-w-xs sm:max-w-sm md:max-w-lg ${className}`}>
      {/* ── Trigger ─────────────────────────────────────────────────── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full flex items-center gap-2 h-auto min-h-9 px-3 py-1.5
          bg-white/90 dark:bg-[#2a2254]/80
          border border-slate-300 dark:border-violet-400/30
          rounded-xl text-left
          text-[11px] xs:text-xs sm:text-sm
          text-slate-900 dark:text-violet-100
          shadow-xs hover:border-primary/50 dark:hover:border-violet-400/60
          transition-colors cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {selectedInvoice ? (
          <span className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-bold text-violet-700 dark:text-violet-300 shrink-0">
              {selectedInvoice.number}
            </span>
            <span className="flex-1 text-slate-500 dark:text-violet-400/80 truncate">
              {getClientName(selectedInvoice.client)}
            </span>
            <span className="font-semibold text-slate-700 dark:text-violet-200 tabular-nums shrink-0">
              {formatAmount(selectedInvoice.total)}
            </span>
          </span>
        ) : (
          <span className="flex-1 text-slate-400 dark:text-violet-400/50">{placeholder}</span>
        )}

        {selectedInvoice ? (
          <X
            className="size-3.5 text-slate-400 hover:text-slate-600 dark:text-violet-400/60 dark:hover:text-violet-300 shrink-0 transition-colors"
            onClick={handleClear}
            aria-label="Effacer la sélection"
          />
        ) : (
          <ChevronDown
            className={`size-3.5 text-slate-400 dark:text-violet-400/60 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Dropdown injecté dans document.body */}
      {dropdown}
    </div>
  );
}
