import clientPromise from "@/lib/db";
import { Share } from "./share.model";

const DB_NAME = "fasttext";
const COLLECTION = "shares";

export async function createShare(data: Share) {
  const db = (await clientPromise).db(DB_NAME);
  return db.collection<Share>(COLLECTION).insertOne(data);
}

export async function findShare(id: string) {
  const db = (await clientPromise).db(DB_NAME);
  return db.collection<Share>(COLLECTION).findOne({ _id: id });
}

export async function deleteShare(id: string) {
  const db = (await clientPromise).db(DB_NAME);
  return db.collection<Share>(COLLECTION).deleteOne({ _id: id });
}