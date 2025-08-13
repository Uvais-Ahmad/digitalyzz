import { type NextRequest, NextResponse } from "next/server"
import { AIClient } from "@/lib/ai-client"

export async function POST(request: NextRequest) {
  try {
    const { errors } = await request.json()

    if (!errors || !Array.isArray(errors)) {
      return NextResponse.json({ error: "Errors array is required" }, { status: 400 })
    }

    const aiClient = new AIClient()
    const corrections = await aiClient.generateErrorCorrections(errors)

    return NextResponse.json({ corrections })
  } catch (error) {
    console.error("AI correction error:", error)
    return NextResponse.json({ error: "AI correction failed" }, { status: 500 })
  }
}
