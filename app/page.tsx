"use client";

import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import type Peer from "peerjs";

const EXPIRY_OPTIONS = [
  { label: "5 minutes", value: 5 },
  { label: "10 minutes", value: 10 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
];

const CLOUD_LIMIT_MB = 50;

export default function Home() {
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [oneTime, setOneTime] = useState(true);
  const [expiry, setExpiry] = useState(10);
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  // New States for Code Access
  const [mode, setMode] = useState<'send' | 'receive'>('send');
  const [accessCode, setAccessCode] = useState("");
  
  // UI States
  const [isUploading, setIsUploading] = useState(false);
  const [isLiveDrop, setIsLiveDrop] = useState(false);
  const [peerStatus, setPeerStatus] = useState<'idle' | 'waiting' | 'transferring' | 'done'>('idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const peerInstance = useRef<Peer | null>(null);

  useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (peerStatus === 'transferring') {
      e.preventDefault();
      e.returnValue = ''; // Triggers the standard browser "Are you sure?" popup
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [peerStatus]);

  // Function to handle the code submission
  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.length < 6) return;
    // Redirect the user to the share page using their code
    window.location.href = `/s/${accessCode.toUpperCase()}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      const sizeInMB = selectedFile.size / (1024 * 1024);
      setIsLiveDrop(sizeInMB > CLOUD_LIMIT_MB);
    } else {
      setIsLiveDrop(false);
    }
  };

  async function share() {
    setLink("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("text", text);
      formData.append("oneTime", String(oneTime));
      formData.append("expiryMinutes", String(expiry));

      if (isLiveDrop && file) {
        const { default: PeerClass } = await import("peerjs");
        const peer = new PeerClass();
        peerInstance.current = peer;

        peer.on("open", async (id) => {
          formData.append("peerId", id);
          formData.append("shareType", "p2p");
          formData.append("fileName", file.name);
          formData.append("fileSize", String(file.size));

          const res = await fetch("/api/create", { method: "POST", body: formData });
          const data = await res.json();
          setLink(data.link || data.error);
          setPeerStatus('waiting');
          setIsUploading(false);
        });

      //Added Chunking and Progress Logic for Sender
        peer.on("connection", (conn) => {
          setPeerStatus('transferring');
          // NEW: Request Wake Lock to prevent sleep
          let wakeLock: any = null;
          const requestWakeLock = async () => {
            try {
              if ('wakeLock' in navigator) {
                wakeLock = await (navigator as any).wakeLock.request('screen');
              }
            } catch (err) {
              console.error("Wake Lock failed:", err);
            }
          };
          requestWakeLock();

          conn.on("open", () => {
            const chunkSize = 16384; // 16KB per chunk
            let offset = 0;

            const sendNextChunk = () => {
              if (file && offset < file.size) {
                const chunk = file.slice(offset, offset + chunkSize);
                conn.send({
                  type: 'file-chunk',
                  chunk: chunk,
                  fileName: file.name,
                  fileType: file.type,
                  totalSize: file.size,
                  isLast: offset + chunkSize >= file.size
                });
                
                offset += chunkSize;
                setProgress(Math.round((offset / file.size) * 100));
                
                // Recursively send chunks
                setTimeout(sendNextChunk, 1); 
              } else {
                setPeerStatus('done');
              }
            };
            sendNextChunk();
          });
        });
        
      }
      
      else {
        formData.append("shareType", "cloud");
        if (file) formData.append("file", file);

        const res = await fetch("/api/create", { method: "POST", body: formData });
        const data = await res.json();
        setLink(data.link || data.error);
        if (data.link) setFile(null);
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Upload failed", error);
      setLink("Error sharing content");
      setIsUploading(false);
    }
  }

  return (
    <main className="w-screen min-h-screen flex items-center justify-center bg-zinc-950 py-10 relative">
      
      {isLiveDrop && peerStatus === 'idle' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-md animate-in fade-in slide-in-from-top-4 duration-300 px-4">
          <div className="bg-amber-900/30 border border-amber-600/50 text-amber-200 px-4 py-3 rounded-lg text-sm flex items-start gap-3 shadow-xl backdrop-blur-sm">
            <span className="text-lg">⚠️</span>
            <p><strong>Large file detected.</strong> Since it's over 50MB, this will be a Live Drop. You must keep this tab open until the receiver downloads it.</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-xl px-4 flex flex-col justify-center h-full">
        
        {/* --- MODE TOGGLE --- */}
        <div className="flex bg-zinc-900 p-1 rounded-xl mb-8 border border-zinc-800">
          <button 
            onClick={() => setMode('send')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'send' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'}`}
          >
            Send
          </button>
          <button 
            onClick={() => setMode('receive')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'receive' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'}`}
          >
            Receive
          </button>
        </div>

        {mode === 'receive' ? (
          /* --- RECEIVE UI --- */
          <form onSubmit={handleCodeSubmit} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-zinc-100">Enter Access Code</h2>
              <p className="text-zinc-500 text-sm">Type the 6-character code to download your file.</p>
            </div>
            
            <input
              type="text"
              maxLength={6}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="E.g. XJ39K2"
              className="w-full bg-zinc-900 border-2 border-zinc-800 focus:border-red-600 rounded-xl py-4 text-center text-3xl font-bold tracking-[0.5em] text-white focus:outline-none transition-all placeholder:text-zinc-800"
            />

            <button
              type="submit"
              disabled={accessCode.length < 6}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold disabled:opacity-50 transition-colors shadow-lg shadow-red-900/20"
            >
              Access Content
            </button>
          </form>
        ) : (
          /* --- SEND UI --- */
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <h1 className="text-2xl font-semibold text-zinc-100 mb-4 tracking-tight">Fast Text Share</h1>

            <textarea
              className="w-full h-48 bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-600 placeholder:text-zinc-500 font-mono text-sm"
              placeholder="Paste text or code here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={peerStatus !== 'idle'}
            />

            <div className="mt-4">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} disabled={peerStatus !== 'idle'} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={peerStatus !== 'idle'}
                className={`w-full py-2 px-4 border-2 border-dashed rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLiveDrop ? "border-amber-600/50 text-amber-200 bg-amber-900/10" : "border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600"
                }`}
              >
                {file ? `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)` : "Click to attach a file (optional)"}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="text-zinc-100">One-time view</span>
                <button
                  type="button"
                  onClick={() => setOneTime((v) => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${oneTime ? 'bg-red-600' : 'bg-zinc-800'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${oneTime ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {!oneTime && (
                <select
                  value={expiry}
                  onChange={(e) => setExpiry(Number(e.target.value))}
                  className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-600 text-zinc-100"
                >
                  {EXPIRY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>Expires in {o.label}</option>
                  ))}
                </select>
              )}
            </div>

            <button
              onClick={share}
              disabled={isUploading || peerStatus !== 'idle'}
              className={`mt-5 w-full text-zinc-100 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isLiveDrop ? "bg-amber-700 hover:bg-amber-800" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isUploading ? "Processing..." : isLiveDrop ? "Start Live Drop" : "Share"}
            </button>

            {link && (
              <div className="mt-6 w-full flex flex-col items-center">
                <div className={`border-2 rounded-xl shadow-lg px-6 py-5 flex flex-col items-center w-full space-y-4 ${
                  isLiveDrop ? "bg-amber-950/40 border-amber-600" : "bg-zinc-900 border-red-600"
                }`}>
                  
                  {/* {isLiveDrop && (
                    <div className="w-full text-center pb-2 border-b border-amber-900/50">
                      {peerStatus === 'waiting' && <p className="text-amber-500 animate-pulse font-medium">📡 Listening for receiver... Do not close tab!</p>}
                      {peerStatus === 'transferring' && <p className="text-blue-500 animate-pulse font-medium">🚀 Receiver connected! Transferring file...</p>}
                      {peerStatus === 'done' && <p className="text-green-500 font-medium">✅ Transfer complete! You can close this tab.</p>}
                    </div>
                  )} */}

                  {isLiveDrop && (
                    <div className="w-full text-center pb-2 border-b border-amber-900/50">
                      {peerStatus === 'waiting' && <p className="text-amber-500 animate-pulse font-medium">📡 Listening for receiver... Do not close tab!</p>}
                      
                      {/* --- FIXED: Visual Progress Bar Added Here --- */}
                      {peerStatus === 'transferring' && (
                        <div className="w-full mt-2 space-y-2 animate-in fade-in">
                          <div className="flex justify-between text-[10px] uppercase tracking-widest text-blue-400 font-bold">
                            <span>Streaming Data</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="bg-blue-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {peerStatus === 'done' && <p className="text-green-500 font-medium">✅ Transfer complete! You can close this tab.</p>}
                    </div>
                  )}

                  <div className="text-center">
                    <span className="text-zinc-500 text-xs uppercase tracking-widest">Access Code</span>
                    <div className="text-4xl font-black text-white tracking-widest my-1 uppercase">
                      {link.split('/').pop()}
                    </div>
                  </div>

                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-zinc-400 text-xs underline truncate w-64 text-center">
                    Or share direct link
                  </a>

                  <div className="mt-2 flex flex-col items-center">
                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                      <QRCodeSVG value={link} size={150} bgColor="#09090b" fgColor="#fafafa" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}