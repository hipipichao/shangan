import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, "../public/icon.svg");
const svgBuffer = readFileSync(svgPath);

const sizes = [192, 384, 512];

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(__dirname, `../public/icon-${size}.png`));
  console.log(`生成 icon-${size}.png`);
}

for (const size of sizes) {
  const padding = Math.round(size * 0.1);
  await sharp(svgBuffer)
    .resize(size - padding * 2, size - padding * 2)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 59, g: 91, b: 219, alpha: 1 },
    })
    .png()
    .toFile(join(__dirname, `../public/icon-maskable-${size}.png`));
  console.log(`生成 icon-maskable-${size}.png`);
}

console.log("全部图标生成完成！");