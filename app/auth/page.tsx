"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function AuthPage() {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
        <Link href="/" className="text-2xl font-semibold text-black">
          ArchiBoard
        </Link>
        <Link href="/">
          <Button variant="outline" className="border-gray-300">
            Back
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold text-black mb-2 text-center">
            Welcome to ArchiBoard
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            Sign in or create an account to manage your design projects.
          </p>

          {/* Terms & Privacy Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-8 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer sr-only"
              />
              <div
                className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                  agreed
                    ? "bg-black border-black"
                    : "border-gray-300 bg-white"
                }`}
              >
                {agreed && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
            </div>
            <span className="text-sm text-gray-700 leading-relaxed">
              I agree to the{" "}
              <a
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black font-medium underline hover:no-underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black font-medium underline hover:no-underline"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Link
              href={agreed ? "/dashboard" : "#"}
              onClick={(e) => !agreed && e.preventDefault()}
              className="block"
            >
              <Button
                size="lg"
                className="w-full bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none"
                disabled={!agreed}
              >
                Sign In
              </Button>
            </Link>
            <Link
              href={agreed ? "/dashboard" : "#"}
              onClick={(e) => !agreed && e.preventDefault()}
              className="block"
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full border-gray-300 disabled:opacity-50 disabled:pointer-events-none"
                disabled={!agreed}
              >
                Get Started for Free
              </Button>
            </Link>
          </div>

          {!agreed && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Please agree to the Terms of Service and Privacy Policy to continue.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
