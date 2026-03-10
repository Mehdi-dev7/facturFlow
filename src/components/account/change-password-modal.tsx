"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/validations/account";
import { changePassword } from "@/lib/actions/account";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Indicateur de force du mot de passe ────────────────────────────────────────

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Faible", color: "bg-red-500" },
    { label: "Faible", color: "bg-red-500" },
    { label: "Moyen", color: "bg-orange-500" },
    { label: "Bon", color: "bg-yellow-500" },
    { label: "Fort", color: "bg-green-500" },
  ];

  return { score, ...levels[score] };
}

// ─── Composant ──────────────────────────────────────────────────────────────────

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");
  const strength = getPasswordStrength(newPassword || "");

  const inputClass =
    "text-xs xs:text-sm bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50 pr-10";

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data: ChangePasswordFormData) => {
    const result = await changePassword(data);
    if (result.success) {
      toast.success("Mot de passe modifié !");
      reset();
      onClose();
    } else {
      toast.error(result.error ?? "Erreur lors du changement");
    }
  };

  // ── Fermeture avec reset ────────────────────────────────────────────────────
  const handleClose = () => {
    reset();
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto p-3 xs:p-3 sm:p-5 bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-400/25 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base xs:text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Shield className="size-5 text-violet-600 dark:text-violet-400" />
            Changer le mot de passe
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Mot de passe actuel */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
              Mot de passe actuel
            </Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                {...register("currentPassword")}
                placeholder="Votre mot de passe actuel"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-[10px] xs:text-xs text-red-500">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* Nouveau mot de passe */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
              Nouveau mot de passe
            </Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                {...register("newPassword")}
                placeholder="Au moins 8 caractères"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-[10px] xs:text-xs text-red-500">{errors.newPassword.message}</p>
            )}

            {/* Indicateur de force */}
            {newPassword && (
              <div className="space-y-1 mt-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < strength.score ? strength.color : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] xs:text-xs text-slate-500 dark:text-slate-400">
                  Force : {strength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirmation */}
          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
              Confirmer le mot de passe
            </Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                {...register("confirmPassword")}
                placeholder="Retapez le nouveau mot de passe"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] xs:text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-xl border-slate-300 dark:border-violet-400/30 cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Shield className="size-4" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
