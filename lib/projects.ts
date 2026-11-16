/** Fields needed to label a project in dropdowns. */
export const PROJECT_LABEL_SELECT = { id: true, code: true, name: true, client: true } as const;

type Labelled = { code: string; name: string; client: string | null };

/** "4497 - Four Seasons / FEBCO Hotel"; without a client, "4497 - FEBCO Hotel". */
export function projectLabel(project: Labelled) {
  return `${project.code} - ${projectName(project)}`;
}

/** "Four Seasons / FEBCO Hotel" (or just the name), where the code is shown separately. */
export function projectName(project: Omit<Labelled, "code">) {
  return project.client ? `${project.client} / ${project.name}` : project.name;
}
