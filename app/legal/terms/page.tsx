import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | ArchiBoard",
  description: "Terms of Service for ArchiBoard design project management.",
};

export default function TermsPage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Terms of Service
      </h1>
      <p className="text-gray-600 text-sm mb-12">
        Last updated: February 17, 2025
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          1. Introduction
        </h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          Welcome to ArchiBoard (&quot;Service&quot;), a design project management
          platform that helps design professionals manage estimates,
          procurement, suppliers, and client communications in one place. By
          accessing or using ArchiBoard, you agree to be bound by these Terms of
          Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not
          use the Service.
        </p>
        <p className="text-gray-600 leading-relaxed">
          ArchiBoard is provided by the operator of this application and is
          intended for use by architects, interior designers, and related
          professionals.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          2. User Responsibilities
        </h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          You are responsible for all activity that occurs under your account.
          When using ArchiBoard, you agree to:
        </p>
        <ul className="list-disc pl-6 text-gray-600 leading-relaxed space-y-2 mb-3">
          <li>
            Provide accurate and complete registration information and keep it
            updated.
          </li>
          <li>
            Maintain the security of your account credentials and not share them
            with others.
          </li>
          <li>
            Use the Service only for lawful purposes and in accordance with
            applicable laws and regulations.
          </li>
          <li>
            Ensure that any design data, project files, images, estimates, and
            other content you upload or create does not infringe upon any
            third-party rights and that you have the necessary rights to store
            and process such data through our Service.
          </li>
          <li>
            Not use the Service to transmit malicious code, spam, or content
            that could harm the Service or other users.
          </li>
        </ul>
        <p className="text-gray-600 leading-relaxed">
          You are solely responsible for backing up your design data and
          ensuring that critical information is preserved outside of the
          Service.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          3. Intellectual Property
        </h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          ArchiBoard and its original content, features, and functionality are
          owned by the operator and are protected by international copyright,
          trademark, and other intellectual property laws.
        </p>
        <p className="text-gray-600 leading-relaxed mb-3">
          You retain all rights to the content you create and upload to
          ArchiBoard (including project data, images, estimates, and catalogs).
          By uploading content, you grant us a limited license to store,
          process, and display that content solely for the purpose of providing
          the Service to you.
        </p>
        <p className="text-gray-600 leading-relaxed">
          You may not copy, modify, distribute, sell, or create derivative works
          of the ArchiBoard platform, software, or branding without prior
          written consent.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          4. Termination
        </h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          We may suspend or terminate your access to the Service at any time, with
          or without cause or notice, including for breach of these Terms.
        </p>
        <p className="text-gray-600 leading-relaxed mb-3">
          You may stop using the Service at any time. If you wish to delete your
          account and associated data, please contact us. We will process
          deletion requests in accordance with our data retention and privacy
          policies.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Upon termination, your right to use the Service ceases immediately.
          Sections of these Terms that by their nature should survive
          termination (including Intellectual Property, Disclaimer, and
          Limitation of Liability) will survive.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          5. Disclaimer
        </h2>
        <p className="text-gray-600 leading-relaxed mb-3">
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
          WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT
          LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p className="text-gray-600 leading-relaxed mb-3">
          We do not warrant that the Service will be uninterrupted, secure, or
          error-free. Estimates, budgets, and procurement data generated or
          displayed in ArchiBoard are for informational purposes and should not
          be relied upon as the sole basis for business or financial decisions
          without independent verification.
        </p>
        <p className="text-gray-600 leading-relaxed">
          To the maximum extent permitted by applicable law, we shall not be
          liable for any indirect, incidental, special, consequential, or
          punitive damages arising from your use of or inability to use the
          Service.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          6. Contact
        </h2>
        <p className="text-gray-600 leading-relaxed">
          If you have questions about these Terms of Service, please contact us
          through the contact information provided on the ArchiBoard website.
        </p>
      </section>
    </article>
  );
}
