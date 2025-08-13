"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Sparkles, Loader2 } from "lucide-react"
import { useDataStore } from "@/store/data-context"
import { useToast } from "@/hooks/use-toast"

export function AIQueryPanel() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [explanation, setExplanation] = useState("")
  const [error, setError] = useState("")

  const { clients, workers, tasks } = useDataStore()
  const { toast } = useToast()

  const handleQuery = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError("")
    setResults([])
    setExplanation("")

    try {
      const response = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, clients, workers, tasks }),
      })

      if (!response.ok) {
        throw new Error("Query failed")
      }

      const data = await response.json()
      setResults(data.results || [])
      setExplanation(data.explanation || "")

      if (data.explanation?.includes("quota exceeded") || data.explanation?.includes("rate limit")) {
        toast({
          title: "AI Service Limit Reached",
          description:
            "You've exceeded your current AI quota. AI features are temporarily unavailable. Please try again later or upgrade your plan.",
          variant: "destructive",
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"

      if (errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
        toast({
          title: "AI Quota Exceeded",
          description:
            "You've reached your AI usage limit. Please try again later or contact support to increase your quota.",
          variant: "destructive",
        })
        setError("AI service temporarily unavailable due to quota limits.")
      } else {
        toast({
          title: "Query Failed",
          description: "Failed to process your AI query. Please try again.",
          variant: "destructive",
        })
        setError("Failed to process query. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const exampleQueries = [
    "Show high priority clients",
    "Find workers with JavaScript skills",
    "Tasks with duration > 3",
    "Workers in phase 1",
    "Clients requesting more than 2 tasks",
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Natural Language Query
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about your data in plain English..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuery()}
          />
          <Button onClick={handleQuery} disabled={isLoading || !query.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Try:</span>
          {exampleQueries.map((example, index) => (
            <Button key={index} variant="outline" size="sm" onClick={() => setQuery(example)} className="text-xs">
              {example}
            </Button>
          ))}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {explanation && (
          <Alert>
            <AlertDescription>{explanation}</AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Results ({results.length})</h4>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {result.ClientID && <Badge variant="secondary">Client</Badge>}
                    {result.WorkerID && <Badge variant="secondary">Worker</Badge>}
                    {result.TaskID && <Badge variant="secondary">Task</Badge>}
                    <span className="font-medium">{result.ClientName || result.WorkerName || result.TaskName}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ID: {result.ClientID || result.WorkerID || result.TaskID}
                  </div>
                  {result.PriorityLevel && <div className="text-sm">Priority: {result.PriorityLevel}</div>}
                  {result.Skills && <div className="text-sm">Skills: {result.Skills.join(", ")}</div>}
                  {result.Duration && <div className="text-sm">Duration: {result.Duration}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
