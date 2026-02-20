"use client";

import { useEffect, useState } from "react";

export default function ReadPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const resolvedParams = await params;
      const res = await fetch(`/api/read/${resolvedParams.id}`);
      const d = await res.json();
      if (isMounted) setText(d.text || "Error: " + (d.error || "Unknown error"));
    })();
    return () => { isMounted = false; };
  }, [params]);

  return (
    <main className="max-w-xl mx-auto px-4 py-10 bg-zinc-950 rounded-lg shadow-lg">
      <h1 className="text-xl font-semibold text-zinc-100 mb-4 tracking-tight">Shared Text</h1>

      <textarea
        readOnly
        value={text}
        className="w-full h-48 bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-600 placeholder:text-zinc-500"
        placeholder="Loading..."
      />

      <button
        onClick={() => navigator.clipboard.writeText(text)}
        className="mt-4 w-full bg-red-600 text-zinc-100 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors duration-150 shadow-md"
      >
        Copy
      </button>
    </main>
  );
}