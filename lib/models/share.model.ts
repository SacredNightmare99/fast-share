export interface Share {
  _id: string;          // short code
  text: string;
  oneTime: boolean;
  createdAt: Date;
  expiresAt: Date;
}