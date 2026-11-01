import { DeleteButton } from "@/components/master-data/delete-button";
import { FormDialog } from "@/components/master-data/form-dialog";
import { NameForm } from "@/components/master-data/name-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActionResult } from "@/lib/action-result";
import { formatDate } from "@/lib/format";

type NameEntityTableProps = {
  rows: { id: string; name: string; updatedAt: Date }[];
  /** Singular, lowercase noun, e.g. "department". */
  entityLabel: string;
  canManage: boolean;
  update: (id: string, input: unknown) => Promise<ActionResult>;
  remove: (id: string) => Promise<ActionResult>;
};

/** Table for name-only master data (departments, categories). */
export function NameEntityTable({
  rows,
  entityLabel,
  canManage,
  update,
  remove,
}: NameEntityTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Name</TableHead>
          <TableHead className="hidden sm:table-cell">Last updated</TableHead>
          {canManage && (
            <TableHead className="w-24 pr-4 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="pl-4 font-medium">{row.name}</TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">
              {formatDate(row.updatedAt)}
            </TableCell>
            {canManage && (
              <TableCell className="pr-4">
                <div className="flex justify-end gap-1">
                  <FormDialog
                    mode="edit"
                    title={`Edit ${entityLabel}`}
                    triggerLabel={`Edit ${entityLabel} ${row.name}`}
                  >
                    <NameForm
                      action={update.bind(null, row.id)}
                      defaultValues={{ name: row.name }}
                    />
                  </FormDialog>
                  <DeleteButton
                    entityLabel={entityLabel}
                    itemLabel={row.name}
                    action={remove.bind(null, row.id)}
                  />
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
