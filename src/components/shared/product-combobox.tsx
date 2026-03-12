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
  placeholder?: string;
  className?: string;
  "aria-invalid"?: boolean;
}

// ─── Styles partagés avec les autres forms ────────────────────────────────────

// Même style que dans invoice-form / quote-form
const dropdownClass =
  "absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-violet-200 dark:border-violet-400/30 bg-white dark:bg-[#1e1845] shadow-lg";

const itemClass =
  "flex items-center justify-between px-3 py-2 text-xs xs:text-sm text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-500/10 cursor-pointer rounded-lg transition-colors";

// ─── Composant ────────────────────────────────────────────────────────────────

export function ProductCombobox({
  value,
  onChange,
  onProductSelect,
  placeholder = "Description",
  className = "",
  "aria-invalid": ariaInvalid,
}: ProductComboboxProps) {
  // Liste complète chargée une seule fois au montage
  const [products, setProducts] = useState<SavedProduct[]>([]);
  // Contrôle l'ouverture du dropdown
  const [isOpen, setIsOpen] = useState(false);
  // Checkbox "Sauvegarder ce produit"
  const [wantSave, setWantSave] = useState(false);
  // Évite de sauvegarder deux fois la même valeur
  const lastSavedRef = useRef<string>("");

  const containerRef = useRef<HTMLDivElement>(null);

  // ── Chargement initial des produits ────────────────────────────────────────
  useEffect(() => {
    getProducts().then(setProducts).catch(() => {
      // Silencieux — le catalogue produit est une feature bonus
    });
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

  // ── Filtrage des produits selon la saisie ──────────────────────────────────
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(value.toLowerCase())
  );

  // Afficher le dropdown seulement si l'input est non vide ET le champ est actif
  const showDropdown = isOpen && value.trim().length > 0;
  // Afficher le bouton "Sauvegarder" si aucun produit ne correspond exactement
  const showSaveRow =
    showDropdown &&
    value.trim().length >= 2 &&
    !products.some((p) => p.name.toLowerCase() === value.toLowerCase());

  // ── Sélection d'un produit dans la liste ───────────────────────────────────
  const handleSelect = useCallback(
    (product: SavedProduct) => {
      onProductSelect({
        description: product.name,
        unitPrice: product.unitPrice,
        vatRate: product.vatRate,
      });
      onChange(product.name);
      setIsOpen(false);
      setWantSave(false);
    },
    [onProductSelect, onChange]
  );

  // ── Sauvegarde en background au blur si checkbox cochée ────────────────────
  const handleBlur = useCallback(async () => {
    if (!wantSave || !value.trim() || value.trim() === lastSavedRef.current) return;

    lastSavedRef.current = value.trim();
    setWantSave(false);

    const result = await saveProduct({
      name: value.trim(),
      unitPrice: 0, // Pas de prix connu depuis la description seule
      vatRate: 20,  // TVA par défaut
    });

    if (result.success) {
      toast.success("Produit sauvegardé", {
        description: `"${value.trim()}" ajouté à votre catalogue`,
        duration: 3000,
      });
      // Rafraîchir la liste locale
      const updated = await getProducts();
      setProducts(updated);
    } else {
      toast.error("Impossible de sauvegarder le produit");
    }
  }, [wantSave, value]);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        // Même style que les <Input> du projet (inputClass)
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
          setWantSave(false);
        }}
        onBlur={handleBlur}
      />

      {/* ── Dropdown ────────────────────────────────────────────────────── */}
      {showDropdown && (filtered.length > 0 || showSaveRow) && (
        <div className={dropdownClass}>
          <ul className="p-1 max-h-52 overflow-y-auto">
            {filtered.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  className={`w-full ${itemClass}`}
                  // onMouseDown plutôt que onClick pour déclencher avant le onBlur de l'input
                  onMouseDown={(e) => {
                    e.preventDefault(); // Empêche le blur de l'input
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

          {/* ── Ligne "Sauvegarder ce produit" ─────────────────────────── */}
          {showSaveRow && (
            <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 dark:border-violet-400/20 text-xs text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                id="product-save-checkbox"
                checked={wantSave}
                // onMouseDown pour ne pas déclencher le blur de l'input parent
                onMouseDown={(e) => e.preventDefault()}
                onChange={(e) => setWantSave(e.target.checked)}
                className="size-3.5 rounded accent-violet-600 cursor-pointer"
              />
              <label
                htmlFor="product-save-checkbox"
                className="cursor-pointer select-none"
              >
                Sauvegarder &quot;{value.trim()}&quot; dans mon catalogue
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
