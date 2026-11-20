import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { StoredDocument } from "./types";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const MIME_EXT = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
} as const;

export type UploadMime = keyof typeof MIME_EXT;
export type PrivateFolder = "home-care" | "careers";

const SAFE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,120}$/;

export function isSafeStoredName(name: string) {
  return SAFE_NAME.test(name) && !name.includes("..");
}

export function safeDownloadName(name: string) {
  const base = name.replace(/[/\\]/g, "").replace(/[^\w.\- ()]/g, "").slice(0, 80);
  return base || "document";
}

function dataRoot(folder: PrivateFolder) {
  return path.join(process.cwd(), ".data", "private-uploads", folder);
}

function tmpRoot(folder: PrivateFolder) {
  return path.join(os.tmpdir(), "rc-private-uploads", folder);
}

function sniff(bytes: Buffer, mime: UploadMime) {
  if (bytes.length < 4) return false;
  if (mime === "application/pdf") return bytes.subarray(0, 4).toString("utf8") === "%PDF";
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return bytes[0] === 0x50 && bytes[1] === 0x4b;
  }
  if (mime === "application/msword") return bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  return false;
}

export function inspectUpload(
  dataUrl: string,
  originalName: string,
): { ok: true; mime: UploadMime; ext: string; buffer: Buffer; size: number } | { ok: false; error: string } {
  const match = /^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=\s]+)$/.exec(dataUrl || "");
  if (!match) return { ok: false, error: "Upload a PDF, JPG, PNG, DOC, or DOCX file." };
  const mime = match[1].toLowerCase() as UploadMime;
  if (!MIME_EXT[mime]) return { ok: false, error: "Only PDF, JPG, PNG, DOC, and DOCX files are allowed." };
  let buffer: Buffer;
  try {
    buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  } catch {
    return { ok: false, error: "The uploaded file could not be read." };
  }
  if (!buffer.length) return { ok: false, error: "The uploaded file is empty." };
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `${safeDownloadName(originalName)} must be 2 MB or smaller.` };
  }
  if (!sniff(buffer, mime)) {
    return { ok: false, error: "The file contents do not match the declared file type." };
  }
  return { ok: true, mime, ext: MIME_EXT[mime], buffer, size: buffer.length };
}

export async function collectPrivateUploads(
  folder: PrivateFolder,
  files: { label: string; name: string; dataUrl: string }[],
) {
  const documents: StoredDocument[] = [];
  for (const file of files) {
    const inspected = inspectUpload(file.dataUrl, file.name);
    if (!inspected.ok) {
      await Promise.all(documents.map((doc) => deletePrivateUpload(folder, doc)));
      return { ok: false as const, error: inspected.error };
    }
    try {
      documents.push(await savePrivateUpload(folder, file.label, file.name, inspected));
    } catch {
      await Promise.all(documents.map((doc) => deletePrivateUpload(folder, doc)));
      return { ok: false as const, error: "Could not store the uploaded file." };
    }
  }
  return { ok: true as const, documents };
}

export async function savePrivateUpload(
  folder: PrivateFolder,
  label: string,
  originalName: string,
  file: { mime: string; ext: string; buffer: Buffer; size: number },
): Promise<StoredDocument> {
  const storedName = `${randomUUID()}.${file.ext}`;
  if (!isSafeStoredName(storedName)) throw new Error("Could not store the file.");
  const docBase = {
    id: `doc-${randomUUID()}`,
    label,
    originalName: safeDownloadName(originalName),
    storedName,
    mime: file.mime,
    size: file.size,
  };
  try {
    const dir = dataRoot(folder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, storedName), file.buffer);
    return { ...docBase, storage: "data" };
  } catch {
    const dir = tmpRoot(folder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, storedName), file.buffer);
    return { ...docBase, storage: "tmp" };
  }
}

export async function deletePrivateUpload(folder: PrivateFolder, doc: StoredDocument) {
  if (!isSafeStoredName(doc.storedName)) return;
  const root = doc.storage === "tmp" ? tmpRoot(folder) : dataRoot(folder);
  await fs.unlink(path.join(root, doc.storedName)).catch(() => {});
}

export async function readPrivateUpload(folder: PrivateFolder, doc: StoredDocument) {
  if (!isSafeStoredName(doc.storedName)) throw new Error("Invalid file");
  const root = path.resolve(doc.storage === "tmp" ? tmpRoot(folder) : dataRoot(folder));
  const full = path.resolve(root, doc.storedName);
  if (!full.startsWith(root + path.sep)) throw new Error("Invalid file");
  return fs.readFile(full);
}
