import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rawPath = join(__dirname, "..", "data", "idioms-raw.txt");
const outputPath = join(__dirname, "..", "src", "data", "idioms.json");

let text = readFileSync(rawPath, "utf-8");

// Remove page markers
text = text.replace(/=== PAGE \d+ ===/g, "\n");

const idioms = [];
const seen = new Set();

function addIdiom(entry) {
  const word = entry.word.trim();
  if (!word || word.length < 2) return;
  if (seen.has(word)) {
    // Merge: keep richer explanation
    const existing = idioms.find((i) => i.word === word);
    if (existing) {
      if (entry.explanation && entry.explanation.length > existing.explanation.length) {
        existing.explanation = entry.explanation;
      }
      if (entry.misuse && !existing.misuse) existing.misuse = entry.misuse;
      if (entry.collocation && !existing.collocation) existing.collocation = entry.collocation;
      if (entry.pinyin && !existing.pinyin) existing.pinyin = entry.pinyin;
    }
    return;
  }
  seen.add(word);
  idioms.push(entry);
}

// ============================================================
// Section 1: 易错成语分类识记
// ============================================================

// Helper to parse entries within a category
// Format variants:
//   N.成语【解释】...【误用】...
//   N.成语：解释
//   N.成语：解释【搭配对象】...
function parseCategorySection(
  sectionText,
  category,
  opts = {}
) {
  // Split by numbered entries: N. (number followed by dot)
  // The idiom comes right after the number
  const entryRegex = /(\d+)\.([^0-9\d])/g;
  const entries = [];
  let m;
  while ((m = entryRegex.exec(sectionText)) !== null) {
    entries.push({ start: m.index, num: parseInt(m[1]) });
  }

  for (let i = 0; i < entries.length; i++) {
    const start = entries[i].start;
    const end = i + 1 < entries.length ? entries[i + 1].start : sectionText.length;
    let entry = sectionText.slice(start, end);

    // Remove leading "N."
    entry = entry.replace(/^\d+\./, "").trim();
    if (!entry) continue;

    // Extract the idiom word: up to the first 【 or ： or ，(comma within idiom allowed)
    // Idioms are typically 3-8 Chinese chars, may contain comma like "百尺竿头，更进一步"
    let word = "";
    let rest = "";

    // Find first delimiter: 【 or ：
    const bracketIdx = entry.indexOf("【");
    const colonIdx = entry.indexOf("：");
    const colonIdx2 = entry.indexOf(":");
    const delimiters = [bracketIdx, colonIdx, colonIdx2].filter((x) => x >= 0);
    const firstDelim = delimiters.length > 0 ? Math.min(...delimiters) : -1;

    if (firstDelim > 0) {
      word = entry.slice(0, firstDelim).trim();
      rest = entry.slice(firstDelim).trim();
    } else {
      // No delimiter found - skip or take whole thing
      continue;
    }

    // Clean up word - remove trailing stray characters
    word = word.replace(/[：:】\s]+$/, "").trim();
    // Remove leading numbers that might be page numbers
    word = word.replace(/^\d+/, "").trim();

    if (!word || word.length < 2) continue;

    let explanation = "";
    let misuse = "";
    let collocation = "";

    if (opts.hasMisuse) {
      // Parse 【解释】...【误用】...
      const expMatch = rest.match(/【解释】([\s\S]*?)(?=【误用】|$)/);
      const misuseMatch = rest.match(/【误用】([\s\S]*)$/);
      explanation = expMatch ? expMatch[1].trim() : rest;
      misuse = misuseMatch ? misuseMatch[1].trim() : "";
    } else if (opts.hasCollocation) {
      // Parse ：解释【搭配对象】...
      const expMatch = rest.match(/^[：:]([\s\S]*?)(?=【搭配对象】|$)/);
      const collMatch = rest.match(/【搭配对象】([\s\S]*)$/);
      explanation = expMatch ? expMatch[1].trim() : rest.replace(/^[：:]/, "");
      collocation = collMatch ? collMatch[1].trim() : "";
    } else {
      // Simple: ：解释
      explanation = rest.replace(/^[：:]/, "").trim();
    }

    // Clean explanation - remove trailing page numbers and stray content
    explanation = explanation.replace(/\s+/g, " ").trim();
    if (misuse) misuse = misuse.replace(/\s+/g, " ").trim();
    if (collocation) collocation = collocation.replace(/\s+/g, " ").trim();

    addIdiom({ word, explanation, category, misuse, collocation });
  }
}

// Extract section 1 text (before "近义成语辨析识记")
// The TOC contains section names too, so find the actual content section
// which starts with "易错成语分类识记" after the TOC
function findLastIndex(str, substr) {
  let idx = -1;
  let pos = 0;
  while (true) {
    const found = str.indexOf(substr, pos);
    if (found === -1) break;
    idx = found;
    pos = found + 1;
  }
  return idx;
}

// The actual section 1 content starts after TOC. Find "易错成语分类识记"
// that is followed by "一、" (the first sub-section)
const section1HeaderIdx = (() => {
  let pos = 0;
  while (true) {
    const found = text.indexOf("易错成语分类识记", pos);
    if (found === -1) return -1;
    // Check if this is the content section (followed by 一、 within reasonable distance)
    const after = text.slice(found, found + 100);
    if (after.includes("一、")) return found;
    pos = found + 1;
  }
})();

