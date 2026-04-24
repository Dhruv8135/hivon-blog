"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  return (
    <input
      className="h-9 w-56 rounded-md border px-3 text-sm"
      placeholder="Search..."
      value={value}
      onChange={(e) => {
        const next = e.target.value;
        setValue(next);
        const url = new URL(window.location.href);
        if (next) {
          url.searchParams.set("q", next);
        } else {
          url.searchParams.delete("q");
        }
        router.replace(url.pathname + url.search);
      }}
    />
  );
}
