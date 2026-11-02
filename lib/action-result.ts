export type ActionResult =
  /** `id` is set when the mutation created or identified a record. */
  | { ok: true; message: string; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };
