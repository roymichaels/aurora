import React from "react";
import {
  Brain,
  NotebookPen,
  Activity,
  BarChart3,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { type ModalId, useUIStore } from "@/state/ui";

interface Action {
  id: ModalId;
  label: string;
  icon: LucideIcon;
}

const actions: Action[] = [
  { id: "brain", label: "Brain", icon: Brain },
  { id: "journal", label: "Journal", icon: NotebookPen },
  { id: "live", label: "Live", icon: Activity },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "more", label: "More", icon: MoreHorizontal },
];

export default function HUDQuickActions() {
  const openModal = useUIStore.getState().openModal;

  return (
    <ul className="hud-actions flex gap-2">
      {actions.map(({ id, label, icon: Icon }) => (
        <li key={id}>
          <button
            type="button"
            className="action-chip"
            aria-label={label}
            title={label}
            onClick={() => openModal(id)}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">{label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

