import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { safeFilename } from "./utils";

export type FileInput = {
  filename: string;
  mimeType: string;
  base64: string; // base64 without "data:mime;base64,"
};

export function decodeBase64(base64: string): Buffer {
  return Buffer.from(base64, "base64");
}

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function saveFileToDisk(params: {
  uploadRoot: string;
  subdir: string; // e.g. caseId
  file: FileInput;
  maxBytes: number;
}) {
  const { uploadRoot, subdir, file, maxBytes } = params;
  const buffer = decodeBase64(file.base64);

  if (buffer.byteLength > maxBytes) {
    throw new Error("FILE_TOO_LARGE");
  }

  const dir = path.join(uploadRoot, subdir);
  ensureDir(dir);

  const outName = `${uuid()}_${safeFilename(file.filename)}`;
  const outPath = path.join(dir, outName);
  fs.writeFileSync(outPath, buffer);

  return { path: outPath, sizeBytes: buffer.byteLength, filename: file.filename, mimeType: file.mimeType };
}
