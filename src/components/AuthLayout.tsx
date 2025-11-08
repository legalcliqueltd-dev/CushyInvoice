import { ReactNode } from "react";
import { Receipt } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between text-primary-foreground">
        <div className="flex items-center gap-2">
          <Receipt className="h-8 w-8" />
          <span className="text-2xl font-bold">InvoiceEase</span>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Simple invoicing for
            <br />
            small businesses
          </h1>
          <p className="text-xl opacity-90">
            Create professional invoices, track payments, and manage clients all in one place.
          </p>
        </div>

        <div className="text-sm opacity-75">
          © 2025 InvoiceEase. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Receipt className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">InvoiceEase</span>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
