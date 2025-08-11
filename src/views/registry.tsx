import { lazy } from "react";

export type ViewId =
  | "control" | "focus" | "hypno" | "voice" | "notes"
  | "analyze" | "browser" | "portal" | "archive" | "settings" | "agent" | "runner" | "plan";

export type ViewMeta = {
  id: ViewId;
  label: string;
  path: string;
  icon?: JSX.Element;
  component: React.LazyExoticComponent<() => JSX.Element>;
  hotkey?: string;
};

export const views: ViewMeta[] = [

  { id: "control", label: "Control", path: "",            component: lazy(() => import("./ControlView")) },
  { id: "focus",   label: "Focus",   path: "focus",      component: lazy(() => import("./FocusView")) },
  { id: "hypno",   label: "Hypno",   path: "hypno",      component: lazy(() => import("./HypnoView")) },
  { id: "voice",   label: "Voice",   path: "voice",      component: lazy(() => import("./VoiceView")) },
  { id: "notes",   label: "Notes",   path: "notes",      component: lazy(() => import("./NotesView")) },
  { id: "analyze", label: "Analyze", path: "analyze",    component: lazy(() => import("./AnalyzeView")) },
  { id: "browser", label: "Browser", path: "browser",    component: lazy(() => import("./BrowserView")) },
  { id: "portal",  label: "Portal",  path: "portal",     component: lazy(() => import("./PortalView")) },
  { id: "archive", label: "Archive", path: "archive",    component: lazy(() => import("./ArchiveView")) },
  { id: "settings",label: "Settings",path: "settings",  component: lazy(() => import("./SettingsView")) },
  { id: "agent",   label: "Agent",   path: "agent",      component: lazy(() => import("./AgentFullView")) },
  { id: "plan",    label: "Plan",    path: "plan",       component: lazy(() => import("./MasterPlanView")) },
  { id: "runner",  label: "Node",    path: "node/:id",   component: lazy(() => import("../pages/NodeRunner")) },
];
