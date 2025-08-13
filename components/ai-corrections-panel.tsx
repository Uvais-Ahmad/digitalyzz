"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lightbulb, Loader2, CheckCircle } from "lucide-react"
import { useDataStore } from "@/store/data-context"
import { useToast } from "@/hooks/use-toast"

export function AICorrectionsPanel() {
  const [corrections, setCorrections] = useState<Array<{ errorId: string; corrections: string[] }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [appliedCorrections, setAppliedCorrections] = useState<Set<string>>(new Set())

  const { validationErrors } = useDataStore()
  const { toast } = useToast()

  const generateCorrections = async () => {
    if (validationErrors.length === 0) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/ai/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errors: validationErrors }),
      })

      if (response.ok) {
        const data = await response.json()
        setCorrections(data.corrections || [])

        const hasQuotaError = data.corrections?.some((correction: any) =>
          correction.corrections?.some(
            (text: string) => text.includes("quota") || text.includes("rate limit") || text.includes("API key"),
          ),
        )

        if (hasQuotaError) {
          toast({
            title: "AI Corrections Limited",
            description: "AI correction suggestions are limited due to quota restrictions. Basic suggestions provided.",
            variant: "destructive",
          })
        }
      } else {
        throw new Error("Failed to generate corrections")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      if (errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
        toast({
          title: "AI Quota Exceeded",
          description: "Cannot generate AI corrections due to quota limits. Please try again later.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Correction Generation Failed",
          description: "Failed to generate AI correction suggestions.",
          variant: "destructive",
        })
      }
      console.error("Failed to generate corrections:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsApplied = (errorId: string) => {
    setAppliedCorrections((prev) => new Set([...prev, errorId]))
  }

  useEffect(() => {
    if (validationErrors.length > 0 && corrections.length === 0) {
      generateCorrections()
    }
  }, [validationErrors])

  if (validationErrors.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-4">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
            <p className="text-muted-foreground">No validation errors to correct!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Error Corrections
          </CardTitle>
          <Button onClick={generateCorrections} disabled={isLoading} variant="outline" size="sm">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh Suggestions"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Generating AI-powered correction suggestions...</AlertDescription>
          </Alert>
        )}

        {corrections.map((correction) => {
          const error = validationErrors.find((e) => e.id === correction.errorId)
          if (!error) return null

          const isApplied = appliedCorrections.has(correction.errorId)

          return (
            <div
              key={correction.errorId}
              className={`p-4 border rounded-lg ${isApplied ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={error.severity === "error" ? "destructive" : "secondary"}>{error.severity}</Badge>
                <Badge variant="outline">{error.entity}</Badge>
                {error.field && <Badge variant="outline">{error.field}</Badge>}
                {isApplied && (
                  <Badge variant="default" className="bg-green-500">
                    Applied
                  </Badge>
                )}
              </div>

              <p className="font-medium mb-3">{error.message}</p>

              <div className="space-y-2">
                <h5 className="text-sm font-semibold flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  AI Suggestions:
                </h5>
                <ul className="space-y-1">
                  {correction.corrections.map((suggestion, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {!isApplied && (
                <Button onClick={() => markAsApplied(correction.errorId)} variant="outline" size="sm" className="mt-3">
                  Mark as Applied
                </Button>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
