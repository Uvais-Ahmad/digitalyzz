"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Wand2, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { useDataStore } from "@/store/data-context"
import { useToast } from "@/hooks/use-toast"

interface ModificationSuggestion {
  id: string
  command: string
  entityType: string
  changes: Array<{
    id: string
    field: string
    oldValue: any
    newValue: any
    reason: string
  }>
  confidence: number
  preview: string
}

export function AIModificationPanel() {
  const [command, setCommand] = useState("")
  const [suggestions, setSuggestions] = useState<ModificationSuggestion[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [appliedModifications, setAppliedModifications] = useState<Set<string>>(new Set())

  const { clients, workers, tasks, updateClient, updateWorker, updateTask } = useDataStore()
  const { toast } = useToast()

  const processCommand = async () => {
    if (!command.trim()) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/ai/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          data: { clients, workers, tasks },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])

        if (data.suggestions?.length > 0) {
          toast({
            title: "Modification suggestions ready",
            description: `Found ${data.suggestions.length} suggested changes`,
          })
        } else {
          toast({
            title: "No modifications found",
            description: "Try rephrasing your command or be more specific",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "Could not process your modification command",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const applyModification = async (suggestion: ModificationSuggestion) => {
    try {
      // Apply changes based on entity type
      suggestion.changes.forEach((change) => {
        if (suggestion.entityType === "clients") {
          updateClient(change.id, { [change.field]: change.newValue })
        } else if (suggestion.entityType === "workers") {
          updateWorker(change.id, { [change.field]: change.newValue })
        } else if (suggestion.entityType === "tasks") {
          updateTask(change.id, { [change.field]: change.newValue })
        }
      })

      setAppliedModifications((prev) => new Set([...prev, suggestion.id]))

      toast({
        title: "Changes applied successfully",
        description: `Applied ${suggestion.changes.length} modifications`,
      })
    } catch (error) {
      toast({
        title: "Failed to apply changes",
        description: "Some modifications could not be applied",
        variant: "destructive",
      })
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500"
    if (confidence >= 0.6) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Natural Language Modifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="e.g., 'Set all JavaScript developers to priority 8' or 'Increase duration by 1 for urgent tasks'"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && processCommand()}
            className="flex-1"
          />
          <Button
            onClick={processCommand}
            disabled={isProcessing || !command.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          </Button>
        </div>

        {isProcessing && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Processing your modification command...</AlertDescription>
          </Alert>
        )}

        {suggestions.map((suggestion) => {
          const isApplied = appliedModifications.has(suggestion.id)

          return (
            <div
              key={suggestion.id}
              className={`p-4 border rounded-lg ${isApplied ? "bg-green-50 border-green-200" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{suggestion.entityType}</Badge>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getConfidenceColor(suggestion.confidence)}`} />
                    <span className="text-xs text-muted-foreground">
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </span>
                  </div>
                  {isApplied && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Applied
                    </Badge>
                  )}
                </div>

                {suggestion.confidence < 0.7 && (
                  <Badge variant="secondary" className="text-yellow-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Review carefully
                  </Badge>
                )}
              </div>

              <p className="font-medium mb-2">{suggestion.command}</p>
              <p className="text-sm text-muted-foreground mb-3">{suggestion.preview}</p>

              <div className="space-y-2 mb-3">
                <h5 className="text-sm font-semibold">Proposed Changes:</h5>
                {suggestion.changes.map((change, index) => (
                  <div key={index} className="text-xs bg-muted p-2 rounded">
                    <div className="font-medium">
                      {change.id} - {change.field}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-red-600">"{String(change.oldValue)}"</span>
                      <span>→</span>
                      <span className="text-green-600">"{String(change.newValue)}"</span>
                    </div>
                    <div className="text-muted-foreground mt-1">{change.reason}</div>
                  </div>
                ))}
              </div>

              {!isApplied && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => applyModification(suggestion)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Apply Changes ({suggestion.changes.length})
                  </Button>
                  <Button variant="outline" size="sm">
                    Preview Only
                  </Button>
                </div>
              )}
            </div>
          )
        })}

        {suggestions.length === 0 && !isProcessing && (
          <div className="text-center py-6 text-muted-foreground">
            <Wand2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>Enter a modification command to get AI-powered suggestions</p>
            <p className="text-xs mt-1">
              Examples: "Set priority to 9 for urgent tasks", "Add Python skill to all developers"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
