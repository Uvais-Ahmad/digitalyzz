"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lightbulb, Loader2, Plus, RefreshCw } from "lucide-react"
import { useDataStore } from "@/store/data-context"

export function AIRuleRecommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [addedRules, setAddedRules] = useState<Set<string>>(new Set())

  const { clients, workers, tasks, addRule } = useDataStore()

  const generateRecommendations = async () => {
    if (clients.length === 0 && workers.length === 0 && tasks.length === 0) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recommend",
          clients,
          workers,
          tasks,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error("Failed to generate recommendations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addRecommendedRule = (recommendation: any) => {
    const rule = {
      ...recommendation,
      enabled: true,
    }
    addRule(rule)
    setAddedRules((prev) => new Set([...prev, recommendation.id]))
  }

  useEffect(() => {
    if (clients.length > 0 || workers.length > 0 || tasks.length > 0) {
      generateRecommendations()
    }
  }, [clients.length, workers.length, tasks.length])

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Rule Recommendations
          </CardTitle>
          <Button onClick={generateRecommendations} disabled={isLoading} variant="outline" size="sm">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Analyzing your data to generate intelligent rule recommendations...</AlertDescription>
          </Alert>
        )}

        {recommendations.length === 0 && !isLoading && (
          <Alert>
            <AlertDescription>
              Upload some data first, and I'll analyze it to recommend optimization rules for your resource allocation.
            </AlertDescription>
          </Alert>
        )}

        {recommendations.map((rec) => {
          const isAdded = addedRules.has(rec.id)

          return (
            <div key={rec.id} className={`p-4 border rounded-lg ${isAdded ? "bg-green-50 border-green-200" : ""}`}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{rec.type}</Badge>
                <Badge variant="outline">Priority: {rec.priority}</Badge>
                <Badge variant="outline" className={`text-white ${getImpactColor(rec.impact)}`}>
                  {rec.impact} impact
                </Badge>
                {isAdded && (
                  <Badge variant="default" className="bg-green-500">
                    Added
                  </Badge>
                )}
              </div>

              <h4 className="font-semibold mb-2">{rec.description}</h4>

              <p className="text-sm text-muted-foreground mb-3">{rec.reasoning}</p>

              <div className="text-xs text-muted-foreground mb-3">
                <strong>Parameters:</strong>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                  {JSON.stringify(rec.parameters, null, 2)}
                </pre>
              </div>

              {!isAdded && (
                <Button onClick={() => addRecommendedRule(rec)} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add This Rule
                </Button>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
