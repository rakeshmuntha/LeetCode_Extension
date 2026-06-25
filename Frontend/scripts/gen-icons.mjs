import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, "../public/icon/icon.svg");
const svgBuffer = readFileSync(svgPath);
const sizes = [16, 32, 48, 64, 96, 128];

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(__dirname, `../public/icon/${size}.png`));
  console.log(`Generated ${size}.png`);
}
console.log("Done!");
