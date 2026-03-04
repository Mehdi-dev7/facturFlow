"use client";

// src/app/admin/admin-dashboard-client.tsx
// Partie interactive du dashboard admin : recherche, filtres, table, pagination, actions.

import { useState, useCallback, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { grantGuestAccess, revokeGuestAccess } from "@/lib/actions/admin";
import type { AdminUser } from "@/lib/actions/admin";
import { Search, Gift, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEffectivePlanLabel(user: AdminUser): { label: string; className: string } {
  const now = new Date();

  if (user.isAdminUser) {
    return { label: "ADMIN", className: "bg-violet-900/60 text-violet-200 border-violet-500/60" };
  }
  if (user.grantedPlan === "BUSINESS") {
    return { label: "INVITÉ", className: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50" };
  }
  if (user.trialEndsAt && user.trialEndsAt > now) {
    return { label: "TRIAL PRO", className: "bg-amber-900/40 text-amber-300 border-amber-700/50" };
  }
  if (user.plan === "BUSINESS") {
    return { label: "BUSINESS", className: "bg-amber-900/40 text-amber-300 border-amber-700/50" };
  }
  if (user.plan === "PRO") {
    return { label: "PRO", className: "bg-violet-900/40 text-violet-300 border-violet-700/50" };
  }
  return { label: "FREE", className: "bg-slate-800 text-slate-400 border-slate-700/50" };
}

function UserAvatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        width={32}
        height={32}
        className="rounded-full object-cover"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-700 text-xs font-semibold text-white shrink-0">
      {initials}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  initialUsers: AdminUser[];
  totalPages: number;
  totalUsers: number;
  currentPage: number;
  currentSearch: string;
  currentPlan: string;
}

export default function AdminDashboardClient({
  initialUsers,
  totalPages,
  totalUsers,
  currentPage,
  currentSearch,
  currentPlan,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Recherche locale (debounce manuel via blur/enter)
  const [searchValue, setSearchValue] = useState(currentSearch);

  // Loading par row pour les actions
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  // ─ Navigation helpers ─────────────────────────────────────────────────────

  const navigate = useCallback(
    (updates: { page?: number; search?: string; plan?: string }) => {
      const params = new URLSearchParams();
      const nextPage = updates.page ?? 1;
      const nextSearch = updates.search !== undefined ? updates.search : currentSearch;
      const nextPlan = updates.plan !== undefined ? updates.plan : currentPlan;

      if (nextPage > 1) params.set("page", String(nextPage));
      if (nextSearch) params.set("search", nextSearch);
      if (nextPlan) params.set("plan", nextPlan);

      const qs = params.toString();
      startTransition(() => {
        router.push(`${pathname}${qs ? `?${qs}` : ""}`);
      });
    },
    [currentSearch, currentPlan, pathname, router]
  );

  const handleSearch = useCallback(() => {
    navigate({ search: searchValue, page: 1 });
  }, [searchValue, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  // ─ Actions ────────────────────────────────────────────────────────────────

  const handleGrant = useCallback(
    async (userId: string, userName: string) => {
      setLoadingUserId(userId);
      const result = await grantGuestAccess(userId);
      setLoadingUserId(null);

      if (result.success) {
        toast.success(`Accès BUSINESS accordé à ${userName}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    },
    [router]
  );

  const handleRevoke = useCallback(
    async (userId: string, userName: string) => {
      setLoadingUserId(userId);
      const result = await revokeGuestAccess(userId);
      setLoadingUserId(null);

      if (result.success) {
        toast.success(`Accès invité révoqué pour ${userName}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    },
    [router]
  );

  // ─ Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 p-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSearch}
            placeholder="Rechercher un user..."
            className="pl-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-violet-500"
          />
        </div>

        <Select
          value={currentPlan || "ALL"}
          onValueChange={(v) => navigate({ plan: v === "ALL" ? "" : v, page: 1 })}
        >
          <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="Tous les plans" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="ALL" className="text-slate-200">Tous les plans</SelectItem>
            <SelectItem value="FREE" className="text-slate-400">FREE</SelectItem>
            <SelectItem value="PRO" className="text-violet-300">PRO</SelectItem>
            <SelectItem value="BUSINESS" className="text-amber-300">BUSINESS</SelectItem>
            <SelectItem value="INVITED" className="text-emerald-300">Invités</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset filtre */}
        {(currentSearch || currentPlan) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearchValue(""); navigate({ search: "", plan: "", page: 1 }); }}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4 mr-1" /> Reset
          </Button>
        )}

        <span className="ml-auto text-xs text-slate-500">{totalUsers} utilisateur{totalUsers > 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className={`overflow-x-auto transition-opacity ${isPending ? "opacity-60" : ""}`}>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-500 font-medium">Utilisateur</TableHead>
              <TableHead className="text-slate-500 font-medium">Plan DB</TableHead>
              <TableHead className="text-slate-500 font-medium">Plan effectif</TableHead>
              <TableHead className="text-slate-500 font-medium">Trial</TableHead>
              <TableHead className="text-slate-500 font-medium">Inscrit le</TableHead>
              <TableHead className="text-slate-500 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-500 py-12">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              initialUsers.map((user) => {
                const effective = getEffectivePlanLabel(user);
                const isLoading = loadingUserId === user.id;
                const trialActive = user.trialEndsAt && user.trialEndsAt > new Date();

                return (
                  <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                    {/* Utilisateur */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.name} image={user.image} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-100 truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Plan DB */}
                    <TableCell>
                      <span className="text-xs text-slate-400">{user.plan}</span>
                    </TableCell>

                    {/* Plan effectif */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${effective.className}`}
                      >
                        {effective.label}
                      </span>
                    </TableCell>

                    {/* Trial */}
                    <TableCell>
                      {trialActive ? (
                        <span className="text-xs text-amber-400">
                          Expire {new Date(user.trialEndsAt!).toLocaleDateString("fr-FR")}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </TableCell>

                    {/* Date inscription */}
                    <TableCell>
                      <span className="text-xs text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400 ml-auto" />
                      ) : user.isAdminUser ? (
                        <span className="text-xs text-slate-600 italic">—</span>
                      ) : user.grantedPlan === "BUSINESS" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(user.id, user.name)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs h-7 px-2"
                        >
                          <X className="h-3 w-3 mr-1" /> Révoquer
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGrant(user.id, user.name)}
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 text-xs h-7 px-2"
                        >
                          <Gift className="h-3 w-3 mr-1" /> Accès invité
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
          <span className="text-xs text-slate-500">
            Page {currentPage} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => navigate({ page: currentPage - 1 })}
              className="h-7 px-2 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => navigate({ page: currentPage + 1 })}
              className="h-7 px-2 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
