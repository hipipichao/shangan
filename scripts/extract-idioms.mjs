import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfPath = join(__dirname, "..", "data", "【言语】上岸村成语必看1800条.pdf");
const outputPath = join(__dirname, "..", "data", "idioms-raw.txt");

const loadingTask = pdfjsLib.getDocument({
  url: pdfPath,
  useWorkerFetch: false,
  isEvalSupported: false,
  useSystemFonts: true,
});

const pdf = await loadingTask.promise;

console.log(`PDF loaded. Total pages: ${pdf.numPages}`);

let fullText = "";

for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const textContent = await page.getTextContent();
  const pageText = textContent.items
    .map((item) => ("str" in item ? item.str : ""))
    .join("");
  fullText += `\n=== PAGE ${i} ===\n` + pageText + "\n";
  if (i % 10 === 0) {
    console.log(`Processed ${i}/${pdf.numPages} pages...`);
  }
}

writeFileSync(outputPath, fullText, "utf-8");
console.log(`\nDone! Raw text saved to: ${outputPath}`);
console.log(`Total characters: ${fullText.length}`);