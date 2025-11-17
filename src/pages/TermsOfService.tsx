import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <NavLink to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </NavLink>

        <h1 className="text-4xl font-bold mb-2 text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using CushyInvoice, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              CushyInvoice provides an online platform for creating, managing, and tracking invoices. Our service includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Invoice creation and management tools</li>
              <li>Client and product management</li>
              <li>Payment tracking and reminders</li>
              <li>Report generation and analytics</li>
              <li>PDF export and email notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="mb-4">To use our service, you must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payment</h2>
            <p className="mb-4">
              CushyInvoice offers both free and premium subscription plans. By subscribing to a paid plan:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You agree to pay all fees associated with your chosen plan</li>
              <li>Payments are processed through secure third-party providers</li>
              <li>Subscriptions automatically renew unless cancelled</li>
              <li>Refunds are provided according to our refund policy</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. User Content and Data</h2>
            <p className="mb-4">You retain ownership of all data you submit to CushyInvoice. By using our service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You grant us permission to store and process your data</li>
              <li>You are responsible for the accuracy of your data</li>
              <li>You must not upload illegal or infringing content</li>
              <li>You can export or delete your data at any time</li>
              <li>We backup your data but recommend maintaining your own backups</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service for illegal purposes</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Distribute viruses or malicious code</li>
              <li>Interfere with other users' access to the service</li>
              <li>Use automated systems to access the service without permission</li>
              <li>Resell or redistribute the service without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <p>
              All content, features, and functionality of CushyInvoice are owned by us and protected by intellectual property laws. You may not copy, modify, or create derivative works without our express permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Service Availability</h2>
            <p className="mb-4">
              We strive to maintain high service availability, but we do not guarantee uninterrupted access. We may:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Perform scheduled maintenance with advance notice</li>
              <li>Experience unexpected downtime</li>
              <li>Modify or discontinue features with notice</li>
              <li>Suspend access for violation of terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, CushyInvoice shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p className="mb-4">
              Either party may terminate this agreement at any time:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You may cancel your account through your settings</li>
              <li>We may suspend or terminate accounts that violate these terms</li>
              <li>Upon termination, you lose access to your account and data</li>
              <li>We will provide reasonable notice before termination when possible</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the service. Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:support@cushyinvoice.com" className="text-primary hover:underline">
                support@cushyinvoice.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
