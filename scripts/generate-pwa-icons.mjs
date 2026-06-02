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
  <rect width="512" height="512" rx="112" fill="#ffffff"/>
  <path
    d="M256 88C256 88 360 192 360 282C360 355.9 306 416 256 416C206 416 152 355.9 152 282C152 192 256 88 256 88Z"
    fill="none"
    stroke="#0d9488"
    stroke-width="34"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
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
