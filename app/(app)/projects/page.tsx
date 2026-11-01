import type { Metadata } from "next";

import { DeleteButton } from "@/components/master-data/delete-button";
import { FormDialog } from "@/components/master-data/form-dialog";
import { MasterDataList } from "@/components/master-data/master-data-list";
import { ProjectForm } from "@/components/master-data/project-form";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createProject, deleteProject, updateProject } from "@/lib/actions/projects";
import { parseListParams } from "@/lib/data/list-params";
import { listProjects } from "@/lib/data/master-data";
import { getNavItem } from "@/lib/navigation";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Projects" };

const CREATE_LABEL = "New project";

export default async function Page({ searchParams }: PageProps<"/projects">) {
  const { can, formatDate } = await requirePermission("projects:view");
  const params = parseListParams(await searchParams);
  const result = await listProjects(params);
  const canCreate = can("projects:create");
  const canEdit = can("projects:edit");
  const canDelete = can("projects:delete");
  const item = getNavItem("/projects");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.title}
        description={item.description}
        actions={
          canCreate && (
            <FormDialog mode="create" title={CREATE_LABEL} triggerLabel={CREATE_LABEL}>
              <ProjectForm action={createProject} />
            </FormDialog>
          )
        }
      />
      <MasterDataList
        item={item}
        noun="projects"
        params={params}
        result={result}
        canCreate={canCreate}
        createLabel={CREATE_LABEL}
        searchPlaceholder="Search by code or name"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40 pl-4">Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Last updated</TableHead>
              {(canEdit || canDelete) && (
                <TableHead className="w-24 pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="pl-4 font-medium">{project.code}</TableCell>
                <TableCell className="max-w-80 truncate">{project.name}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {formatDate.date(project.updatedAt)}
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <FormDialog
                          mode="edit"
                          title="Edit project"
                          triggerLabel={`Edit project ${project.code}`}
                        >
                          <ProjectForm
                            action={updateProject.bind(null, project.id)}
                            defaultValues={{ code: project.code, name: project.name }}
                          />
                        </FormDialog>
                      )}
                      {canDelete && (
                        <DeleteButton
                          entityLabel="project"
                          itemLabel={`${project.code} – ${project.name}`}
                          action={deleteProject.bind(null, project.id)}
                        />
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </MasterDataList>
    </div>
  );
}
