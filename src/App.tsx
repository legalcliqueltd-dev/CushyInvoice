import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Products from "./pages/Products";
import Invoices from "./pages/Invoices";
import InvoiceNew from "./pages/InvoiceNew";
import InvoiceDetail from "./pages/InvoiceDetail";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Subscribe from "./pages/Subscribe";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import RecurringInvoices from "./pages/RecurringInvoices";
import Expenses from "./pages/Expenses";
import Templates from "./pages/Templates";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ProtectedRoute from "./components/ProtectedRoute";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorInfo: string; componentStack: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorInfo: "", componentStack: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: `${error.name}: ${error.message}` };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const stack = info.componentStack || "";
    this.setState({ componentStack: stack });
    console.error("=== ErrorBoundary caught ===");
    console.error("Error:", error.name, error.message);
    console.error("Stack:", error.stack);
    console.error("Component stack:", stack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground text-sm">An unexpected error occurred.</p>
            <pre className="text-xs text-left bg-muted p-3 rounded-lg overflow-auto max-h-40 whitespace-pre-wrap break-all">
              {this.state.errorInfo}
            </pre>
            {this.state.componentStack && (
              <pre className="text-xs text-left bg-muted p-3 rounded-lg overflow-auto max-h-40 whitespace-pre-wrap break-all">
                {this.state.componentStack}
              </pre>
            )}
            <Button onClick={() => { this.setState({ hasError: false, errorInfo: "", componentStack: "" }); window.location.reload(); }}>
              Retry
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset" element={<ResetPassword />} />
            <Route path="/auth/verify" element={<VerifyOtp />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-failed" element={<PaymentFailed />} />
            
            {/* Protected routes - require authentication */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/invoices/new" element={<ProtectedRoute><InvoiceNew /></ProtectedRoute>} />
            <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
            <Route path="/invoices/:id/edit" element={<ProtectedRoute><InvoiceNew /></ProtectedRoute>} />
            <Route path="/recurring" element={<ProtectedRoute><RecurringInvoices /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
