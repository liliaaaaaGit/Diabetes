/**
 * Makes background transparent: only black pixels connected to the image edge
 * (flood fill). Preserves black inside the robot (e.g. visor) that is enclosed by lighter pixels.
 */
import sharp from "sharp"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pngPath = path.join(__dirname, "../public/buddy-robot.png")

const { data, info } = await sharp(pngPath).raw().toBuffer({ resolveWithObject: true })

const w = info.width
const h = info.height
const channels = info.channels
if (channels !== 3) {
  console.error("Expected RGB input, got channels:", channels)
  process.exit(1)
}

const idx = (x, y) => (y * w + x) * channels
const isBg = (x, y) => {
  const i = idx(x, y)
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  return Math.max(r, g, b) < 42
}

const visited = new Uint8Array(w * h)
const q = []

for (let x = 0; x < w; x++) {
  if (isBg(x, 0)) q.push(x, 0)
  if (isBg(x, h - 1)) q.push(x, h - 1)
}
for (let y = 0; y < h; y++) {
  if (isBg(0, y)) q.push(0, y)
  if (isBg(w - 1, y)) q.push(w - 1, y)
}

while (q.length) {
  const y = q.pop()
  const x = q.pop()
  if (x < 0 || x >= w || y < 0 || y >= h) continue
  const p = y * w + x
  if (visited[p]) continue
  if (!isBg(x, y)) continue
  visited[p] = 1
  q.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
}

const out = Buffer.alloc(w * h * 4)
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const si = idx(x, y)
    const di = (y * w + x) * 4
    const bg = visited[y * w + x]
    out[di] = data[si]
    out[di + 1] = data[si + 1]
    out[di + 2] = data[si + 2]
    out[di + 3] = bg ? 0 : 255
  }
}

await sharp(out, {
  raw: { width: w, height: h, channels: 4 },
}).png().toFile(pngPath)

console.log("Wrote edge-flood transparent PNG:", pngPath)
