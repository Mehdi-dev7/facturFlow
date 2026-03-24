// src/app/checkout/success/page.tsx
// Page de confirmation après souscription réussie.
// Le contenu est dans un Suspense car useSearchParams() l'exige en build statique Next.js.

import { Suspense } from "react";
import { CheckoutSuccessContent } from "./checkout-success-content";

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
