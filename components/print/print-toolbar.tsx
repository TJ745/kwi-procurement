"use client";

import { Printer, X } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/** Print / Close controls (hidden on paper); opens the print dialog once on load. */
export function PrintToolbar() {
  useEffect(() => {
    // Let fonts and the logo finish loading before the dialog snapshots the page.
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mb-4 flex justify-end gap-2 print:hidden">
      <Button variant="outline" onClick={() => window.close()}>
        <X />
        Close
      </Button>
      <Button onClick={() => window.print()}>
        <Printer />
        Print
      </Button>
    </div>
  );
}
