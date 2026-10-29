import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { createIdiomPdfDoc, type PdfIdiomItem } from "../src/lib/idiom-pdf";
import { prisma } from "../src/lib/db/prisma";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const outputDir = path.join(projectRoot, "public");
const outputPath = path.join(outputDir, "idiom-frequency.pdf");

fs.mkdirSync(outputDir, { recursive: true });

async function main() {
  const frequencies = await prisma.idiomFrequency.findMany({
    orderBy: { count: "desc" },
    include: { idiom: true },
  });

  const idioms: PdfIdiomItem[] = frequencies.map((f) => ({
    word: f.idiom.word,
    pinyin: f.idiom.pinyin,
    explanation: f.idiom.explanation ?? undefined,
    similar: f.idiom.similar ? f.idiom.similar.split(/[,，、\s]+/).filter(Boolean) : undefined,
    opposite: f.idiom.opposite ? f.idiom.opposite.split(/[,，、\s]+/).filter(Boolean) : undefined,
    count: f.count,
  }));

  const doc = createIdiomPdfDoc(idioms);
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  stream.on("finish", () => {
    const size = (fs.statSync(outputPath).size / 1024).toFixed(1);
    console.log(`PDF generated: ${outputPath}`);
    console.log(`Size: ${size} KB`);
    process.exit(0);
  });

  stream.on("error", (err) => {
    console.error("Failed to write PDF:", err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("Failed to generate PDF:", err);
  process.exit(1);
});