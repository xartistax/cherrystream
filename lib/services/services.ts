import "server-only";

import type { ServiceGroup } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/** Group headings as on xDate. */
export const serviceGroupLabels: Record<ServiceGroup, string> = {
  GENERAL: "Angebote",
  BDSM: "Domina / BDSM Sex Angebote",
  MASSAGE: "Massage Angebote",
};

export type ServiceOption = {
  id: string;
  name: string;
  slug: string;
  group: ServiceGroup;
};

export function getActiveServices(): Promise<ServiceOption[]> {
  return prisma.service.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      group: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });
}

/** Keeps the order of the groups (GENERAL, BDSM, MASSAGE) and of the services inside them. */
export function groupServices<T extends { group: ServiceGroup }>(services: T[]): Array<{ group: ServiceGroup; label: string; services: T[] }> {
  return (Object.keys(serviceGroupLabels) as ServiceGroup[])
    .map((group) => ({
      group,
      label: serviceGroupLabels[group],
      services: services.filter((service) => service.group === group),
    }))
    .filter((entry) => entry.services.length > 0);
}
