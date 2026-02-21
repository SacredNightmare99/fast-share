"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import type Peer from "peerjs";

export default function ReceiverPage() {
  const params = useParams();
  const id = params.id as string;

  const [shareData, setShareData] = useState<any>(null);
  const [error, setError] = useState("");
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'connecting' | 'downloading' | 'done'>('idle');
  
  const peerInstance = useRef<Peer | null>(null);


  const [progress, setProgress] = useState(0);
  const receivedChunks = useRef<ArrayBuffer[]>([]);

  // 1. Fetch the share data when the page loads
  useEffect(() => {
    async function fetchShare() {
      try {
        const res = await fetch(`/api/get?id=${id}`); // Adjust this to match your actual fetch API
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        setShareData(data);
      } catch (err: any) {
        setError(err.message || "Share not found or expired.");
      }
    }
    fetchShare();
  }, [id]);

  const handleLiveDropDownload = async () => {
  setDownloadStatus('connecting');
  receivedChunks.current = []; // Reset for new download

  try {
    const { default: PeerClass } = await import("peerjs");
    const peer = new PeerClass();
    peerInstance.current = peer;

    peer.on("open", () => {
      const conn = peer.connect(shareData.peerId);

      conn.on("open", () => {
        setDownloadStatus('downloading');
      });

      // 2. UPDATED: Listen for chunks instead of a single file
      conn.on("data", (data: any) => {
        if (data.type === 'file-chunk') {
          // Add this piece to our collection
          receivedChunks.current.push(data.chunk);
          
          // Calculate progress percentage
          const currentSize = receivedChunks.current.length * 16384; 
          const percent = Math.min(Math.round((currentSize / data.totalSize) * 100), 100);
          setProgress(percent);

          // 3. Check if this was the last piece
          if (data.isLast) {
            const blob = new Blob(receivedChunks.current, { type: data.fileType });
            const downloadUrl = URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = data.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setDownloadStatus('done');
            receivedChunks.current = []; // Clear memory immediately
          }
        }
      });

      conn.on("error", () => {
        setError("Connection lost. Sender might have closed the tab.");
        setDownloadStatus('idle');
      });
    });
  } catch (err) {
    setError("Failed to connect.");
    setDownloadStatus('idle');
  }
};

  if (error) {
    return (
      <main className="w-screen h-screen flex items-center justify-center bg-zinc-950 text-red-500">
        <div className="bg-red-950/30 p-6 rounded-lg border border-red-900">{error}</div>
      </main>
    );
  }

  if (!shareData) {
    return <main className="w-screen h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">Loading secure share...</main>;
  }

  return (
  <main className="w-screen min-h-screen flex items-center justify-center bg-zinc-950 py-10">
    <div className="w-full max-w-xl px-4 flex flex-col space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Incoming Share</h1>

      {/* Text Area (if they shared text) */}
      {shareData.text && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-zinc-400 text-xs mb-2 uppercase tracking-wider">Message</p>
          <p className="text-zinc-100 font-mono whitespace-pre-wrap">{shareData.text}</p>
        </div>
      )}

      {/* File Download Area */}
      {shareData.shareType === 'p2p' ? (
        // --- P2P RECEIVER UI ---
        <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-6 flex flex-col items-center text-center space-y-4 shadow-lg">
          <span className="text-3xl animate-pulse">📡</span>
          <div>
            <h3 className="text-amber-500 font-medium text-lg">Live Drop Detected</h3>
            <p className="text-zinc-400 text-sm mt-1">
              {shareData.fileName} ({(shareData.fileSize / (1024 * 1024)).toFixed(2)} MB)
            </p>
            <p className="text-amber-600/70 text-xs mt-2">The sender is currently online waiting for you to accept this transfer.</p>
          </div>

          {/* --- PROGRESS BAR SECTION --- */}
          {downloadStatus === 'downloading' && (
            <div className="w-full space-y-2 py-2">
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-amber-500 font-medium">{progress}% received</p>
            </div>
          )}
          
          <button
            onClick={handleLiveDropDownload}
            disabled={downloadStatus !== 'idle'}
            className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-zinc-100 px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
          >
            {downloadStatus === 'idle' && "Connect & Download"}
            {downloadStatus === 'connecting' && "Connecting to Sender..."}
            {downloadStatus === 'downloading' && "Receiving File..."}
            {downloadStatus === 'done' && "Download Complete ✅"}
          </button>
        </div>
      ) : shareData.fileUrl ? (
        // --- CLOUD RECEIVER UI ---
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col items-center space-y-4 text-center">
           <h3 className="text-zinc-100 font-medium">Attached File</h3>
           <p className="text-zinc-400 text-sm">{shareData.fileName}</p>
           <a
            href={shareData.fileUrl}
            download={shareData.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-red-600 hover:bg-red-700 text-zinc-100 px-6 py-2 rounded-md font-medium transition-colors text-center"
           >
             Download File
           </a>
        </div>
      ) : null}

      {/* Security Disclaimer */}
      {shareData.oneTime && (
        <div className="text-center">
          <p className="text-zinc-500 text-xs italic">
            This is a one-time view share. Once you download or leave this page, the content will no longer be accessible.
          </p>
        </div>
      )}
    </div>
  </main>
);
}