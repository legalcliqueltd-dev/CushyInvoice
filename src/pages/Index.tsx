import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Receipt, FileText, Users, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">InvoiceEase</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
            Simple invoicing for
            <span className="text-primary"> small businesses</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Create professional invoices in minutes. Track payments, manage
            clients, and grow your business with ease.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Easy Invoice Creation</h3>
            <p className="text-sm text-muted-foreground">
              Create and send professional invoices in just a few clicks
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Client Management</h3>
            <p className="text-sm text-muted-foreground">
              Keep all your client information organized in one place
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Payment Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Track outstanding balances and record payments easily
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">PDF Export</h3>
            <p className="text-sm text-muted-foreground">
              Download and share invoices as professional PDF documents
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to streamline your invoicing?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of small businesses using InvoiceEase
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          © 2025 InvoiceEase. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
