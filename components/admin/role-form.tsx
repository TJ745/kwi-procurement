"use client";

import { Controller } from "react-hook-form";

import { TextField } from "@/components/forms/text-field";
import { useActionForm } from "@/components/forms/use-action-form";
import { FormActions } from "@/components/master-data/form-actions";
import { useFormDialog } from "@/components/master-data/form-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActionResult } from "@/lib/action-result";
import {
  PERMISSION_ACTIONS,
  PERMISSION_ACTION_LABELS,
  PERMISSION_MODULES,
  type Permission,
  type PermissionModule,
} from "@/lib/permissions";
import { type RoleInput, roleSchema } from "@/lib/validation/admin";

/** Toggles one cell, keeping "view" consistent with the other actions. */
function toggle(current: Permission[], module: PermissionModule, action: string, checked: boolean) {
  const next = new Set(current);
  const key = `${module}:${action}` as Permission;
  if (checked) {
    next.add(key);
    next.add(`${module}:view`);
  } else if (action === "view") {
    for (const each of PERMISSION_ACTIONS) next.delete(`${module}:${each}` as Permission);
  } else {
    next.delete(key);
  }
  return [...next];
}

export function RoleForm({
  action,
  defaultValues,
}: {
  action: (input: RoleInput) => Promise<ActionResult>;
  defaultValues?: RoleInput;
}) {
  const { close } = useFormDialog();
  const { form, onSubmit } = useActionForm({
    schema: roleSchema,
    defaultValues: defaultValues ?? { name: "", description: "", permissions: [] },
    action,
    onSuccess: close,
  });
  const { control } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <TextField control={control} name="name" label="Name" required autoFocus autoComplete="off" />
        <TextField control={control} name="description" label="Description" multiline />
      </FieldGroup>
      <FieldSet>
        <FieldLegend variant="label">Permissions</FieldLegend>
        <Controller
          control={control}
          name="permissions"
          render={({ field }) => (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-3">Module</TableHead>
                    {PERMISSION_ACTIONS.map((action) => (
                      <TableHead key={action} className="text-center">
                        {PERMISSION_ACTION_LABELS[action]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSION_MODULES.map((module) => (
                    <TableRow key={module.key}>
                      <TableCell className="pl-3 font-medium">{module.label}</TableCell>
                      {PERMISSION_ACTIONS.map((action) => {
                        const key = `${module.key}:${action}` as Permission;
                        if (!(module.actions as readonly string[]).includes(action)) {
                          return (
                            <TableCell key={action} className="text-center text-muted-foreground">
                              <span aria-hidden="true">—</span>
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell key={action} className="text-center">
                            <Checkbox
                              className="mx-auto"
                              checked={field.value.includes(key)}
                              onCheckedChange={(checked) =>
                                field.onChange(toggle(field.value, module.key, action, checked))
                              }
                              aria-label={`${PERMISSION_ACTION_LABELS[action]} ${module.label}`}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        />
        <p className="text-xs text-muted-foreground">
          Users, Roles and Settings are always restricted to the Super Admin. Permissions for
          further procurement workflows will be added as each workflow is built.
        </p>
      </FieldSet>
      <FormActions isSubmitting={form.formState.isSubmitting} />
    </form>
  );
}
