"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getProducts, saveProduct, type SavedProduct } from "@/lib/actions/products";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onProductSelect: (product: {
    description: string;
    unitPrice: number;
    vatRate: number;
  }) => void;
  currentUnitPrice?: number; // Prix actuel de la ligne — pour sauvegarde et comparaison
  placeholder?: string;
  className?: string;
  "aria-invalid"?: boolean;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const dropdownClass =
  "absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-violet-200 dark:border-violet-400/30 bg-white dark:bg-[#1e1845] shadow-lg";

const itemClass =
  "flex items-center justify-between px-3 py-2 text-xs xs:text-sm text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-500/10 cursor-pointer rounded-lg transition-colors";

// ─── Composant ────────────────────────────────────────────────────────────────

export function ProductCombobox({
  value,
  onChange,
  onProductSelect,
  currentUnitPrice = 0,
  placeholder = "Description",
  className = "",
  "aria-invalid": ariaInvalid,
}: ProductComboboxProps) {
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Chargement initial ─────────────────────────────────────────────────────
  useEffect(() => {
    getProducts().then(setProducts).catch(() => {});
  }, []);

  // ── Fermer le dropdown au clic en dehors ───────────────────────────────────
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // ── Logique d'affichage de la case "Sauvegarder" ──────────────────────────
  // Produit du catalogue qui correspond exactement au nom tapé
  const matchingProduct = products.find(
    (p) => p.name.toLowerCase() === value.trim().toLowerCase()
  );
  // Vrai si le nom ET le prix correspondent au catalogue → rien à sauvegarder
  const isUnchanged =
    matchingProduct && Number(matchingProduct.unitPrice) === currentUnitPrice;

  // Montrer la case si : nom ≥ 2 chars + prix > 0 + pas identique au catalogue
  const showSaveCheckbox =
    value.trim().length >= 2 && currentUnitPrice > 0 && !isUnchanged;

  // Label adapté : "Mettre à jour" si le produit existe déjà avec un autre prix
  const saveLabel = matchingProduct
    ? `Mettre à jour "${value.trim()}" (${currentUnitPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €)`
    : `Sauvegarder "${value.trim()}" dans mon catalogue`;

  // ── Filtrage dropdown ──────────────────────────────────────────────────────
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(value.toLowerCase())
  );
  const showDropdown = isOpen && value.trim().length > 0 && filtered.length > 0;

  // ── Sélection d'un produit depuis la liste ─────────────────────────────────
  const handleSelect = useCallback(
    (product: SavedProduct) => {
      onProductSelect({
        description: product.name,
        unitPrice: product.unitPrice,
        vatRate: product.vatRate,
      });
      onChange(product.name);
      setIsOpen(false);
    },
    [onProductSelect, onChange]
  );

  // ── Sauvegarde immédiate au clic sur la case ───────────────────────────────
  const handleSave = useCallback(async () => {
    if (isSaving || !value.trim() || currentUnitPrice <= 0) return;
    setIsSaving(true);

    const result = await saveProduct({
      name: value.trim(),
      unitPrice: currentUnitPrice,
      vatRate: 20,
    });

    if (result.success) {
      toast.success(matchingProduct ? "Catalogue mis à jour" : "Produit sauvegardé", {
        description: `"${value.trim()}" — ${currentUnitPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`,
        duration: 3000,
      });
      const updated = await getProducts();
      setProducts(updated);
    } else {
      toast.error("Impossible de sauvegarder le produit");
    }

    setIsSaving(false);
  }, [isSaving, value, currentUnitPrice, matchingProduct]);

  return (
    <div ref={containerRef} className="relative">
      {/* ── Input description ───────────────────────────────────────────── */}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        className={[
          "flex h-9 w-full rounded-xl border px-3 py-1 shadow-sm transition-colors",
          "bg-white/90 dark:bg-[#2a2254]",
          "border-slate-300 dark:border-violet-400/30",
          "text-xs xs:text-sm text-slate-900 dark:text-slate-50",
          "placeholder:text-slate-400 dark:placeholder:text-violet-300/50",
          "focus:outline-none focus:ring-2 focus:ring-violet-400/50 dark:focus:ring-violet-400/40",
          "aria-[invalid=true]:border-red-400 dark:aria-[invalid=true]:border-red-400",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      />

      {/* ── Dropdown catalogue ──────────────────────────────────────────── */}
      {showDropdown && (
        <div className={dropdownClass}>
          <ul className="p-1 max-h-52 overflow-y-auto">
            {filtered.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  className={`w-full ${itemClass}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(product);
                  }}
                >
                  <span className="font-medium truncate">{product.name}</span>
                  <span className="shrink-0 ml-3 text-slate-400 dark:text-slate-500 text-xs">
                    {product.unitPrice.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} €
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Case "Sauvegarder" sous le champ — visible si nom + prix remplis ── */}
      {showSaveCheckbox && (
        <div className="flex items-center gap-1.5 mt-1">
          <input
            type="checkbox"
            id={`save-${value.trim().replace(/\s+/g, "-")}`}
            checked={false}
            onMouseDown={(e) => e.preventDefault()}
            onChange={handleSave}
            disabled={isSaving}
            className="size-3 rounded accent-violet-600 cursor-pointer"
          />
          <label
            htmlFor={`save-${value.trim().replace(/\s+/g, "-")}`}
            className="text-[10px] xs:text-xs text-slate-400 dark:text-violet-300/60 cursor-pointer select-none leading-tight"
          >
            {isSaving ? "Sauvegarde..." : saveLabel}
          </label>
        </div>
      )}
    </div>
  );
}
