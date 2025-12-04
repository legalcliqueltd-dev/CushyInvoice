import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: December 4, 2024</p>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using CushyInvoice, you agree to be bound by these Terms of Service. If you do not agree to these terms, 
              please do not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
            <p className="text-muted-foreground">
              CushyInvoice is an online invoicing platform that allows users to create, manage, and send invoices to their clients. 
              We provide tools for invoice creation, client management, expense tracking, and reporting.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. User Accounts</h2>
            <p className="text-muted-foreground">To use our service, you must:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Subscription and Payments</h2>
            <p className="text-muted-foreground">
              CushyInvoice offers both free and premium subscription plans. By subscribing to a premium plan:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You authorize us to charge your payment method on a recurring basis</li>
              <li>Subscription fees are non-refundable except as required by law</li>
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>Price changes will be communicated in advance</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Acceptable Use</h2>
            <p className="text-muted-foreground">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the service for any unlawful purpose</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Transmit malicious code or interfere with the service</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the service to send spam or fraudulent invoices</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content, features, and functionality of CushyInvoice are owned by us and are protected by copyright, 
              trademark, and other intellectual property laws. You retain ownership of any data you input into the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Data and Privacy</h2>
            <p className="text-muted-foreground">
              Your use of CushyInvoice is also governed by our Privacy Policy. You are responsible for the accuracy 
              of the data you enter and for obtaining necessary consents to store client information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              CushyInvoice is provided "as is" without warranties of any kind. We are not liable for any indirect, 
              incidental, special, consequential, or punitive damages arising from your use of the service. 
              Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless CushyInvoice and its affiliates from any claims, damages, 
              or expenses arising from your use of the service or violation of these terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Service Availability</h2>
            <p className="text-muted-foreground">
              We strive to maintain service availability but do not guarantee uninterrupted access. We may modify, 
              suspend, or discontinue the service at any time with reasonable notice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account at any time for violation of these terms. Upon termination, 
              your right to use the service ceases immediately. You may export your data before account closure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">12. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. We will notify users of material changes 
              via email or through the service. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">13. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms are governed by and construed in accordance with applicable laws. Any disputes shall 
              be resolved through binding arbitration or in the courts of competent jurisdiction.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">14. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-muted-foreground">
              Email: support@cushyinvoice.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
