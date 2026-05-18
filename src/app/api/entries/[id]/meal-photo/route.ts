import { NextRequest, NextResponse } from "next/server"
import { getSessionUserId } from "@/lib/auth-session"
import { uploadMealPhoto, verifyMealEntryOwner } from "@/lib/meal-photo-storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = 4 * 1024 * 1024

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ code: "unauthorized" }, { status: 401 })
    }

    const entryId = params.id
    if (!entryId) {
      return NextResponse.json({ code: "missing_id" }, { status: 400 })
    }

    const owns = await verifyMealEntryOwner(userId, entryId)
    if (!owns) {
      return NextResponse.json({ code: "not_found" }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("image")
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ code: "no_image" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ code: "invalid_image" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ code: "image_too_large" }, { status: 400 })
    }

    const photoUrl = await uploadMealPhoto(
      userId,
      entryId,
      buffer,
      file.type || "image/jpeg"
    )

    return NextResponse.json({ photoUrl })
  } catch (error) {
    console.error("[api/entries/meal-photo] Error:", error)
    return NextResponse.json({ code: "upload_failed" }, { status: 500 })
  }
}
