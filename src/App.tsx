import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch, useLocation } from "wouter";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/hooks/use-auth";
import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt";

// Pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin-dashboard";
import Index from "./pages/index";
import DJManagement from "./pages/dj-management";
import ProducerManagement from "./pages/producer-management";
import EventCalendar from "./pages/event-calendar";
import AgendaManager from "./pages/agenda-manager";
import ContractManagement from "./pages/contract-management";
import FinancialTracking from "./pages/financial-tracking";
import CompanySettings from "./pages/admin-dashboard/CompanySettings";

// Producer Pages
import ProducerDashboard from "./pages/producer-dashboard";
import DJProfileProducer from "./pages/producer-dashboard/DJProfileProducer";

// DJ Profile Pages
import DJProfile from "./pages/dj-profile";

// Shared Pages
import SharedMedia from "./pages/share/SharedMedia";

const queryClient = new QueryClient();

const LoginRoute = () => {
  const { isAuthenticated, role } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (role === "producer") {
      setLocation("/producer-dashboard");
    } else {
      setLocation("/");
    }
  }, [isAuthenticated, role, setLocation]);

  if (!isAuthenticated) return <Login />;
  return null;
};

function AppRoutes() {
  const { isAuthenticated, role } = useAuth();
  const [location, setLocation] = useLocation();
  const isShareRoute = location?.startsWith("/share/") ?? false;

  useEffect(() => {
    if (!isAuthenticated || isShareRoute) {
      return;
    }

    if (role === "producer") {
      if (location === "/login" || location === "/" || location === "") {
        setLocation("/producer-dashboard");
      }
    } else if (role === "admin") {
      if (location === "/login" || location === "") {
        setLocation("/");
      }
      // Guard against accidental producer route when admin
      if (location === "/producer-dashboard") {
        setLocation("/");
      }
    }
  }, [isAuthenticated, role, location, setLocation, isShareRoute]);

  if (isShareRoute) {
    return <SharedMedia />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (role === "producer") {
    return (
      <AppLayout>
        <Switch>
          <Route path="/" component={ProducerDashboard} />
          <Route path="/producer-dashboard" component={ProducerDashboard} />
          <Route path="/my-djs" component={ProducerDashboard} />
          <Route path="/my-events" component={EventCalendar} />
          <Route path="/my-contracts" component={ContractManagement} />
          <Route path="/my-payments" component={FinancialTracking} />
          <Route path="/dj-profile/:djId" component={DJProfileProducer} />
          <Route path="/login" component={LoginRoute} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Switch>
        {/* Admin Routes protegidas */}
        <ProtectedRoute path="/" component={AdminDashboard} requiredRole="admin" />
        <ProtectedRoute path="/admin-dashboard" component={AdminDashboard} requiredRole="admin" />
        <ProtectedRoute path="/djs" component={DJManagement} requiredRole="admin" />
        <ProtectedRoute path="/dj-management" component={DJManagement} requiredRole="admin" />
        <ProtectedRoute path="/producers" component={ProducerManagement} requiredRole="admin" />
        <ProtectedRoute path="/producer-management" component={ProducerManagement} requiredRole="admin" />
        <ProtectedRoute path="/events" component={EventCalendar} requiredRole="admin" />
        <ProtectedRoute path="/event-calendar" component={EventCalendar} requiredRole="admin" />
        <ProtectedRoute path="/agenda-manager" component={AgendaManager} requiredRole="admin" />
        <ProtectedRoute path="/contracts" component={ContractManagement} requiredRole="admin" />
        <ProtectedRoute path="/contract-management" component={ContractManagement} requiredRole="admin" />
        <ProtectedRoute path="/finances" component={FinancialTracking} requiredRole="admin" />
        <ProtectedRoute path="/financial-tracking" component={FinancialTracking} requiredRole="admin" />
        <ProtectedRoute path="/settings" component={CompanySettings} requiredRole="admin" />
        <ProtectedRoute path="/company-settings" component={CompanySettings} requiredRole="admin" />
        <Route path="/login" component={LoginRoute} />

        {/* DJ Profile Routes */}
        <Route path="/dj-profile/:djId" component={DJProfile} />

        {/* Fallback Routes */}
        <Route path="/dashboard" component={AdminDashboard} />
        <Route path="/index" component={Index} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

import { ThemeProvider } from "next-themes";

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAInstallPrompt />
        <Router>
          <AppRoutes />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
