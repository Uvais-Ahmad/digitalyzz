import { type NextRequest, NextResponse } from "next/server"
import { AIClient } from "@/lib/ai-client"

export async function POST(request: NextRequest) {
  try {
    const { action, ruleText, clients, workers, tasks } = await request.json()

    const aiClient = new AIClient()

    if (action === "convert" && ruleText) {
      const rule = await aiClient.convertTextToRule(ruleText, {
        clients: clients || [],
        workers: workers || [],
        tasks: tasks || [],
      })
      return NextResponse.json({ rule })
    }

    if (action === "recommend") {
      const recommendations = await aiClient.recommendRules(clients || [], workers || [], tasks || [])
      return NextResponse.json({ recommendations })
    }

    return NextResponse.json({ error: "Invalid action or missing parameters" }, { status: 400 })
  } catch (error) {
    console.error("AI rules error:", error)
    return NextResponse.json({ error: "AI rules processing failed" }, { status: 500 })
  }
}
