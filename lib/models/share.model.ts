export interface Share {
  _id: string;
  text?: string;
  fileUrl?: string;     // Used for Vercel Blob
  peerId?: string;      // Used for Live Drop (P2P)
  fileName?: string;
  fileSize?: number;
  shareType: 'cloud' | 'p2p'; // Identifies the protocol
  oneTime: boolean;
  createdAt: Date;
  expiresAt: Date;
}