import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy · QR Digital Loyalty System",
  description: "How we collect, use, and protect your data",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 font-medium mb-8">
            Last updated: October 2026
          </p>

          <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                1. Introduction
              </h2>
              <p>
                {brand} ("we", "us") operates a digital loyalty platform. This
                Privacy Policy explains how we collect, use, and protect your
                personal information when you use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                2. Information We Collect
              </h2>
              <p>We collect the following information:</p>

              <h3 className="font-bold text-slate-900 mt-4 mb-2">
                From Merchants:
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Business name, type, and description</li>
                <li>Email address</li>
                <li>Password (securely hashed, never stored in plain text)</li>
                <li>Business branding preferences (colors, logo)</li>
                <li>Reward configuration</li>
              </ul>

              <h3 className="font-bold text-slate-900 mt-4 mb-2">
                From Customers:
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name (optional)</li>
                <li>Phone number (used as loyalty ID)</li>
                <li>Visit history at participating merchants</li>
                <li>Stamp and reward activity</li>
                <li>Marketing consent preference</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                3. How We Use Your Information
              </h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Provide and improve the Service</li>
                <li>Enable loyalty stamp tracking</li>
                <li>Allow merchants to communicate offers (only with consent)</li>
                <li>Send service notifications (trial warnings, receipts)</li>
                <li>Respond to support requests</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                4. Marketing Communication
              </h2>
              <p>
                We only send promotional messages to customers who have
                explicitly opted in. Merchants can send offers to their own
                opted-in customers through our platform. Customers can withdraw
                consent at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                5. Data Sharing
              </h2>
              <p>
                We do NOT sell your personal information. We share data only:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  With the merchant you interact with (for their loyalty
                  program)
                </li>
                <li>With service providers (hosting, database) under strict agreements</li>
                <li>When required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                6. Data Security
              </h2>
              <p>
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Encrypted HTTPS connections</li>
                <li>Hashed passwords (bcrypt)</li>
                <li>Row-level security in database</li>
                <li>Regular backups</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                7. Data Retention
              </h2>
              <p>
                We retain your data for as long as your account is active or as
                needed to provide the Service. You may request deletion of your
                data by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                8. Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Access the data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw marketing consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                9. Cookies and Local Storage
              </h2>
              <p>
                We use cookies and browser local storage for authentication and
                session management. We do not use cookies for advertising
                tracking.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                10. Children's Privacy
              </h2>
              <p>
                Our Service is not directed to children under 13. We do not
                knowingly collect data from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                11. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. Material
                changes will be communicated to merchants via email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                12. Contact
              </h2>
              <p>
                For questions or data requests, contact us at{" "}
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