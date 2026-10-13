import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service · QR Digital Loyalty System",
  description: "Terms and conditions for using QR Digital Loyalty System",
};

export default function TermsPage() {
  const brand =
    process.env.NEXT_PUBLIC_BRAND_NAME || "QR Digital Loyalty System";
  const email =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-8"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <article className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 font-medium mb-8">
            Last updated: October 2026
          </p>

          <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using {brand} (the "Service"), you agree to be
                bound by these Terms. If you do not agree, please do not use the
                Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                2. Description of Service
              </h2>
              <p>
                {brand} provides a digital loyalty and stamp card platform for
                merchants and their customers. Merchants can create loyalty
                programs, generate QR codes, and manage customer rewards.
                Customers can earn stamps and redeem rewards at participating
                merchants.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                3. Merchant Accounts
              </h2>
              <p>
                Merchants must provide accurate information during registration.
                You are responsible for maintaining the confidentiality of your
                account credentials and for all activity that occurs under your
                account. Merchants agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Provide truthful business information</li>
                <li>Honor rewards as advertised to customers</li>
                <li>Not misuse the platform for fraudulent purposes</li>
                <li>Comply with all applicable Pakistani laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                4. Customer Data and Privacy
              </h2>
              <p>
                By using the Service, you consent to the collection and use of
                data as described in our{" "}
                <Link href="/privacy" className="text-indigo-600 underline">
                  Privacy Policy
                </Link>
                . Merchants agree to use customer data only for legitimate
                loyalty program communication.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                5. Subscription and Payment
              </h2>
              <p>
                New merchants receive a 15-day free trial. After the trial
                period, continued use requires a paid subscription as agreed
                between the merchant and {brand}. Subscription fees, payment
                terms, and cancellation policies are communicated separately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                6. Prohibited Uses
              </h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Send spam or unsolicited messages to customers</li>
                <li>Attempt to breach or circumvent security features</li>
                <li>Reverse engineer or copy any part of the Service</li>
                <li>Violate the rights of other merchants or customers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                7. Service Availability
              </h2>
              <p>
                We aim for high uptime but do not guarantee uninterrupted
                service. We may suspend or modify the Service for maintenance,
                security, or improvements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                8. Termination
              </h2>
              <p>
                We may suspend or terminate accounts that violate these Terms or
                that we reasonably believe pose risk to the platform or its
                users. Merchants may cancel their accounts at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                9. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, {brand} is not liable for
                indirect, incidental, or consequential damages arising from use
                of the Service. Our total liability is limited to the amount
                paid by you in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                10. Governing Law
              </h2>
              <p>
                These Terms are governed by the laws of Pakistan. Any disputes
                will be resolved in the courts of Pakistan.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                11. Contact
              </h2>
              <p>
                For questions about these Terms, contact us at{" "}
                <a
                  href={`mailto:${email}`}
                  className="text-indigo-600 underline"
                >
                  {email}
                </a>
                .
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}