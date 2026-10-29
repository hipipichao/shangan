import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

interface FreqItem {
  word: string;
  count: number;
}

async function main() {
  const jsonPath = path.join(process.cwd(), "src", "data", "idiom-frequency.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data: FreqItem[] = JSON.parse(raw);

  console.log(`Total items in file: ${data.length}`);

  // 查询所有 idioms 的 word -> id 映射
  const allIdioms = await prisma.idiom.findMany({
    select: { id: true, word: true },
  });
  const wordToId = new Map(allIdioms.map((x) => [x.word, x.id]));
  console.log(`Loaded ${wordToId.size} idioms from db`);

  const BATCH = 500;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < data.length; i += BATCH) {
    const chunk = data.slice(i, i + BATCH);
    const records: { idiomId: string; count: number }[] = [];

    for (const x of chunk) {
      const idiomId = wordToId.get(x.word);
      if (idiomId) {
        records.push({ idiomId, count: x.count });
      } else {
        skipped++;
        console.warn(`  word not found in idioms: ${x.word}`);
      }
    }

    const result = await prisma.idiomFrequency.createMany({
      data: records,
      skipDuplicates: true,
    });

    inserted += result.count;
    skipped += records.length - result.count;

    console.log(
      `  Batch ${Math.floor(i / BATCH) + 1}: inserted ${result.count}`
    );
  }

  const total = await prisma.idiomFrequency.count();
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