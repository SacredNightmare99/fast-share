# Fast Share

Fast Share is a lightweight Next.js app for sending text and files between devices using short access codes.

It supports two transfer modes:

- **Cloud Share** (small files + text): uploads content and serves a download link.
- **Live Drop** (large files over 50MB): creates a direct peer-to-peer transfer while both users stay online.

## Features

- Send text snippets and optional file attachments from one page.
- 6-character access code and direct link generation.
- QR code output for easy mobile handoff.
- One-time share mode for safer access.
- Configurable expiry window (up to 60 minutes).
- Live transfer progress for sender and receiver during P2P downloads.

## Tech Stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS
- **Storage:** MongoDB (share metadata + expiry)
- **File uploads:** Vercel Blob (for cloud shares)
- **P2P transport:** PeerJS (for Live Drop)

## How it works

1. Sender enters text and optionally selects a file.
2. If file size is `<= 50MB`, Fast Share uses **Cloud Share**.
3. If file size is `> 50MB`, Fast Share switches to **Live Drop** automatically.
4. A share record is created with a 6-character ID.
5. Receiver opens `/s/<CODE>` (or enters the code in Receive mode).

## Environment variables

Create a `.env.local` file with:

```bash
MONGODB_URI=your-mongodb-connection-string
NEXT_PUBLIC_BASE_URL=http://localhost:3000
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Scripts

- `npm run dev` — start development server
- `npm run build` — create production build
- `npm run start` — run production server
- `npm run lint` — run ESLint

## Notes

- Live Drop requires both sender and receiver to keep tabs open during transfer.
- One-time shares are deleted after first read.
- Expired shares are automatically removed from the database.
