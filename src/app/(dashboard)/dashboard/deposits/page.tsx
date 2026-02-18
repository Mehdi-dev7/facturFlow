import { Suspense } from "react";
import { DepositsPageContent } from "@/components/acomptes/deposits-page-content";

export default function DepositsPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <DepositsPageContent />
    </Suspense>
  );
}