"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, Plus } from "lucide-react"
import { useDataStore } from "@/store/data-context"

export function NaturalLanguageRules() {
  const [ruleText, setRuleText] = useState("")
  const [isConverting, setIsConverting] = useState(false)
  const [convertedRule, setConvertedRule] = useState<any>(null)
  const [error, setError] = useState("")

  const { addRule, clients, workers, tasks } = useDataStore()

  const convertRule = async () => {
    if (!ruleText.trim()) return

    setIsConverting(true)
    setError("")
    setConvertedRule(null)

    try {
      const response = await fetch("/api/ai/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "convert",
          ruleText,
          clients,
          workers,
          tasks,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to convert rule")
      }

      const data = await response.json()
      setConvertedRule(data.rule)
    } catch (err) {
      setError("Failed to convert rule. Please try rephrasing it.")
    } finally {
      setIsConverting(false)
    }
  }

  const acceptRule = () => {
    if (convertedRule) {
      addRule(convertedRule)
      setConvertedRule(null)
      setRuleText("")
    }
  }

  const exampleRules = [
    "Tasks A and B must run together",
    "No more than 5 tasks per worker in phase 1",
    "High priority tasks only in phases 1-3",
    "JavaScript tasks require workers with JavaScript skills",
    "Client premium tasks must run before standard tasks",
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Natural Language Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Describe your rule in plain English..."
            value={ruleText}
            onChange={(e) => setRuleText(e.target.value)}
            rows={3}
          />
          <Button onClick={convertRule} disabled={isConverting || !ruleText.trim()} className="w-full">
            {isConverting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Convert to Rule
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleRules.map((example, index) => (
              <Button key={index} variant="outline" size="sm" onClick={() => setRuleText(example)} className="text-xs">
                {example}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {convertedRule && (
          <Alert>
            <AlertDescription>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Converted Rule:</span>
                  <Badge variant="secondary">{convertedRule.type}</Badge>
                  <Badge variant="outline">Priority: {convertedRule.priority}</Badge>
                  {convertedRule.confidence && (
                    <Badge variant="outline">Confidence: {Math.round(convertedRule.confidence * 100)}%</Badge>
                  )}
                </div>
                <p className="text-sm">{convertedRule.description}</p>
                <div className="text-xs text-muted-foreground">
                  <strong>Parameters:</strong> {JSON.stringify(convertedRule.parameters, null, 2)}
                </div>
                <div className="flex gap-2">
                  <Button onClick={acceptRule} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Rule
                  </Button>
                  <Button onClick={() => setConvertedRule(null)} variant="outline" size="sm">
                    Discard
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
