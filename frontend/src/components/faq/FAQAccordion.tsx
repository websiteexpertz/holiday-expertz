"use client";

import React, { useState } from "react";
import { Plus, Minus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { FAQItem } from "@/data/faqData";

interface FAQAccordionProps {
  items: FAQItem[];
  defaultOpenFirst?: boolean;
}

export default function FAQAccordion({ items, defaultOpenFirst = false }: FAQAccordionProps) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    if (defaultOpenFirst && items.length > 0) {
      return { [items[0].id]: true };
    }
    return {};
  });

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3.5">
      {items.map((item, index) => {
        const isOpen = !!openIds[item.id];
        const contentId = `faq-panel-${item.id}`;
        const buttonId = `faq-btn-${item.id}`;

        return (
          <div
            key={item.id}
            className={`rounded-2xl border transition-all duration-200 bg-white ${
              isOpen
                ? "border-[#006F66]/30 shadow-md shadow-[#006F66]/5"
                : "border-stone-200/90 hover:border-[#006F66]/30 hover:shadow-sm"
            }`}
          >
            <button
              id={buttonId}
              type="button"
              onClick={() => toggleItem(item.id)}
              aria-expanded={isOpen}
              aria-controls={contentId}
              className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-start justify-between gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006F66] rounded-2xl group"
            >
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center mt-0.5 transition-colors ${
                    isOpen
                      ? "bg-[#006F66] text-white"
                      : "bg-stone-100 text-stone-500 group-hover:bg-[#006F66]/10 group-hover:text-[#006F66]"
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`text-sm sm:text-base font-bold transition-colors leading-snug ${
                    isOpen
                      ? "text-[#004D40]"
                      : "text-stone-800 group-hover:text-[#006F66]"
                  }`}
                >
                  {item.question}
                </span>
              </div>

              <span
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ml-2 ${
                  isOpen
                    ? "bg-[#006F66]/10 text-[#006F66] rotate-180"
                    : "bg-stone-100 text-stone-500 group-hover:bg-stone-200 group-hover:text-stone-800"
                }`}
                aria-hidden="true"
              >
                {isOpen ? (
                  <Minus className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </span>
            </button>

            {/* Collapsible Panel */}
            <div
              id={contentId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 border-t border-stone-100 text-stone-600 text-xs sm:text-sm leading-relaxed space-y-3.5">
                  {/* Paragraphs */}
                  {item.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-stone-600">
                      {p}
                    </p>
                  ))}

                  {/* Bullet Points */}
                  {item.bulletPoints && item.bulletPoints.length > 0 && (
                    <ul className="space-y-2 pt-1 pl-1">
                      {item.bulletPoints.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#006F66] shrink-0 mt-0.5" />
                          <span className="text-stone-700">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Numbered List */}
                  {item.numberedList && item.numberedList.length > 0 && (
                    <ol className="space-y-2 pt-1 pl-1">
                      {item.numberedList.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-[#006F66]/10 text-[#006F66] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <span className="text-stone-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* Warning Box */}
                  {item.warningBox && (
                    <div className="mt-3.5 p-4 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-950 space-y-1.5 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-black tracking-wide text-amber-900 uppercase">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{item.warningBox.title}</span>
                      </div>
                      <p className="text-xs sm:text-[13px] font-medium leading-relaxed text-amber-900">
                        {item.warningBox.text}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

