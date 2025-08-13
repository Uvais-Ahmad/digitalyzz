"use client"

import { useDataStore } from "@/store/data-context"
import { TrendingUp, Users, Clock, Target } from "lucide-react"

export function ImpactPreview() {
  const { clients, workers, tasks, weights } = useDataStore()

  const calculateImpact = () => {
    const highPriorityClients = clients.filter((c) => c.priority >= 4).length
    const totalClients = clients.length
    const highPriorityAllocation = totalClients > 0 ? Math.round((highPriorityClients / totalClients) * 100) : 0

    const avgTasksPerWorker = workers.length > 0 ? Math.round(tasks.length / workers.length) : 0
    const loadBalance = avgTasksPerWorker <= 3 ? "Very even" : avgTasksPerWorker <= 5 ? "Balanced" : "Uneven"

    const phaseMatch = Math.round(Math.random() * 30 + 60) // Simulated for demo

    return {
      highPriorityAllocation,
      loadBalance,
      phaseMatch,
    }
  }

  const impact = calculateImpact()

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />📈 Impact Preview
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-blue-700 flex items-center gap-1">
            <Target className="h-3 w-3" />
            High priority clients:
          </span>
          <span className="font-medium text-blue-900">+{impact.highPriorityAllocation}% allocation</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-blue-700 flex items-center gap-1">
            <Users className="h-3 w-3" />
            Worker load balance:
          </span>
          <span className="font-medium text-blue-900">{impact.loadBalance}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-blue-700 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Phase preference match:
          </span>
          <span className="font-medium text-blue-900">{impact.phaseMatch}%</span>
        </div>
      </div>
    </div>
  )
}
