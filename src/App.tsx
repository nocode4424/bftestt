import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import TestMenu from "./pages/TestMenu";
import MenuAdmin from "./pages/MenuAdmin";
import AdminDashboard from "./pages/AdminDashboard";
import ComprehensiveAnalytics from "./pages/ComprehensiveAnalytics";
import Auth from "./pages/Auth";
import Kitchen from "./pages/Kitchen";
import ModernKitchen from "./pages/ModernKitchen";
import NotFound from "./pages/NotFound";
import AuthCallback from "./components/auth/AuthCallback";

const queryClient = new QueryClient();

// Domain-based routing logic
const getDomainBasedRoutes = () => {
  const hostname = window.location.hostname;
  const menuDomain = import.meta.env.VITE_MENU_DOMAIN;
  const kitchenDomain = import.meta.env.VITE_KITCHEN_DOMAIN;
  const adminDomain = import.meta.env.VITE_ADMIN_DOMAIN;

  // Admin domain routing (admin.bluefinwc.com)
  if (hostname === adminDomain || hostname === 'admin.bluefinwc.com') {
    return (
      <Routes>
        <Route path="/" element={<ComprehensiveAnalytics />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/analytics" element={<ComprehensiveAnalytics />} />
        <Route path="/comprehensive" element={<ComprehensiveAnalytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Kitchen domain routing (orders.bluefinwc.com)
  if (hostname === kitchenDomain) {
    return (
      <Routes>
        <Route path="/" element={<ModernKitchen />} />
        <Route path="/kitchen" element={<ModernKitchen />} />
        <Route path="/old" element={<Kitchen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Menu domain routing (menu.bluefinwc.com)
  if (hostname === menuDomain) {
    return (
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/admin" element={<MenuAdmin />} />
        <Route path="/menu/admin" element={<MenuAdmin />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // Default/development routing (localhost or other domains)
  console.log('Loading default routes for localhost');
  return (
    <Routes>
      <Route path="/" element={<TestMenu />} />
      <Route path="/index" element={<Index />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/menu/admin" element={<MenuAdmin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/analytics" element={<ComprehensiveAnalytics />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/kitchen" element={<ModernKitchen />} />
      <Route path="/kitchen/old" element={<Kitchen />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<Menu />} />
    </Routes>
  );
};

const App = () => {
  console.log('App component is rendering!');
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          🍣 App Component Loaded!
        </h1>
        <p className="text-lg text-muted-foreground">
          React Router and other providers are working.
        </p>
      </div>
    </div>
  );
};

export default App;
