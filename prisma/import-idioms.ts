import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

interface IdiomRaw {
  word: string;
  pinyin: string;
  abbr: string;
  explanation?: string;
  similar?: string[];
  opposite?: string[];
  usage?: string;
}

function toText(arr?: string[]): string | null {
  if (!arr || arr.length === 0) return null;
  return arr.join("、");
}

async function main() {
  const jsonPath = path.join(process.cwd(), "data", "idiom.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data: IdiomRaw[] = JSON.parse(raw);

  console.log(`Total idioms in file: ${data.length}`);

  const BATCH = 1000;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < data.length; i += BATCH) {
    const chunk = data.slice(i, i + BATCH);
    const records = chunk.map((x) => ({
      word: x.word,
      pinyin: x.pinyin,
      abbr: x.abbr,
      explanation: x.explanation ?? null,
      similar: toText(x.similar),
      opposite: toText(x.opposite),
      usage: x.usage ?? null,
    }));

    const result = await prisma.idiom.createMany({
      data: records,
      skipDuplicates: true,
    });

    inserted += result.count;
    skipped += records.length - result.count;

    console.log(
      `  Batch ${Math.floor(i / BATCH) + 1}: inserted ${result.count}, skipped ${records.length - result.count}`
    );
  }

  const total = await prisma.idiom.count();
  console.log(`\nDone. inserted=${inserted}, skipped=${skipped}, total in db=${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });