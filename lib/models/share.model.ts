// export interface Share {
//   _id: string;          // The short code (e.g., "A1B2C3")
//   text?: string;        // Made optional (?) because a user might share ONLY a file
//   fileUrl?: string;     // The link to the file stored in Vercel Blob
//   fileName?: string;    // The original name of the file (e.g., "image.png")
//   fileSize?: number;    // The size of the file in bytes
//   oneTime: boolean;
//   createdAt: Date;
//   expiresAt: Date;
// }

export interface Share {
  _id: string;
  text?: string;
  fileUrl?: string;     // Used for Vercel Blob
  peerId?: string;      // NEW: Used for Live Drop (P2P)
  fileName?: string;
  fileSize?: number;
  shareType: 'cloud' | 'p2p'; // NEW: Identifies the protocol
  oneTime: boolean;
  createdAt: Date;
  expiresAt: Date;
}