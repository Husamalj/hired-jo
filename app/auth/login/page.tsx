"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Mail, Lock, Globe, RefreshCw } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"info" | "error" | "success">("info");
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const next = searchParams.get("next") ?? "/jobs";

  async function handleGoogleSignIn() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${next}` },
    });
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setShowResend(false);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setMessage("Please confirm your email first. Check your inbox (and spam folder).");
          setMessageType("error");
          setShowResend(true);
        } else {
          setMessage(error.message);
          setMessageType("error");
        }
        setLoading(false);
        return;
      }
      location.href = next;
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback?next=/build` },
      });
      setLoading(false);
      if (error) {
        setMessage(error.message);
        setMessageType("error");
        return;
      }
      // Supabase returns identities: [] when email is already registered
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setMessage("This email is already registered. Try signing in, or use Continue with Google if you signed up that way.");
        setMessageType("error");
        return;
      }
      setMessage("Confirmation email sent! Check your inbox — and your spam folder just in case.");
      setMessageType("success");
      setShowResend(true);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=/build` },
    });
    setResending(false);
    if (error) {
      setMessage(`Resend failed: ${error.message}`);
      setMessageType("error");
    } else {
      setMessage("Confirmation email resent! Check your inbox and spam folder.");
      setMessageType("success");
    }
  }

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-extrabold gold-text-grad mb-2">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-white/45 text-sm">Your CV and progress sync across devices.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-300/20 bg-red-400/8 px-4 py-3 text-sm text-red-200">
              Authentication failed. Please try again.
            </div>
          )}


          <div className="feature-card rounded-2xl border border-white/8 bg-white/[0.04] p-6 space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
            >
              <Globe size={18} /> Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/30">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-3 text-sm text-white placeholder-white/30 focus:border-yellow-300/40 focus:outline-none"
                />
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-3 text-sm text-white placeholder-white/30 focus:border-yellow-300/40 focus:outline-none"
                />
              </div>

              {message && (
                <div className={`rounded-xl px-4 py-3 text-sm ${
                  messageType === "error"
                    ? "border border-red-300/20 bg-red-400/8 text-red-200"
                    : "border border-green-300/20 bg-green-400/8 text-green-200"
                }`}>
                  <p>{message}</p>
                  {showResend && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-200 hover:underline disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={resending ? "animate-spin" : ""} />
                      {resending ? "Resending…" : "Resend confirmation email"}
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl gold-grad px-4 py-3 text-sm font-extrabold text-black disabled:opacity-50"
              >
                {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <p className="text-center text-xs text-white/35">
              {mode === "login" ? "No account?" : "Already have one?"}{" "}
              <button
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(null); }}
                className="text-yellow-200 hover:underline"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
