"use client";

import { useCallback, useState } from "react";

import { Card } from "@/components/ui/card/card.tsx";

export function SelectableCard() {
  const [selected, setSelected] = useState(false);

  const toggleSelected = useCallback(() => {
    setSelected((p) => !p);
  }, []);

  return (
    <Card className="relative" selected={selected} onClick={toggleSelected}>
      <input
        className="pointer-events-none absolute top-2 right-2"
        type="checkbox"
        checked={selected}
        readOnly
      />
      <h3>Selectable</h3>
      <p>with custom UI</p>
    </Card>
  );
}
