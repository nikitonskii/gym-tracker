"use client"

import * as React from "react"
import { Calendar as CalendarPrimitive } from "@/components/ui/calendar"

interface CalendarWithHighlightsProps {
  mode: "single"
  selected?: Date | undefined
  onSelect: (date: Date | undefined) => void
  className?: string
  highlightedDates?: Date[]
}

export function CalendarWithHighlights({
  mode,
  selected,
  onSelect,
  className,
  highlightedDates = [],
}: CalendarWithHighlightsProps) {
  // This forces re-rendering when highlightedDates changes
  const [key, setKey] = React.useState(0);
  
  React.useEffect(() => {
    // Force re-render when highlightedDates change
    setKey(prev => prev + 1);
  }, [highlightedDates]);

  const modifiers = React.useMemo(() => {
    return {
      highlighted: highlightedDates.filter(Boolean)
    };
  }, [highlightedDates]);

  return (
    <>
      <style jsx global>{`
        .rdp-day_highlighted {
          background-color: hsl(var(--primary) / 0.1) !important;
          color: hsl(var(--primary)) !important;
          font-weight: bold !important;
          border-radius: 0.375rem !important;
        }
      `}</style>
      <CalendarPrimitive
        key={key}
        mode={mode}
        selected={selected}
        onSelect={onSelect}
        className={className}
        modifiers={modifiers}
        modifiersClassNames={{
          highlighted: "rdp-day_highlighted"
        }}
      />
    </>
  )
} 