import { type NextRequest, NextResponse } from "next/server"
import { DataValidator } from "@/lib/validators"
import type { EntityType } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { entityType, data, allData } = await request.json()

    if (!entityType || !data) {
      return NextResponse.json({ errors: ["Missing entityType or data"] }, { status: 400 })
    }

    const validator = new DataValidator()
    let errors: any[] = []

    if (allData && allData.clients && allData.workers && allData.tasks) {
      // Comprehensive validation with all data
      errors = validator.validateAll(allData.clients, allData.workers, allData.tasks)
    } else {
      // Single entity validation
      switch (entityType as EntityType) {
        case "clients":
          errors = validator.validateClients(data)
          break
        case "workers":
          errors = validator.validateWorkers(data)
          break
        case "tasks":
          errors = validator.validateTasks(data)
          break
        default:
          return NextResponse.json({ errors: ["Invalid entity type"] }, { status: 400 })
      }
    }

    return NextResponse.json({ errors })
  } catch (error) {
    console.error("Validation error:", error)
    return NextResponse.json({ errors: ["Validation failed"] }, { status: 500 })
  }
}
