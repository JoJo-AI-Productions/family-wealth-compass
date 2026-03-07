import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FinanceProvider } from "@/contexts/FinanceContext";
import Index from "./pages/Index";
import YearDetail from "./pages/YearDetail";
import DayDetail from "./pages/DayDetail";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import DebugRecovery from "./pages/DebugRecovery";

const queryClient = new QueryClient();
const RECOVERY_REQUEST_TYPE = 'FWC_RECOVERY_REQUEST';
const RECOVERY_RESPONSE_TYPE = 'FWC_RECOVERY_RESPONSE';
const USERS_KEY = 'family-finance-users';

function getGuestFinanceData() {
  const usersRaw = localStorage.getItem(USERS_KEY);
  if (!usersRaw) return null;

  try {
    const users = JSON.parse(usersRaw);
    const guest = Object.values(users).find((u: any) => u?.isGuest);
    if (!guest || !guest.accountId) return null;
    const financeRaw = localStorage.getItem(`family-finance-data-${guest.accountId}`);
    if (!financeRaw) return null;
    return JSON.parse(financeRaw);
  } catch {
    return null;
  }
}

const App = () => {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== RECOVERY_REQUEST_TYPE) return;
      if (!event.source || !(event.source instanceof Window)) return;

      const payload = getGuestFinanceData();
      event.source.postMessage({ type: RECOVERY_RESPONSE_TYPE, payload }, event.origin || '*');
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <FinanceProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/year-detail" element={<YearDetail />} />
                <Route path="/day-detail" element={<DayDetail />} />
                <Route path="/debug/recovery" element={<DebugRecovery />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </FinanceProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
