"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { useDataStore } from "@/store/data-context"

export function RuleManagement() {
  const { rules, updateRule, removeRule, toggleRule } = useDataStore()
  const [selectedPreset, setSelectedPreset] = useState<string>("")

  const presets = [
    {
      id: "maximize-fulfillment",
      name: "Maximize Fulfillment",
      description: "Prioritize completing as many tasks as possible",
      weights: { fulfillment: 0.4, fairness: 0.2, efficiency: 0.3, priority: 0.1 },
    },
    {
      id: "fair-distribution",
      name: "Fair Distribution",
      description: "Ensure equal workload distribution among workers",
      weights: { fulfillment: 0.2, fairness: 0.5, efficiency: 0.2, priority: 0.1 },
    },
    {
      id: "priority-first",
      name: "Priority First",
      description: "Focus on high-priority clients and tasks",
      weights: { fulfillment: 0.2, fairness: 0.1, efficiency: 0.2, priority: 0.5 },
    },
    {
      id: "efficiency-focused",
      name: "Efficiency Focused",
      description: "Optimize for resource utilization and speed",
      weights: { fulfillment: 0.2, fairness: 0.2, efficiency: 0.5, priority: 0.1 },
    },
  ]

  const moveRule = (ruleId: string, direction: "up" | "down") => {
    const currentRule = rules.find((r) => r.id === ruleId)
    if (!currentRule) return

    const newPriority = direction === "up" ? currentRule.priority + 1 : currentRule.priority - 1
    const clampedPriority = Math.max(1, Math.min(10, newPriority))

    updateRule(ruleId, { priority: clampedPriority })
  }

  const applyPreset = (preset: any) => {
    setSelectedPreset(preset.id)
    // In a real implementation, this would update the allocation algorithm weights
    console.log("Applied preset:", preset)
  }

  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Allocation Presets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPreset === preset.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
                onClick={() => applyPreset(preset)}
              >
                <h4 className="font-semibold mb-1">{preset.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">{preset.description}</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(preset.weights).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key}: {Math.round((value as number) * 100)}%
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Rules ({rules.filter((r) => r.enabled).length})</CardTitle>
            <Badge variant="outline">{rules.length} total</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.length === 0 && (
            <Alert>
              <AlertDescription>
                No rules created yet. Use the Rule Builder or Natural Language Rules to create your first rule.
              </AlertDescription>
            </Alert>
          )}

          {sortedRules.map((rule) => (
            <div key={rule.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                  <Badge variant="secondary">{rule.type}</Badge>
                  <Badge variant="outline">Priority: {rule.priority}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => moveRule(rule.id, "up")}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => moveRule(rule.id, "down")}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeRule(rule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-1">{rule.description}</h4>
                <div className="text-sm text-muted-foreground">
                  <strong>Parameters:</strong>
                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(rule.parameters, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Priority Weight</span>
                  <span>{rule.priority}/10</span>
                </div>
                <Slider
                  value={[rule.priority]}
                  onValueChange={([value]) => updateRule(rule.id, { priority: value })}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
