import imageCompression from "browser-image-compression"

const OPTIONS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
  initialQuality: 0.8,
}

/** Client-side resize before upload — max 1024px, JPEG ~0.8 quality. */
export async function compressMealImage(file: File): Promise<File> {
  const compressed = await imageCompression(file, OPTIONS)
  const name = file.name.replace(/\.[^.]+$/, "") || "meal"
  return new File([compressed], `${name}.jpg`, { type: "image/jpeg", lastModified: Date.now() })
}
