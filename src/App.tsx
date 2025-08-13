
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import MindWorldDashboard from "@/components/mindworld/MindWorldDashboard";
import HypnoShell from "@/routes/hypno/HypnoShell";
import ExtensionPage from "@/pages/Extension";
import StackPage from "./pages/Stack";
import AppShell from "@/routes/AppShell";
import PersonaSetup from "./pages/PersonaSetup";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/app/*" element={<AppShell />} />
          <Route path="/world" element={<MindWorldDashboard />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/browser" element={<Navigate to="/app/browser" replace />} />
          <Route path="/hypno" element={<HypnoShell />} />
          <Route path="/extension" element={<ExtensionPage />} />
          <Route path="/stack" element={<StackPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
