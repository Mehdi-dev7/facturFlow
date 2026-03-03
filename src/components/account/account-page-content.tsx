"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserCircle2, Camera, Shield, Save, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileSchema, type ProfileFormData } from "@/lib/validations/account";
import { updateProfile } from "@/lib/actions/account";
import { ChangePasswordModal } from "@/components/account/change-password-modal";
import { DeleteAccountModal } from "@/components/account/delete-account-modal";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface AccountPageContentProps {
  user: {
    name: string;
    email: string;
    image: string | null;
    phone: string | null;
  };
  hasCredentials: boolean;
  oauthProviders: string[];
}

// ─── Icones OAuth ───────────────────────────────────────────────────────────────

const OAUTH_LABELS: Record<string, { label: string; color: string }> = {
  google: { label: "Google", color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" },
  github: { label: "GitHub", color: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300" },
  microsoft: { label: "Microsoft", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
};

// ─── Composant ──────────────────────────────────────────────────────────────────

export function AccountPageContent({ user, hasCredentials, oauthProviders }: AccountPageContentProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(user.image);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone ?? undefined,
      image: user.image,
    },
  });

  // ── Avatar upload (base64 optimistic preview) ───────────────────────────────
  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Limite 2 Mo
      if (file.size > 2 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 2 Mo");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setValue("image", base64);
      };
      reader.readAsDataURL(file);
    },
    [setValue]
  );

  // ── Initiales pour avatar par defaut ────────────────────────────────────────
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data: ProfileFormData) => {
    const result = await updateProfile(data);
    if (result.success) {
      toast.success("Profil mis à jour !");
    } else {
      toast.error(result.error ?? "Erreur lors de la mise à jour");
    }
  };

  // ── Styles partages ─────────────────────────────────────────────────────────
  const inputClass =
    "bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50";

  return (
    <div className="p-2 xs:p-4 sm:p-6 max-w-2xl mx-auto space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl xs:text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
          <UserCircle2 className="size-6 xs:size-7 text-violet-600 dark:text-violet-400" />
          Mon profil
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 xs:mt-2 text-[11px] xs:text-xs sm:text-sm">
          Gérez vos informations personnelles et la sécurité de votre compte
        </p>
      </div>

      {/* ── Card principale ────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-slate-900/50 rounded-2xl border border-violet-200 dark:border-violet-400/25 shadow-lg dark:shadow-violet-900/20 p-3 xs:p-4 sm:p-6 space-y-6"
      >
        {/* ── Section Avatar + Infos ─────────────────────────────────────── */}
        <section className="space-y-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserCircle2 className="size-4 text-violet-600 dark:text-violet-400" />
            Informations personnelles
          </h3>

          {/* Avatar */}
          <div className="flex items-center gap-4 xs:gap-5">
            <div
              className="relative size-20 xs:size-24 rounded-full overflow-hidden cursor-pointer ring-2 ring-violet-200 dark:ring-violet-400/30 group"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="size-full flex items-center justify-center bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 text-xl xs:text-2xl font-bold">
                  {initials}
                </div>
              )}
              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/40 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                <Camera className="size-4 xs:size-5" />
                <span className="text-[10px] xs:text-xs font-medium">Modifier</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Photo de profil
              </p>
              <p className="text-[11px] xs:text-xs text-slate-500 dark:text-slate-400">
                JPG, PNG ou WebP. Max 2 Mo.
              </p>
            </div>
          </div>

          {/* Champs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
            {/* Nom */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[11px] xs:text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                Nom complet *
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Jean Dupont"
                className={inputClass}
              />
              {errors.name && (
                <p className="text-[10px] xs:text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Telephone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-[11px] xs:text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                Telephone
              </Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="06 12 34 56 78"
                className={inputClass}
              />
            </div>
          </div>

          {/* Email (non modifiable) */}
          <div className="space-y-1.5">
            <Label className="text-[11px] xs:text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
              Adresse email
            </Label>
            <div className="relative">
              <Input
                disabled
                value={user.email}
                className={`${inputClass} opacity-60 cursor-not-allowed`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] xs:text-xs bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">
                Non modifiable
              </span>
            </div>
          </div>

          {/* Bouton Enregistrer */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-2 text-xs xs:text-sm cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Enregistrer
            </Button>
          </div>
        </section>

        {/* ── Divider ────────────────────────────────────────────────────── */}
        <div className="h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent" />

        {/* ── Section Securite ───────────────────────────────────────────── */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Shield className="size-4 text-violet-600 dark:text-violet-400" />
            Securite
          </h3>

          {hasCredentials ? (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 xs:p-4">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Mot de passe
                </p>
                <p className="text-[11px] xs:text-xs text-slate-500 dark:text-slate-400">
                  Modifiez votre mot de passe de connexion
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordModal(true)}
                className="rounded-xl border-violet-300 dark:border-violet-400/30 text-violet-600 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 gap-2 text-xs xs:text-sm cursor-pointer"
              >
                <Shield className="size-4" />
                Changer
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vous êtes connecté via un fournisseur OAuth. Aucun mot de passe à gérer.
              </p>
              <div className="flex flex-wrap gap-2">
                {oauthProviders.map((provider) => {
                  const info = OAUTH_LABELS[provider] ?? {
                    label: provider,
                    color: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                  };
                  return (
                    <span
                      key={provider}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${info.color}`}
                    >
                      {info.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Divider ────────────────────────────────────────────────────── */}
        <div className="h-px bg-linear-to-r from-transparent via-primary/30 dark:via-violet-300/30 to-transparent" />

        {/* ── Zone danger ────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Zone danger
          </h3>

          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-3 xs:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Supprimer mon compte
                </p>
                <p className="text-[11px] xs:text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
                  Cette action est irréversible. Toutes vos données seront définitivement supprimées conformément au RGPD.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl gap-2 text-xs xs:text-sm shrink-0 cursor-pointer"
              >
                <AlertTriangle className="size-4" />
                Supprimer
              </Button>
            </div>
          </div>
        </section>
      </form>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <ChangePasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
