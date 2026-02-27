"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send, CheckCircle, Loader2, MessageSquare, Mail, Bug, CreditCard, Lightbulb, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sendContactEmail, type ContactFormData } from "@/lib/actions/send-contact-email";

// ─── Schema ───────────────────────────────────────────────────────────────────

const contactSchema = z.object({
  subject: z.enum(["question", "bug", "billing", "suggestion", "other"], {
    error: "Veuillez choisir un sujet",
  }),
  message: z.string().min(20, "Le message doit faire au moins 20 caractères").max(2000),
  email: z.string().check(z.email({ error: "Email invalide" })),
  name: z.string().min(1, "Nom requis").max(100),
});

const SUBJECTS = [
  { value: "question",   label: "Question générale",         icon: HelpCircle },
  { value: "bug",        label: "Bug technique",             icon: Bug },
  { value: "billing",    label: "Facturation / Abonnement",  icon: CreditCard },
  { value: "suggestion", label: "Suggestion d'amélioration", icon: Lightbulb },
  { value: "other",      label: "Autre",                     icon: MessageSquare },
] as const;

interface ContactFormProps {
  defaultName: string;
  defaultEmail: string;
}

export default function ContactForm({ defaultName, defaultEmail }: ContactFormProps) {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: defaultName, email: defaultEmail, subject: undefined, message: "" },
  });

  const messageValue = watch("message") ?? "";
  const confirmedEmail = watch("email");

  async function onSubmit(data: ContactFormData) {
    const result = await sendContactEmail(data);
    if (result.success) {
      setSent(true);
    } else {
      toast.error(result.error ?? "Une erreur est survenue, réessayez.");
    }
  }

  // ── Succès ─────────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Bande verte en haut */}
        <div className="h-1 w-full bg-emerald-500" />
        <div className="flex flex-col items-center text-center gap-5 py-14 px-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 ring-8 ring-emerald-100 dark:ring-emerald-900/10">
            <CheckCircle className="h-9 w-9 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
              Message envoyé !
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Notre équipe vous répondra sous{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">24h ouvrées</span>{" "}
              à <span className="text-primary font-medium">{confirmedEmail}</span>.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setSent(false)}
            className="mt-1 border-slate-200 dark:border-slate-700"
          >
            Envoyer un autre message
          </Button>
        </div>
      </div>
    );
  }

  // ── Formulaire ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Bande de couleur en haut */}
      <div className="h-1 w-full bg-gradient-primary" />

      <div className="p-2 xs:p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base xs:text-lg font-bold text-slate-900 dark:text-slate-100">
              Formulaire de contact
            </h2>
            <p className="text-xs xs:text-sm  text-slate-500 dark:text-slate-400">
              Réponse garantie sous 24h ouvrées
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Nom + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nom
              </Label>
              <Input
                id="name"
                placeholder="Votre nom"
                className="bg-slate-50 dark:bg-slate-800 text-sm text-slate-500 border-slate-200 dark:border-slate-700 focus:border-primary/50"
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email de réponse
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.fr"
                className="bg-slate-50 dark:bg-slate-800 text-sm text-slate-500 border-slate-200 dark:border-slate-700 focus:border-primary/50"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          {/* Sujet */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Sujet
            </Label>
            <Select
              onValueChange={(val) =>
                setValue("subject", val as ContactFormData["subject"], { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="subject"
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm"
              >
                <SelectValue placeholder="Choisir un sujet..." />
              </SelectTrigger>
              <SelectContent className="bg-linear-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#1e1845] dark:to-[#1a1438] text-sm border border-primary/20 dark:border-violet-400/30 shadow-lg dark:shadow-violet-950/50 rounded-xl">
                {SUBJECTS.map(({ value, label, icon: Icon }) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className="focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Message
              </Label>
              <span className={`text-xs ${messageValue.length > 1800 ? "text-amber-500" : "text-slate-400"}`}>
                {messageValue.length}/2000
              </span>
            </div>
            <Textarea
              id="message"
              placeholder="Décrivez votre question ou problème en détail..."
              rows={6}
              className="bg-slate-50 dark:bg-slate-800 text-sm text-slate-500 border-slate-200 dark:border-slate-700 focus:border-primary/50 resize-none"
              {...register("message")}
            />
            {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
          </div>

          {/* Footer du form */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="submit" disabled={isSubmitting} className="gap-2 shadow-sm cursor-pointer hover:scale-102 transition-all duration-300 sm:order-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer le message
                </>
              )}
            </Button>
            <p className="text-xs text-slate-400 dark:text-slate-500 sm:order-1">
              Besoin urgent ?{" "}
              <a href="mailto:support@facturflow.fr" className="text-primary hover:underline font-medium">
                support@facturflow.fr
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
