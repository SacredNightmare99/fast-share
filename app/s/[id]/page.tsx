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
    <main className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold mb-4">Shared Text</h1>

      <textarea
        readOnly
        value={text}
        className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-md p-3 resize-none"
        placeholder="Text has expired or is invalid."
      />

      <button
        onClick={() => navigator.clipboard.writeText(text)}
        className="mt-4 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-md font-medium hover:bg-zinc-200"
      >
        Copy
      </button>
    </main>
  );
}