import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const xlsxPath = path.join(projectRoot, "data", "公考十年各地区词频.xlsx");
const idiomJsonPath = path.join(projectRoot, "data", "idiom.json");
const outputPath = path.join(projectRoot, "src", "data", "idiom-frequency.json");

const wb = XLSX.readFile(xlsxPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

const idiomJson = JSON.parse(fs.readFileSync(idiomJsonPath, "utf-8"));
const idiomMap = new Map();
idiomJson.forEach((i) => idiomMap.set(i.word, i));

const result = [];
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  const word = String(row[0] ?? "").trim();
  const count = Number(row[1]) || 0;
  const xlsxMeaning = String(row[2] ?? "").trim();
  if (!word) continue;

  const detail = idiomMap.get(word);
  const entry = {
    word,
    count,
    xlsxMeaning,
  };
  if (detail) {
    if (detail.pinyin) entry.pinyin = detail.pinyin;
    if (detail.explanation) entry.explanation = detail.explanation;
    if (detail.source?.text) entry.sourceText = detail.source.text;
    if (detail.source?.book) entry.sourceBook = detail.source.book;
    if (detail.example?.text) entry.example = detail.example.text;
    if (Array.isArray(detail.similar) && detail.similar.length > 0)
      entry.similar = detail.similar;
    if (Array.isArray(detail.opposite) && detail.opposite.length > 0)
      entry.opposite = detail.opposite;
    if (detail.usage) entry.usage = detail.usage;
  }
  result.push(entry);
}

result.sort((a, b) => b.count - a.count);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");

console.log(`Total idioms: ${result.length}`);
console.log(`Saved to: ${outputPath}`);
console.log("\nTop 5:");
result.slice(0, 5).forEach((i) =>
  console.log(`  ${i.word} (${i.count}): ${i.explanation?.slice(0, 30)}...`)
);