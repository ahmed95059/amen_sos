import fs from "fs";
import path from "path";
import { PDFDocument, PDFImage } from "pdf-lib";
import { v4 as uuid } from "uuid";
import { safeFilename } from "./utils";

const PDF_MIME = "application/pdf";

function mmToPt(mm: number) {
  return (mm * 72.0) / 25.4;
}

function isPdfFile(params: { mimeType?: string | null; filename?: string | null }) {
  const mime = (params.mimeType || "").toLowerCase();
  const name = (params.filename || "").toLowerCase();
  return mime === PDF_MIME || name.endsWith(".pdf");
}

async function embedSignatureImage(pdfDoc: PDFDocument, signatureBuffer: Buffer, signatureFilename: string, signatureMimeType: string) {
  const mime = (signatureMimeType || "").toLowerCase();
  const lowerName = (signatureFilename || "").toLowerCase();

  if (mime === "image/png" || lowerName.endsWith(".png")) {
    return pdfDoc.embedPng(signatureBuffer);
  }

  if (mime === "image/jpeg" || mime === "image/jpg" || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return pdfDoc.embedJpg(signatureBuffer);
  }

  if (mime.startsWith("image/")) {
    try {
      return await pdfDoc.embedPng(signatureBuffer);
    } catch {
      try {
        return await pdfDoc.embedJpg(signatureBuffer);
      } catch {
        throw new Error("SIGNATURE_IMAGE_UNSUPPORTED");
      }
    }
  }

  throw new Error("SIGNATURE_IMAGE_REQUIRED");
}

export type PdfDocLike = {
  id: string;
  caseId: string;
  docType: string;
  filename: string;
  mimeType: string;
  path: string;
};

export async function signCasePdfDocuments(params: {
  uploadRoot: string;
  caseId: string;
  docs: PdfDocLike[];
  signatureBuffer: Buffer;
  signatureMimeType: string;
  signatureFilename: string;
  pages?: "last" | "all";
  widthMm?: number;
  marginMm?: number;
}) {
  const {
    uploadRoot,
    caseId,
    docs,
    signatureBuffer,
    signatureMimeType,
    signatureFilename,
    pages = "last",
    widthMm = 45,
    marginMm = 12,
  } = params;

  const pdfDocs = docs.filter((d) => isPdfFile({ mimeType: d.mimeType, filename: d.filename }));
  if (pdfDocs.length !== docs.length) throw new Error("REPORTS_MUST_BE_PDF_FOR_SIGNING");

  const signedDir = path.join(uploadRoot, `cases/${caseId}/documents/signed_dir_village`);
  fs.mkdirSync(signedDir, { recursive: true });

  const signedResults: Array<{ id: string; filename: string; path: string; sizeBytes: number; mimeType: string }> = [];

  for (const doc of pdfDocs) {
    if (!fs.existsSync(doc.path)) {
      throw new Error(`REPORT_FILE_NOT_FOUND:${doc.id}`);
    }

    const inputBytes = fs.readFileSync(doc.path);
    const pdfDoc = await PDFDocument.load(inputBytes);
    const signatureImage = await embedSignatureImage(pdfDoc, signatureBuffer, signatureFilename, signatureMimeType);

    const sigW = mmToPt(widthMm);
    const margin = mmToPt(marginMm);

    const targetPages = pages === "all" ? pdfDoc.getPages() : [pdfDoc.getPages()[pdfDoc.getPageCount() - 1]];

    for (const page of targetPages) {
      if (!page) continue;
      const { width, height } = page.getSize();

      const ratio = signatureImage.height / signatureImage.width;
      const sigH = sigW * ratio;

      let x = width - margin - sigW;
      let y = margin;

      if (x < margin) x = margin;
      if (y + sigH > height - margin) y = Math.max(margin, height - margin - sigH);

      page.drawImage(signatureImage as PDFImage, {
        x,
        y,
        width: sigW,
        height: sigH,
      });
    }

    const outBytes = await pdfDoc.save();
    const sourceSafeName = safeFilename(doc.filename);
    const dotIndex = sourceSafeName.lastIndexOf(".");
    const baseName = dotIndex > 0 ? sourceSafeName.slice(0, dotIndex) : sourceSafeName;
    const signedDisplayName = `${baseName}_signed.pdf`;
    const outName = `${uuid()}_${signedDisplayName}`;
    const outPath = path.join(signedDir, outName);
    fs.writeFileSync(outPath, outBytes);

    signedResults.push({
      id: doc.id,
      filename: signedDisplayName,
      path: outPath,
      sizeBytes: outBytes.byteLength,
      mimeType: PDF_MIME,
    });
  }

  return signedResults;
}
