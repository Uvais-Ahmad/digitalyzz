import { type NextRequest, NextResponse } from "next/server"
import { AIClient } from "@/lib/ai-client"

export async function POST(request: NextRequest) {
  try {
    const { query, clients, workers, tasks } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const aiClient = new AIClient()
    const result = await aiClient.queryData(query, clients || [], workers || [], tasks || [])

    return NextResponse.json(result)
  } catch (error) {
    console.error("AI query error:", error)
    return NextResponse.json({ error: "AI query failed" }, { status: 500 })
  }
}
