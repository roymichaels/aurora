import { lazy } from "react";

export type ViewId =
  | "home" | "focus" | "hypno" | "voice" | "journal"
  | "brain" | "browser" | "portal" | "archive" | "settings" | "agent" | "runner" | "plan" | "control";

export type ViewMeta = {
  id: ViewId;
  label: string;
  path: string;
  icon?: JSX.Element;
  component: React.LazyExoticComponent<() => JSX.Element>;
  hotkey?: string;
};

export const views: ViewMeta[] = [

  { id: "home",    label: "Home",    path: "",            component: lazy(() => import("./HomeView")) },
  { id: "focus",   label: "Focus",   path: "focus",      component: lazy(() => import("./FocusView")) },
  { id: "hypno",   label: "Hypno",   path: "hypno",      component: lazy(() => import("./HypnoView")) },
  { id: "voice",   label: "Voice",   path: "voice",      component: lazy(() => import("./VoiceView")) },
  { id: "journal", label: "Journal", path: "journal",    component: lazy(() => import("./JournalView")) },
  { id: "brain",   label: "Brain",   path: "brain",      component: lazy(() => import("./BrainView")) },
  { id: "browser", label: "Browser", path: "browser",    component: lazy(() => import("./BrowserView")) },
  { id: "portal",  label: "Portal",  path: "portal",     component: lazy(() => import("./PortalView")) },
  { id: "archive", label: "Archive", path: "archive",    component: lazy(() => import("./ArchiveView")) },
  { id: "settings",label: "Settings",path: "settings",  component: lazy(() => import("./SettingsView")) },
  { id: "agent",   label: "Agent",   path: "agent",      component: lazy(() => import("./AgentFullView")) },
  { id: "plan",    label: "Plan",    path: "plan",       component: lazy(() => import("./PlanView")) },
  { id: "runner",  label: "Node",    path: "node/:id",   component: lazy(() => import("../pages/NodeRunner")) },
  { id: "control", label: "Control", path: "control",    component: lazy(() => import("./ControlView")) },
];
