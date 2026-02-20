"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [link, setLink] = useState("");

  async function share() {
    const res = await fetch("/api/create", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setLink(data.link || data.error);
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Fast Text Share</h1>

      <textarea
        className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-700"
        placeholder="Paste text here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={share}
        className="mt-4 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-md font-medium hover:bg-zinc-200"
      >
        Share
      </button>

      {link && (
        <div className="mt-4 text-sm">
          <span className="text-zinc-400">Link:</span>{" "}
          <a
            href={link}
            className="underline break-all"
            target="_blank"
          >
            {link}
          </a>
        </div>
      )}
    </main>
  );
}