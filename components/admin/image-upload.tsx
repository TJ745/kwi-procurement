"use client";

import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "cn";

type ImageUploadProps = {
  /** What the image is, e.g. "logo" or "footer" (used in labels and messages). */
  noun: string;
  /** URL of the current image (with a cache-busting version), or null. */
  imageUrl: string | null;
  upload: (formData: FormData) => Promise<ActionResult>;
  remove: () => Promise<ActionResult>;
  accept: string;
  maxBytes: number;
  hint: string;
  /** Wide preview for banner-shaped images such as the print footer. */
  wide?: boolean;
};

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${bytes / (1024 * 1024)} MB` : `${bytes / 1024} KB`;
}

export function ImageUpload({ noun, imageUrl, upload, remove, accept, maxBytes, hint, wide }: ImageUploadProps) {
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
    if (file.size > maxBytes) {
      toast.error(`The ${noun} must be ${formatSize(maxBytes)} or smaller.`);
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    run(() => upload(formData));
  }

  return (
    <div className={cn("flex flex-col gap-3", !wide && "sm:flex-row sm:items-center")}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40",
          wide ? "h-24 w-full max-w-2xl bg-white" : "size-20",
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- authenticated, user-uploaded image
          <img src={imageUrl} alt={`Current ${noun}`} className="size-full object-contain p-1" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={() => inputRef.current?.click()}>
            {isPending ? <Loader2 className="animate-spin" /> : <Upload />}
            {imageUrl ? `Replace ${noun}` : `Upload ${noun}`}
          </Button>
          {imageUrl && (
            <Button type="button" variant="ghost" disabled={isPending} onClick={() => run(remove)}>
              <Trash2 />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}
