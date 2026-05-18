/**
 * Generates PWA icons (192 + 512) from a simple SVG mark.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const iconsDir = path.join(root, "public", "icons")

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0d9488"/>
  <path fill="#ffffff" d="M256 96c-61.9 0-112 50.1-112 112 0 88.4 112 208 112 208s112-119.6 112-208c0-61.9-50.1-112-112-112zm0 152a40 40 0 1 1 0-80 40 40 0 0 1 0 80z"/>
</svg>`

await mkdir(iconsDir, { recursive: true })
const buffer = Buffer.from(svg)

for (const size of [192, 512]) {
  await sharp(buffer).resize(size, size).png().toFile(path.join(iconsDir, `icon-${size}.png`))
}

await writeFile(
  path.join(iconsDir, "icon.svg"),
  svg,
  "utf8"
)

console.log("Wrote public/icons/icon-192.png, icon-512.png, icon.svg")
