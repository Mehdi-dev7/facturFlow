// src/app/admin/avis/page.tsx
// Page admin dédiée à la gestion des avis clients.

import { getReviews } from "@/lib/actions/reviews";
import ReviewsAdminClient from "./reviews-admin-client";
import { MessageSquare } from "lucide-react";

export const metadata = {
  title: "Avis clients — Admin FacturNow",
};

export default async function AdminAvisPage() {
  const result = await getReviews();
  const reviews = result.data ?? [];

  const pendingCount = reviews.filter((r) => r.status === "PENDING").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-violet-400 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-white">
            Avis clients
            {pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-sm font-bold text-white align-middle">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Validez ou rejetez les avis avant publication sur la landing page
          </p>
        </div>
      </div>

      {/* Liste interactive */}
      <ReviewsAdminClient reviews={reviews} />
    </div>
  );
}
