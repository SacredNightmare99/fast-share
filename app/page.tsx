"use client";

import { useState } from "react";

const EXPIRY_OPTIONS = [
  { label: "5 minutes", value: 5 },
  { label: "10 minutes", value: 10 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
];

export default function Home() {
  const [text, setText] = useState("");
  const [oneTime, setOneTime] = useState(true);
  const [expiry, setExpiry] = useState(10);
  const [link, setLink] = useState("");

  async function share() {
    const res = await fetch("/api/create", {
      method: "POST",
      body: JSON.stringify({
        text,
        oneTime,
        expiryMinutes: expiry,
      }),
    });

    const data = await res.json();
    setLink(data.link || data.error);
  }

  return (
    <main className="w-screen h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-xl px-4 flex flex-col justify-center h-full">
        <h1 className="text-2xl font-semibold text-zinc-100 mb-4 tracking-tight">
          Fast Text Share
        </h1>

        <textarea
          className="w-full h-48 bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-600 placeholder:text-zinc-500"
          placeholder="Paste text here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Controls */}
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="text-zinc-100">One-time view</span>
            <button
              type="button"
              aria-label="Toggle one-time view"
              onClick={() => setOneTime((v) => !v)}
              className={`relative w-12 h-6 toggle-bg ${oneTime ? 'toggle-bg-on' : 'toggle-bg-off'}`}
            >
              <span
                className={`toggle-thumb ${oneTime ? 'toggle-thumb-on' : 'toggle-thumb-off'}`}
              />
            </button>
          </div>

          {!oneTime && (
            <select
              title="expiry"
              value={expiry}
              onChange={(e) => setExpiry(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-600 text-zinc-100"
            >
              {EXPIRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Expires in {o.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={share}
          className="mt-5 w-full bg-red-600 text-zinc-100 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors duration-150 shadow-md"
        >
          Share
        </button>
        {link && (
          <div className="mt-6 w-full flex flex-col items-center">
            <div className="bg-zinc-900 border-2 border-red-600 rounded-xl shadow-lg px-6 py-4 flex flex-col items-center w-full">
              <span className="text-lg font-semibold text-red-600 mb-2">Your Share Link</span>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-100 font-mono text-base break-all underline hover:text-red-600 transition-colors mb-3 w-full text-center"
              >
                {link}
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(link)}
                className="bg-red-600 text-zinc-100 px-4 py-2 rounded-md font-medium hover:bg-red-700 transition-colors duration-150 shadow"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}