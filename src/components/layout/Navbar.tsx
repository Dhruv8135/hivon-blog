"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

type UserShape = {
  id: string;
  email?: string;
} | null;

export default function Navbar() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);

  const [user, setUser] = useState<UserShape>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(data.user ? { id: data.user.id, email: data.user.email ?? undefined } : null);
      setIsLoading(false);
    };

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <header className="border-b border-white/10 bg-[#0B1220] text-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link className="text-sm font-semibold tracking-wide" href="/">
          Hivon Blog
        </Link>

        <nav className="flex items-center gap-2">
          {!isLoading && !user && (
            <>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white"
                href="/login"
              >
                Login
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:from-violet-500 hover:to-indigo-500"
                href="/signup"
              >
                Sign Up
              </Link>
            </>
          )}

          {!isLoading && user && (
            <>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:from-violet-500 hover:to-indigo-500"
                href="/posts/new"
              >
                Create Post
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/15 bg-white/5 px-4 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
