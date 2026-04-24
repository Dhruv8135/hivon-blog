import Link from "next/link";
import LogoutButton from "@/components/layout/LogoutButton";
import SearchBar from "@/components/layout/SearchBar";
import { createClient } from "@/lib/supabase/server";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;

  if (user) {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = data?.role ?? null;
  }

  const canCreatePost = role === "admin" || role === "author";

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-6">
        <Link className="font-semibold" href="/">
          Hivon Blog
        </Link>
        <div className="flex items-center gap-3">
          <SearchBar />
          <nav className="flex items-center gap-4 text-sm">
            {canCreatePost && (
              <Link className="hover:underline" href="/posts/new">
                New Post
              </Link>
            )}
            {user ? (
              <LogoutButton />
            ) : (
              <>
                <Link className="hover:underline" href="/login">
                  Login
                </Link>
                <Link className="hover:underline" href="/signup">
                  Signup
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
