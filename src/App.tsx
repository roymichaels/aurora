
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useFeatureFlags } from "@/state/featureFlags";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import MindWorldDashboard from "@/components/mindworld/MindWorldDashboard";
import HypnoShell from "@/routes/hypno/HypnoShell";
import ExtensionPage from "@/pages/Extension";
import StackPage from "./pages/Stack";
import AccountPlanPage from "./pages/AccountPlan";
import HomeSnapshot from "./pages/HomeSnapshot";
import AppShell from "@/routes/AppShell";
import HomeGalaxy from "@/views/HomeGalaxy";
import { views } from "@/views/registry";
import { useRoadmapProgress } from "@/hooks/useRoadmapProgress";
import LiveShell from "@/routes/live/LiveShell";
import { TTSPill } from "@/voice/TTSPill";
const queryClient = new QueryClient();

function RequireRoadmap({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  let hasRoadmap = true;
  try {
    const p = useRoadmapProgress();
    hasRoadmap = !!p?.items?.length;
  } catch {
    hasRoadmap = true;
  }
  if (!hasRoadmap && !location.pathname.startsWith("/app/actions")) {
    return <Navigate to="/app/actions" replace />;
  }
  return <>{children}</>;
}

function AppRoutesWithShell() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/app" element={<Outlet />}>

          <Route index element={<HomeGalaxy />} />
          {views.filter((v) => v.id !== "home").map((v) => (
            <Route key={v.id} path={v.path || undefined} element={<v.component />} />
          ))}
          <Route path="live" element={<LiveShell />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>
        <Route path="/world" element={<MindWorldDashboard />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/browser" element={<Navigate to="/app/browser" replace />} />
        <Route path="/hypno" element={<HypnoShell />} />
        <Route path="/extension" element={<ExtensionPage />} />
        <Route path="/stack" element={<StackPage />} />
        <Route path="/plan" element={<AccountPlanPage />} />
        <Route path="/home" element={<HomeSnapshot />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function LegacyRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<HomeGalaxy />} />
        {views.filter((v) => v.id !== "home").map((v) => (
          <Route key={v.id} path={v.path || undefined} element={<v.component />} />
        ))}
        <Route path="live" element={<LiveShell />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
      <Route path="/world" element={<MindWorldDashboard />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/browser" element={<Navigate to="/app/browser" replace />} />
      <Route path="/hypno" element={<HypnoShell />} />
      <Route path="/extension" element={<ExtensionPage />} />
      <Route path="/stack" element={<StackPage />} />
      <Route path="/plan" element={<AccountPlanPage />} />
      <Route path="/home" element={<HomeSnapshot />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  const appShell = useFeatureFlags((s) => s.appShell);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <TTSPill />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          {appShell ? <AppRoutesWithShell /> : <LegacyRoutes />}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
