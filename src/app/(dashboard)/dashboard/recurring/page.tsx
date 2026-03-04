import { Suspense } from "react"
import { RecurringPageContent } from "@/components/recurring/recurring-page-content"

export const metadata = { title: "Recurrences | FacturNow" }

export default function RecurringPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">Chargement...</div>}>
      <RecurringPageContent />
    </Suspense>
  )
}
