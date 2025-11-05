import fs from "fs";

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = "./icons/icon.svg";

console.log("Generating PNG icons from SVG...");

// Check if sharp is available, if not provide instructions
try {
  const sharp = await import("sharp");
  const svgBuffer = fs.readFileSync(inputSvg);

  for (const size of sizes) {
    const outputPath = `./icons/icon-${size}x${size}.png`;
    await sharp.default(svgBuffer).resize(size, size).png().toFile(outputPath);
    console.log(`Generated: ${outputPath}`);
  }

  // Generate favicon
  await sharp.default(svgBuffer).resize(32, 32).png().toFile("./favicon.png");
  console.log("Generated: favicon.png");

  console.log("\nAll icons generated successfully!");
} catch (error) {
  console.error("\nError: sharp package not found.");
  console.log("\nTo generate icons, run:");
  console.log("  npm install --save-dev sharp");
  console.log("  node generate-icons.js");
  console.log("\nAlternatively, you can:");
  console.log("1. Open icons/icon.svg in a browser or design tool");
  console.log("2. Export as PNG at the following sizes:");
  sizes.forEach((size) =>
    console.log(`   - ${size}x${size} as icon-${size}x${size}.png`)
  );
  console.log("   - 32x32 as favicon.png (in root directory)");
  process.exit(1);
}
