"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Button from "@/components/ui/Button";
import { createBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);

    const signupResponse = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.name,
        },
      },
    });

    console.log("supabase.auth.signUp response", signupResponse);

    const { data, error } = signupResponse;

    if (error) {
      setFormError(error.message);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setFormError("Signup succeeded, but no user id was returned.");
      return;
    }

    const { error: insertError } = await supabase.from("users").insert({
      id: userId,
      name: values.name,
      email: values.email,
      role: "viewer",
    });

    if (insertError) {
      setFormError(insertError.message);
      return;
    }

    router.replace("/");
    router.refresh();
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border bg-white p-6">
        <h1 className="text-xl font-semibold">Sign up</h1>
        <p className="mt-2 text-sm text-zinc-600">Create your account.</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Name</span>
            <input className="rounded-md border px-3 py-2" placeholder="Your name" {...register("name")} />
            {errors.name && <span className="text-sm text-red-600">{errors.name.message}</span>}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Email</span>
            <input
              className="rounded-md border px-3 py-2"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && <span className="text-sm text-red-600">{errors.email.message}</span>}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Password</span>
            <input
              className="rounded-md border px-3 py-2"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && <span className="text-sm text-red-600">{errors.password.message}</span>}
          </label>

          {formError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-zinc-600">
          Already have an account?{" "}
          <Link className="underline" href="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
