
**
 * Resizes the buddy hero image for mobile (was ~8.6 MB @ 3691×3691).
 * Outputs WebP variants + a compact PNG fallback.
 * Run: node scripts/optimize-buddy-image.mjs
 */
import sharp from "sharp"
import path from "path"
import { fileURLToPath } from "node:url"
import { stat } from "node:fs/promises"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, "../public")
const source = path.join(publicDir, "TherapistRobot4.png")

const variants = [
  { name: "TherapistRobot4-400.webp", width: 400, quality: 82 },
  { name: "TherapistRobot4.webp", width: 800, quality: 84 },
]

for (const v of variants) {
  const out = path.join(publicDir, v.name)
  const pipeline = sharp(source)
    .resize(v.width, v.width, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: v.quality, effort: 4 })

  await pipeline.toFile(out)
  const { size } = await stat(out)
  console.log(`${v.name}: ${(size / 1024).toFixed(1)} KB`)
}

console.log("Done. Update buddy-home-hero to use WebP + srcSet.")
