"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Button from "@/components/ui/Button";
import { createBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  const supabase = useMemo(() => createBrowserClient(), []);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-[#0a0a1a] px-6 py-14 text-white">
      <div className="w-full max-w-md rounded-2xl border border-violet-500/30 bg-[#12122a] p-8 shadow-xl shadow-black/30">
        <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
        <p className="mt-2 text-sm text-white/60">Welcome back. Continue writing and reading.</p>

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-white/90">Email</span>
            <input
              className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && <span className="text-sm text-red-300">{errors.email.message}</span>}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-white/90">Password</span>
            <input
              className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && <span className="text-sm text-red-300">{errors.password.message}</span>}
          </label>

          {formError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {formError}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="h-11 bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500">
            {isSubmitting ? "Signing in..." : "Login"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-white/60">
          Don&apos;t have an account?{" "}
          <Link className="font-medium text-violet-300 hover:text-violet-200 hover:underline" href="/signup">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageClient />
    </Suspense>
  );
}
