"use client";

// Zone d'upload du logo avec drag & drop
// Convertit en base64 et stocke dans le champ companyLogo

import { useCallback, useRef, useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";

// ─── Props ────────────────────────────────────────────────────────────────────

interface LogoUploadProps {
  value: string | null;   // base64 ou URL actuelle
  onChange: (base64: string | null) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_SIZE_MB = 2;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function LogoUpload({ value, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Format non supporté. PNG, JPG, WebP ou SVG uniquement.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Fichier trop lourd. Maximum ${MAX_SIZE_MB} Mo.`);
      return;
    }

    const base64 = await fileToBase64(file);
    onChange(base64);
  }, [onChange]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset l'input pour permettre de re-sélectionner le même fichier
    e.target.value = "";
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
        Logo de l&apos;entreprise
      </label>

      {value ? (
        /* ── Aperçu du logo uploadé ── */
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-xl border-2 border-slate-200 dark:border-violet-500/30 bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center">
            <Image
              src={value}
              alt="Logo"
              fill
              className="object-contain p-2"
              unoptimized
            />
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline cursor-pointer text-left"
            >
              Changer le logo
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1 text-xs text-red-500 hover:underline cursor-pointer"
            >
              <X size={12} />
              Supprimer
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      ) : (
        /* ── Zone de drop ── */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 px-4 cursor-pointer transition-all ${
            isDragging
              ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10 scale-[1.01]"
              : "border-slate-300 dark:border-violet-500/30 hover:border-violet-400 dark:hover:border-violet-500/50 bg-slate-50/50 dark:bg-[#1a1438]"
          }`}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-500/20">
            {isDragging ? (
              <ImageIcon size={20} className="text-violet-600 dark:text-violet-400" />
            ) : (
              <Upload size={20} className="text-violet-600 dark:text-violet-400" />
            )}
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {isDragging ? "Relâchez pour uploader" : "Déposez votre logo ici"}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              ou <span className="text-violet-600 dark:text-violet-400 underline">parcourir</span> — PNG, JPG, SVG · Max {MAX_SIZE_MB} Mo
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <X size={12} />
          {error}
        </p>
      )}
    </div>
  );
}
