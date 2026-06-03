"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (r.ok) {
      router.replace(params.get("from") || "/");
      router.refresh();
    } else {
      setErr("Invalid access token");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-6">
        <div className="font-mono text-sm font-semibold tracking-tight text-[var(--color-ink)]">
          BUNKER<span className="text-[var(--color-accent)]">·</span>DESK
        </div>
        <div className="mt-0.5 text-[10px] uppercase tracking-widest text-[var(--color-ink-faint)]">Private — access required</div>
        <label className="mt-5 block text-[11px] text-[var(--color-ink-dim)]">
          Access token
          <input
            autoFocus
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-[13px] text-[var(--color-ink)]"
          />
        </label>
        {err ? <p className="mt-2 text-[11px] text-[var(--color-neg)]">{err}</p> : null}
        <button
          type="submit"
          disabled={busy || !token}
          className="mt-4 w-full rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-2 text-[13px] text-[var(--color-ink)] hover:bg-[var(--color-accent)]/20 disabled:opacity-40"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
