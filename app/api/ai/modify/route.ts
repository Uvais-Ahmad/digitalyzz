import { type NextRequest, NextResponse } from "next/server"
import { AIClient } from "@/lib/ai-client"

export async function POST(request: NextRequest) {
  try {
    const { command, data } = await request.json()

    if (!command) {
      return NextResponse.json({ error: "Command is required" }, { status: 400 })
    }

    const aiClient = new AIClient()
    const suggestions = await aiClient.generateModificationSuggestions(command, data)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("AI modification error:", error)
    return NextResponse.json({ error: "AI modification failed" }, { status: 500 })
  }
}
