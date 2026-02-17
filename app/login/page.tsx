"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

const ROLES = [
  "Interior Designer",
  "Architect",
  "Procurement Manager",
  "Studio Owner",
  "Student",
] as const;

const TEAM_SIZES = [
  "Freelance (1)",
  "Small Studio (2-5)",
  "Medium (6-20)",
  "Large (20+)",
] as const;

type TabMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<TabMode>("signin");

  // Shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign up only
  const [fullName, setFullName] = useState("");
  const [studioName, setStudioName] = useState("");
  const [role, setRole] = useState<string>("");
  const [teamSize, setTeamSize] = useState<string>("");
  const [agreed, setAgreed] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            studio_name: studioName,
            role: role || undefined,
            team_size: teamSize || undefined,
          },
        },
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <Link href="/" className="text-xl font-semibold text-gray-900">
          ArchiBoard
        </Link>
        <Link href="/">
          <Button variant="outline" size="sm" className="border-gray-300">
            Back to Home
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(null); }}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  mode === "signin"
                    ? "text-gray-900 border-b-2 border-gray-900 bg-gray-50/50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(null); }}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  mode === "signup"
                    ? "text-gray-900 border-b-2 border-gray-900 bg-gray-50/50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="p-6">
              {error && (
                <p className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg">
                  {error}
                </p>
              )}

              {mode === "signin" ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email" className="text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password" className="text-gray-700">
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1.5"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 mt-2"
                    disabled={loading}
                  >
                    {loading ? "Signing in…" : "Sign In"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name" className="text-gray-700">
                      Full Name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Jane Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1.5"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email" className="text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="text-gray-700">
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1.5"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-studio" className="text-gray-700">
                      Studio / Company Name
                    </Label>
                    <Input
                      id="signup-studio"
                      type="text"
                      placeholder="My Design Studio"
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-700">Team Size</Label>
                    <Select value={teamSize} onValueChange={setTeamSize}>
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_SIZES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors mt-4">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div
                        className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                          agreed ? "bg-gray-900 border-gray-900" : "border-gray-300 bg-white"
                        }`}
                      >
                        {agreed && (
                          <Check size={12} className="text-white" strokeWidth={3} />
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 leading-relaxed">
                      I agree to the{" "}
                      <a
                        href="/legal/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 underline hover:no-underline"
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="/legal/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 underline hover:no-underline"
                      >
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 mt-2 disabled:opacity-50"
                    disabled={!agreed || loading}
                  >
                    {loading ? "Creating account…" : "Create Account"}
                  </Button>
                </form>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(null); }}
                  className="font-medium text-gray-900 underline hover:no-underline"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(null); }}
                  className="font-medium text-gray-900 underline hover:no-underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
