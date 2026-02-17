import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | ArchiBoard",
  description: "Privacy Policy for ArchiBoard design project management.",
};

export default function PrivacyPage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Privacy Policy
      </h1>
      <p className="text-gray-600 text-sm mb-12">
        Last updated: February 17, 2025
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          1. Data Collection
        </h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          ArchiBoard collects information necessary to provide and improve our
          design project management service. We collect:
        </p>
        <ul className="list-disc pl-6 text-gray-600 leading-relaxed space-y-2 mb-3">
          <li>
            <strong>Account information</strong> — including email address,
            name, and password (stored in encrypted form) when you register.
          </li>
          <li>
            <strong>Project data</strong> — including project names, room
            layouts, item lists, estimates, and associated metadata that you
            create in the application.
          </li>
          <li>
            <strong>Project images</strong> — including product images, design
            visuals, and other files you upload to projects or the catalog.
          </li>
          <li>
            <strong>Usage data</strong> — such as how you interact with the
            Service, features used, and general usage patterns to improve our
            product.
          </li>
        </ul>
        <p className="text-gray-600 leading-relaxed">
          We do not sell your personal information to third parties.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          2. How We Use Data
        </h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          We use the data we collect to:
        </p>
        <ul className="list-disc pl-6 text-gray-600 leading-relaxed space-y-2">
          <li>Provide, operate, and maintain the ArchiBoard service.</li>
          <li>
            Enable you to create and manage projects, estimates, catalogs, and
            client contacts.
          </li>
          <li>Process and store uploaded images and files.</li>
          <li>Send you service-related communications (e.g., account updates).</li>
          <li>Improve our Service and develop new features.</li>
          <li>
            Respond to your inquiries and provide customer support.
          </li>
          <li>Comply with legal obligations and enforce our terms.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          3. Data Security
        </h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          We take data security seriously. ArchiBoard uses Supabase for
          database and file storage, a trusted infrastructure provider with
          strong security practices, including:
        </p>
        <ul className="list-disc pl-6 text-gray-600 leading-relaxed space-y-2 mb-3">
          <li>Encryption of data in transit (TLS/HTTPS).</li>
          <li>Encryption of data at rest where applicable.</li>
          <li>Access controls and authentication mechanisms.</li>
          <li>Regular security monitoring and updates.</li>
        </ul>
        <p className="text-gray-600 leading-relaxed">
          While we implement industry-standard security measures, no method of
          transmission over the Internet or electronic storage is 100% secure. We
          encourage you to use strong passwords and keep your account
          credentials confidential.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          4. User Rights
        </h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          Depending on your jurisdiction, you may have the following rights
          regarding your personal data:
        </p>
        <ul className="list-disc pl-6 text-gray-600 leading-relaxed space-y-2 mb-3">
          <li>
            <strong>Access</strong> — You can request a copy of the personal
            data we hold about you.
          </li>
          <li>
            <strong>Correction</strong> — You can update your account information
            at any time through the application settings.
          </li>
          <li>
            <strong>Deletion</strong> — You can request that we delete your
            account and associated data. We will process such requests in
            accordance with applicable law.
          </li>
          <li>
            <strong>Data portability</strong> — You may request an export of
            your data in a portable format where technically feasible.
          </li>
          <li>
            <strong>Opt-out</strong> — You can opt out of marketing
            communications at any time.
          </li>
        </ul>
        <p className="text-gray-600 leading-relaxed">
          To exercise these rights, please contact us through the contact
          information provided on the ArchiBoard website. We will respond to
          your request within a reasonable timeframe as required by applicable
          law.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          5. Cookies and Tracking
        </h2>
        <p className="text-gray-600 leading-relaxed">
          ArchiBoard may use cookies and similar technologies to maintain your
          session, remember your preferences, and improve the Service. You can
          manage cookie settings through your browser. Disabling certain
          cookies may affect the functionality of the Service.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          6. Changes to This Policy
        </h2>
        <p className="text-gray-600 leading-relaxed">
          We may update this Privacy Policy from time to time. We will notify
          you of any material changes by posting the updated policy on this
          page and updating the &quot;Last updated&quot; date. Your continued use of
          ArchiBoard after such changes constitutes your acceptance of the
          updated policy.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          7. Contact
        </h2>
        <p className="text-gray-600 leading-relaxed">
          If you have questions about this Privacy Policy or how we handle your
          data, please contact us through the contact information provided on
          the ArchiBoard website.
        </p>
      </section>
    </article>
  );
}
