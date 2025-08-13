import { type NextRequest, NextResponse } from "next/server"
import { DataValidator } from "@/lib/validators"

export async function POST(request: NextRequest) {
  try {
    const { clients, workers, tasks } = await request.json()

    if (!clients || !workers || !tasks) {
      return NextResponse.json({ errors: ["Missing required data: clients, workers, or tasks"] }, { status: 400 })
    }

    const validator = new DataValidator()
    const errors = validator.validateAll(clients, workers, tasks)

    // Categorize errors by type and severity
    const errorStats = {
      total: errors.length,
      errors: errors.filter((e) => e.severity === "error").length,
      warnings: errors.filter((e) => e.severity === "warning").length,
      byEntity: {
        clients: errors.filter((e) => e.entity === "clients").length,
        workers: errors.filter((e) => e.entity === "workers").length,
        tasks: errors.filter((e) => e.entity === "tasks").length,
      },
      byType: errors.reduce(
        (acc, error) => {
          acc[error.type] = (acc[error.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    }

    return NextResponse.json({
      errors,
      stats: errorStats,
      recommendations: generateRecommendations(errors),
    })
  } catch (error) {
    console.error("Comprehensive validation error:", error)
    return NextResponse.json({ errors: ["Comprehensive validation failed"] }, { status: 500 })
  }
}

function generateRecommendations(errors: any[]): string[] {
  const recommendations: string[] = []

  const errorCounts = errors.reduce(
    (acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Generate high-level recommendations based on error patterns
  if (errorCounts["missing-field"] > 5) {
    recommendations.push("Consider reviewing your file headers and ensuring all required columns are present")
  }

  if (errorCounts["skill-shortage"] > 3) {
    recommendations.push("You may need to hire additional workers or provide skill training to meet task requirements")
  }

  if (errorCounts["phase-saturation"] > 2) {
    recommendations.push("Consider redistributing tasks across different phases to balance workload")
  }

  if (errorCounts["worker-overload"] > 2) {
    recommendations.push("Some workers may be overloaded. Consider hiring more staff or extending deadlines")
  }

  if (errorCounts["priority-imbalance"] > 0) {
    recommendations.push("Review client priority distribution to ensure realistic scheduling expectations")
  }

  if (recommendations.length === 0) {
    recommendations.push("Your data looks good! Minor issues can be addressed using the suggestions provided.")
  }

  return recommendations
}