const section2Start = findLastIndex(text, "近义成语辨析识记");
const section3Start = findLastIndex(text, "常考成语无差别识记");
const section1 = section1HeaderIdx >= 0
  ? text.slice(section1HeaderIdx, section2Start > section1HeaderIdx ? section2Start : text.length)
  : text.slice(0, section2Start > 0 ? section2Start : text.length);

// Sub-sections within section 1
const sectionMarkers = [
  { name: "人民日报最易错成语", regex: /一、人民日报评出最易错的成语/, opts: { hasMisuse: true } },
  { name: "易望文生义的成语", regex: /二、[望易]?文生义的成语/, opts: {} },
  { name: "易用错对象的成语", regex: /三、易用错对象的成语/, opts: { hasCollocation: true } },
  { name: "易褒贬误用的成语", regex: /四、易褒贬误用的成语/, opts: {} },
  { name: "易语意重复的成语", regex: /五、易语意重复的成语/, opts: {} },
  { name: "易错谦辞敬辞成语", regex: /六、易错谦辞敬辞成语/, opts: {} },
];

for (const marker of sectionMarkers) {
  const match = section1.match(marker.regex);
  if (!match) continue;
  const startIdx = match.index + match[0].length;
  // Find the next section marker
  let endIdx = section1.length;
  for (const other of sectionMarkers) {
    if (other.name === marker.name) continue;
    const otherMatch = section1.match(other.regex);
    if (otherMatch && otherMatch.index > startIdx && otherMatch.index < endIdx) {
      endIdx = otherMatch.index;
    }
  }
  const subText = section1.slice(startIdx, endIdx);
  parseCategorySection(subText, marker.name, marker.opts);
}

console.log(`After section 1: ${idioms.length} idioms`);

// ============================================================
// Section 2: 近义成语辨析识记 (307 groups)
// Format: N.【成语1】解释【成语2】解释...
// ============================================================
const section2 = section2Start >= 0
  ? text.slice(section2Start, section3Start > section2Start ? section3Start : text.length)
  : "";

if (section2) {
  // Split by numbered groups
  const groupRegex = /(\d+)\.【/g;
  const groups = [];
  let gm;
  while ((gm = groupRegex.exec(section2)) !== null) {
    groups.push({ start: gm.index, num: parseInt(gm[1]) });
  }

  for (let i = 0; i < groups.length; i++) {
    const start = groups[i].start;
    const end = i + 1 < groups.length ? groups[i + 1].start : section2.length;
    let group = section2.slice(start, end).replace(/^\d+\./, "").trim();

    // Parse 【成语】解释 pairs
    const pairRegex = /【([^】]+)】([\s\S]*?)(?=【|$)/g;
    let pm;
    while ((pm = pairRegex.exec(group)) !== null) {
      const word = pm[1].trim();
      const explanation = pm[2].replace(/\s+/g, " ").trim();
      if (word && word.length >= 2 && explanation) {
        addIdiom({ word, explanation, category: "近义成语辨析" });
      }
    }
  }
}

console.log(`After section 2: ${idioms.length} idioms`);

// ============================================================
// Section 3: 常考成语无差别识记 (by pinyin initial)
// Format: N.成语：解释
// ============================================================
const section3 = section3Start >= 0 ? text.slice(section3Start) : "";

if (section3) {
  // Track current pinyin letter (A, B, C, ...)
  // The letter appears as a standalone capital letter before entries
  const letterRegex = /(?:^|\s)([A-Z])(?=\d+\.)/g;

  // First, find all letter positions
  const letters = [];
  let lm;
  while ((lm = letterRegex.exec(section3)) !== null) {
    letters.push({ pos: lm.index + (lm[0].startsWith(" ") ? 1 : 0), letter: lm[1] });
  }

  // Parse entries: N.成语：解释
  const entryRegex = /(\d+)\./g;
  const entries = [];
  let em;
  while ((em = entryRegex.exec(section3)) !== null) {
    entries.push({ start: em.index, num: parseInt(em[1]) });
  }

  for (let i = 0; i < entries.length; i++) {
    const start = entries[i].start;
    const end = i + 1 < entries.length ? entries[i + 1].start : section3.length;
    let entry = section3.slice(start, end).replace(/^\d+\./, "").trim();
    if (!entry) continue;

    // Determine pinyin letter for this entry
    let pinyin = "";
    for (let j = letters.length - 1; j >= 0; j--) {
      if (letters[j].pos < start) {
        pinyin = letters[j].letter;
        break;
      }
    }

    // Extract idiom: up to first ：or :
    const colonIdx = entry.search(/[：:]/);
    if (colonIdx <= 0) continue;

    const word = entry.slice(0, colonIdx).trim();
    const explanation = entry.slice(colonIdx + 1).replace(/\s+/g, " ").trim();

    if (!word || word.length < 2 || !explanation) continue;

    addIdiom({ word, explanation, category: "常考成语", pinyin });
  }
}

console.log(`After section 3: ${idioms.length} idioms`);

// Sort by word for consistency
idioms.sort((a, b) => a.word.localeCompare(b.word, "zh"));

// Write output
const output = JSON.stringify(idioms, null, 2);
writeFileSync(outputPath, output, "utf-8");
console.log(`\nTotal idioms extracted: ${idioms.length}`);
console.log(`Saved to: ${outputPath}`);

// Print some stats
const categories = new Map();
idioms.forEach((i) => {
  categories.set(i.category, (categories.get(i.category) || 0) + 1);
});
console.log("\nCategory breakdown:");
categories.forEach((count, cat) => {
  console.log(`  ${cat}: ${count}`);
});