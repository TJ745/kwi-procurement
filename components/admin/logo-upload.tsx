"use client";

import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

type LogoUploadProps = {
  /** URL of the current logo (with a cache-busting version), or null. */
  logoUrl: string | null;
  upload: (formData: FormData) => Promise<ActionResult>;
  remove: () => Promise<ActionResult>;
};

export function LogoUpload({ logoUrl, upload, remove }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function run(task: () => Promise<ActionResult>) {
    startTransition(async () => {
      try {
        const result = await task();
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
      } catch {
        toast.error("Could not reach the server. Please try again.");
      }
    });
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 512 * 1024) {
      toast.error("The logo must be 512 KB or smaller.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    run(() => upload(formData));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- authenticated, user-uploaded image
          <img src={logoUrl} alt="Company logo" className="size-full object-contain p-1" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={() => inputRef.current?.click()}>
            {isPending ? <Loader2 className="animate-spin" /> : <Upload />}
            {logoUrl ? "Replace logo" : "Upload logo"}
          </Button>
          {logoUrl && (
            <Button type="button" variant="ghost" disabled={isPending} onClick={() => run(remove)}>
              <Trash2 />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">PNG, JPEG or WebP, up to 512 KB.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}
