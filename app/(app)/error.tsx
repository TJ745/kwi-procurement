"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={TriangleAlert}
      title="Something went wrong"
      description="This page could not be loaded. Please try again. If the problem persists, contact your administrator."
    >
      <Button variant="outline" onClick={() => retry()}>
        Try again
      </Button>
    </EmptyState>
  );
}
