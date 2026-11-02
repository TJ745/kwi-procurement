import "server-only";

import { TZDate } from "@date-fns/tz";

import {
  type DocumentType,
  formatDocumentNumber,
} from "@/lib/document-numbering";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Allocates the next number for a document type inside the caller's
 * transaction. The sequence row is locked (SELECT … FOR UPDATE) so
 * concurrent documents never receive the same number, and a rolled-back
 * transaction does not consume a number.
 *
 * Used by the procurement workflows (later phases). Callers should pass
 * generous `maxWait`/`timeout` options to `prisma.$transaction`, since
 * concurrent creations queue on the row lock.
 */
export async function allocateDocumentNumber(
  tx: Prisma.TransactionClient,
  type: DocumentType,
  timeZone: string,
  now = new Date(),
) {
  const [sequence] = await tx.$queryRaw<
    {
      prefix: string;
      includeYear: boolean;
      resetYearly: boolean;
      padding: number;
      nextNumber: number;
      counterYear: number | null;
    }[]
  >`SELECT "prefix", "includeYear", "resetYearly", "padding", "nextNumber", "counterYear"
    FROM "document_sequence" WHERE "type" = ${type} FOR UPDATE`;
  if (!sequence) throw new Error(`Document numbering is not configured for ${type}.`);

  const year = new TZDate(now, timeZone).getFullYear();
  // counterYear is null until first use; the configured next number applies.
  const restart =
    sequence.includeYear &&
    sequence.resetYearly &&
    sequence.counterYear !== null &&
    sequence.counterYear !== year;
  const number = restart ? 1 : sequence.nextNumber;

  await tx.documentSequence.update({
    where: { type },
    data: { nextNumber: number + 1, counterYear: year },
  });

  return formatDocumentNumber(sequence, number, year);
}

/** The number the next allocation would produce, without reserving it. */
export async function previewDocumentNumber(
  type: DocumentType,
  timeZone: string,
  now = new Date(),
) {
  const sequence = await prisma.documentSequence.findUnique({ where: { type } });
  if (!sequence) return null;
  const year = new TZDate(now, timeZone).getFullYear();
  const restart =
    sequence.includeYear &&
    sequence.resetYearly &&
    sequence.counterYear !== null &&
    sequence.counterYear !== year;
  return formatDocumentNumber(sequence, restart ? 1 : sequence.nextNumber, year);
}
