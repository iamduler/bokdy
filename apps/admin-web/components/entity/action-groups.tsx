"use client";

import { EntityUnavailable } from "@/components/entity/unavailable";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type EntityActionItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  /** When set, the row is an unavailable placeholder. */
  unavailableReason?: string;
  /** Wired control rendered under the label. */
  children?: ReactNode;
};

export type EntityActionGroup = {
  id: string;
  icon: LucideIcon;
  title: string;
  items: EntityActionItem[];
};

export function EntityActionGroups({ groups }: { groups: EntityActionGroup[] }) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const GroupIcon = group.icon;
        return (
          <div key={group.id}>
            <div className="mb-3 flex items-center gap-2">
              <GroupIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
              <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                if (item.children) {
                  return (
                    <div key={item.id} className="rounded-md border border-border bg-card/40 p-3.5">
                      <p className="mb-1 text-sm font-bold text-foreground">{item.label}</p>
                      <p className="mb-3 text-xs text-muted-foreground">{item.description}</p>
                      {item.children}
                    </div>
                  );
                }
                const button = (
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-start gap-3 rounded-md border border-border bg-card/30 p-3.5 text-left opacity-60"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="text-sm font-bold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                );
                if (!item.unavailableReason) return <div key={item.id}>{button}</div>;
                return (
                  <EntityUnavailable key={item.id} reason={item.unavailableReason} className="w-full">
                    {button}
                  </EntityUnavailable>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
