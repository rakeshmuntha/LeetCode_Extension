import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sizes = [16, 32, 48, 64, 96, 128];

// icon1 folder
const svgBuffer1 = readFileSync(join(__dirname, "../public/icon1/icon.svg"));
for (const size of sizes) {
  await sharp(svgBuffer1).resize(size, size).png().toFile(join(__dirname, `../public/icon1/${size}.png`));
  console.log(`icon1: Generated ${size}.png`);
}

// icon2 folder
const svgBuffer2 = readFileSync(join(__dirname, "../public/icon2/icon2.svg"));
for (const size of sizes) {
  await sharp(svgBuffer2).resize(size, size).png().toFile(join(__dirname, `../public/icon2/${size}.png`));
  console.log(`icon2: Generated ${size}.png`);
}

// icon3 folder
const svgBuffer3 = readFileSync(join(__dirname, "../public/icon3/icon3.svg"));
for (const size of sizes) {
  await sharp(svgBuffer3).resize(size, size).png().toFile(join(__dirname, `../public/icon3/${size}.png`));
  console.log(`icon3: Generated ${size}.png`);
}

// icon4 folder
const svgBuffer4 = readFileSync(join(__dirname, "../public/icon4/icon4.svg"));
for (const size of sizes) {
  await sharp(svgBuffer4).resize(size, size).png().toFile(join(__dirname, `../public/icon4/${size}.png`));
  console.log(`icon4: Generated ${size}.png`);
}

// icon5 folder
const svgBuffer5 = readFileSync(join(__dirname, "../public/icon5/icon5.svg"));
for (const size of sizes) {
  await sharp(svgBuffer5).resize(size, size).png().toFile(join(__dirname, `../public/icon5/${size}.png`));
  console.log(`icon5: Generated ${size}.png`);
}

// icon6 folder
const svgBuffer6 = readFileSync(join(__dirname, "../public/icon6/icon6.svg"));
for (const size of sizes) {
  await sharp(svgBuffer6).resize(size, size).png().toFile(join(__dirname, `../public/icon6/${size}.png`));
  console.log(`icon6: Generated ${size}.png`);
}

// icon7 folder
const svgBuffer7 = readFileSync(join(__dirname, "../public/icon7/icon7.svg"));
for (const size of sizes) {
  await sharp(svgBuffer7).resize(size, size).png().toFile(join(__dirname, `../public/icon7/${size}.png`));
  console.log(`icon7: Generated ${size}.png`);
}

console.log("Done!");
