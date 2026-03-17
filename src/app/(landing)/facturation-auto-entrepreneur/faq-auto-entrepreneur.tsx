"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

interface Faq {
  question: string
  answer: string
}

export function FaqAutoEntrepreneur({ faqs }: { faqs: Faq[] }) {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggle = (i: number) =>
    setOpenItems((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    )

  return (
    <div className="space-y-4">
      {faqs.map((faq, i) => {
        const isOpen = openItems.includes(i)
        return (
          <div
            key={i}
            className="border border-primary rounded-xl bg-white hover:border-tertiary transition-colors"
          >
            <button
              onClick={() => toggle(i)}
              className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors cursor-pointer duration-300"
            >
              <span className="text-base sm:text-lg font-semibold text-slate-900 pr-4">
                {faq.question}
              </span>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                {isOpen ? (
                  <Minus className="w-4 h-4 text-primary" />
                ) : (
                  <Plus className="w-4 h-4 text-primary" />
                )}
              </div>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-6 pb-5">
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-3">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
