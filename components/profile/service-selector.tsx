"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type ServiceSelectorProps = {
  groups: Array<{
    group: string;
    label: string;
    services: Array<{
      id: string;
      name: string;
    }>;
  }>;
  initialServiceIds: string[];
};

export function ServiceSelector({ groups, initialServiceIds }: ServiceSelectorProps) {
  const [selectedIds, setSelectedIds] = useState(new Set(initialServiceIds));

  function toggleService(serviceId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }

      return next;
    });
  }

  return (
    <div className="space-y-6">
      {Array.from(selectedIds).map((serviceId) => (
        <input key={serviceId} type="hidden" name="serviceIds" value={serviceId} />
      ))}

      {groups.map((group) => (
        <div key={group.group} className="space-y-3">
          <p className="text-sm font-medium text-zinc-300">{group.label}</p>

          <div className="flex flex-wrap gap-2">
            {group.services.map((service) => {
              const selected = selectedIds.has(service.id);

              return (
                <button
                  key={service.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleService(service.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                    selected
                      ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                      : "border-white/10 bg-white/3 text-zinc-400 hover:bg-white/[0.07] hover:text-white",
                  )}
                >
                  {selected ? <Check className="size-3.5" /> : null}
                  {service.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <p className="text-sm text-zinc-500">{selectedIds.size} ausgewählt</p>
    </div>
  );
}
