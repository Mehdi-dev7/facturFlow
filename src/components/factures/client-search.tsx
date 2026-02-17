"use client";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Search, Plus, X, User, Building2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  quickClientSchema,
  type QuickClientData,
} from "@/lib/validations/invoice";
import { useClients, type SavedClient } from "@/hooks/use-clients";
import { SiretLookupInput } from "@/components/shared/siret-lookup-input";
import type { SiretData } from "@/lib/api/siret-lookup";

interface ClientSearchProps {
  selectedClientId?: string;
  onSelectClient: (clientId: string, clientData?: QuickClientData) => void;
  onClear: () => void;
  error?: string;
}

export function ClientSearch({
  selectedClientId,
  onSelectClient,
  onClear,
  error,
}: ClientSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Vrais clients depuis la DB
  const { data: clients = [], isLoading } = useClients();

  // Trouver le client sélectionné
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId],
  );

  // Filtrer par recherche
  const filtered = useMemo(() => {
    if (!query.trim()) return clients;
    const q = query.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.city?.toLowerCase().includes(q) ?? false),
    );
  }, [query, clients]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (client: SavedClient) => {
      onSelectClient(client.id);
      setQuery("");
      setIsOpen(false);
    },
    [onSelectClient],
  );

  const {
    register: registerNew,
    handleSubmit: handleSubmitNew,
    setValue: setNewValue,
    formState: { errors: newErrors },
    reset: resetNew,
  } = useForm<QuickClientData>({
    resolver: zodResolver(quickClientSchema),
  });

  // Pré-remplit le formulaire quand une entreprise est trouvée via SIRET
  const handleSiretFound = useCallback(
    (data: SiretData) => {
      setNewValue("name", data.name, { shouldDirty: true });
      setNewValue("address", data.address, { shouldDirty: true });
      setNewValue("zipCode", data.zipCode, { shouldDirty: true });
      setNewValue("city", data.city, { shouldDirty: true });
      setNewValue("siret", data.siret, { shouldDirty: true });
    },
    [setNewValue],
  );

  const onSubmitNew = useCallback(
    (data: QuickClientData) => {
      onSelectClient("__new__", data);
      setShowNewForm(false);
      resetNew();
    },
    [onSelectClient, resetNew],
  );

  // Client sélectionné — affichage
  if (selectedClientId && selectedClient) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-50/80 dark:bg-[#251e4d] p-3 transition-all duration-300 shadow-sm">
        <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40 shadow-sm">
          {selectedClient.type === "entreprise" ? (
            <Building2 className="size-4 text-violet-600 dark:text-violet-400" />
          ) : (
            <User className="size-4 text-violet-600 dark:text-violet-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {selectedClient.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-violet-300/80 truncate">
            {selectedClient.email} — {selectedClient.city ?? ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClear}
          className="text-slate-400 hover:text-red-600 hover:bg-red-100 dark:text-violet-400 dark:hover:text-red-400 dark:hover:bg-red-500/20 transition-all duration-300 cursor-pointer"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  // Nouveau client créé (__new__)
  if (selectedClientId && selectedClientId === "__new__") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-violet-200 dark:border-violet-400/25 bg-violet-50/80 dark:bg-[#251e4d] p-3 transition-all duration-300 shadow-sm">
        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 shadow-sm">
          <User className="size-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            Nouveau client ajouté
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClear}
          className="text-slate-400 hover:text-red-600 hover:bg-red-100 dark:text-violet-400 dark:hover:text-red-400 dark:hover:bg-red-500/20 transition-all duration-300 cursor-pointer"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 dark:text-violet-400" />
        <Input
          placeholder="Rechercher un client..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-violet-300/50"
          aria-invalid={!!error}
        />

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-primary/20 dark:border-violet-500/20 bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] shadow-lg dark:shadow-violet-950/40 max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center px-3 py-4 gap-2">
                <Loader2 className="size-4 animate-spin text-violet-500" />
                <span className="text-sm text-slate-500 dark:text-violet-400/60">
                  Chargement...
                </span>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-violet-200/30 dark:hover:bg-violet-500/10 transition-colors text-left cursor-pointer"
                  onClick={() => handleSelect(client)}
                >
                  <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-violet-900/30">
                    {client.type === "entreprise" ? (
                      <Building2 className="size-3.5 text-slate-500 dark:text-violet-400" />
                    ) : (
                      <User className="size-3.5 text-slate-500 dark:text-violet-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {client.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-violet-300/80 truncate">
                      {client.email} — {client.city ?? ""}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-sm text-slate-500 dark:text-violet-400/60 text-center">
                Aucun client trouvé
              </p>
            )}
            <div className="border-t border-slate-200 dark:border-violet-500/20">
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-200/30 dark:hover:bg-violet-500/10 transition-colors cursor-pointer"
                onClick={() => {
                  setShowNewForm(true);
                  setIsOpen(false);
                }}
              >
                <Plus className="size-4" />
                Nouveau client
              </button>
            </div>
          </div>
        )}
      </div>

      {error && !isOpen && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Bouton nouveau client */}
      {!showNewForm && !isOpen && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-primary/20 dark:border-violet-400/50 hover:bg-violet-50 dark:hover:bg-violet-500/10 dark:text-slate-200 transition-all duration-300 cursor-pointer rounded-xl"
          onClick={() => setShowNewForm(true)}
        >
          <Plus className="size-4" />
          Nouveau client
        </Button>
      )}

      {/* Mini-form nouveau client */}
      {showNewForm && (
        <div className="rounded-xl border border-primary/20 dark:border-violet-500/20 p-4 space-y-3 bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#2a2254] dark:via-[#221c48] dark:to-[#221c48] shadow-lg dark:shadow-violet-950/40">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Nouveau client
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowNewForm(false)}
              className="text-slate-400 hover:text-primary hover:bg-primary/20 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-primary/80 transition-all duration-300 cursor-pointer"
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <div className="mx-0 h-px bg-gradient-to-r from-transparent via-primary/30 dark:via-violet-200/30 to-transparent" />
          <div className="grid gap-3">
            {/* SIRET lookup en premier */}
            <SiretLookupInput onFound={handleSiretFound} />

            <div>
              <Label
                htmlFor="newClientName"
                className="text-slate-700 dark:text-violet-200"
              >
                Nom / Raison sociale *
              </Label>
              <Input
                id="newClientName"
                {...registerNew("name")}
                className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
                aria-invalid={!!newErrors.name}
              />
              {newErrors.name && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {newErrors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label
                htmlFor="newClientEmail"
                className="text-slate-700 dark:text-violet-200"
              >
                Email *
              </Label>
              <Input
                id="newClientEmail"
                type="email"
                {...registerNew("email")}
                className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
                aria-invalid={!!newErrors.email}
              />
              {newErrors.email && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {newErrors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label
                htmlFor="newClientAddress"
                className="text-slate-700 dark:text-violet-200"
              >
                Adresse *
              </Label>
              <Input
                id="newClientAddress"
                {...registerNew("address")}
                className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
                aria-invalid={!!newErrors.address}
              />
              {newErrors.address && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {newErrors.address.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label
                  htmlFor="newClientZipCode"
                  className="text-slate-700 dark:text-violet-200"
                >
                  Code postal
                </Label>
                <Input
                  id="newClientZipCode"
                  {...registerNew("zipCode")}
                  placeholder="75001"
                  maxLength={5}
                  inputMode="numeric"
                  className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
                />
              </div>
              <div>
                <Label
                  htmlFor="newClientCity"
                  className="text-slate-700 dark:text-violet-200"
                >
                  Ville *
                </Label>
                <Input
                  id="newClientCity"
                  {...registerNew("city")}
                  className="bg-white/90 dark:bg-[#2a2254] border-slate-300 dark:border-violet-400/30 rounded-xl text-slate-900 dark:text-slate-50"
                  aria-invalid={!!newErrors.city}
                />
                {newErrors.city && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    {newErrors.city.message}
                  </p>
                )}
              </div>
            </div>
            <div className="lg:ml-auto">
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmitNew(onSubmitNew)();
                }}
                className="cursor-pointer transition-all duration-300 dark:text-slate-200 hover:scale-101"
              >
                Ajouter le client
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
