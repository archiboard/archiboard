import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
        <div className="text-2xl font-semibold text-black">ArchiBoard</div>
        <Link href="/dashboard">
          <Button variant="outline" className="border-gray-300">
            Sign In
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
        <h1 className="text-5xl font-semibold text-black mb-4 max-w-3xl">
          Manage Design Projects without Chaos
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          Estimates, procurement, and supplier database in one place.
        </p>
        <Link href="/dashboard">
          <Button size="lg" className="bg-black text-white hover:bg-gray-800">
            Get Started for Free
          </Button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="px-8 py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature Card 1 */}
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-black mb-2">
              Instant Estimates
            </h3>
            <p className="text-gray-600">
              Automatic budget calculation.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-black mb-2">
              Supplier Database
            </h3>
            <p className="text-gray-600">
              All contacts and catalogs in one place.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-black mb-2">
              Client CRM
            </h3>
            <p className="text-gray-600">
              Communication history and approvals.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500 text-sm mb-2">
            © 2025 ArchiBoard. Built for Designers.
          </p>
          <a
            href="#"
            className="text-gray-500 text-sm hover:text-gray-700 underline"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
