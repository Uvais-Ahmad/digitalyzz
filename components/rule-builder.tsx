"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Plus, X } from "lucide-react"
import { useDataStore } from "@/store/data-context"
import type { Rule } from "@/lib/types"

interface RuleBuilderProps {
  onRuleCreate?: (rule: Rule) => void
}

export function RuleBuilder({ onRuleCreate }: RuleBuilderProps) {
  const [selectedRuleType, setSelectedRuleType] = useState<Rule["type"]>("coRun")
  const [ruleDescription, setRuleDescription] = useState("")
  const [rulePriority, setRulePriority] = useState([5])
  const [ruleParameters, setRuleParameters] = useState<Record<string, any>>({})

  const { addRule, clients, workers, tasks } = useDataStore()

  const ruleTypes = [
    {
      value: "coRun",
      label: "Co-Run Rules",
      description: "Tasks that must run together",
      parameters: ["taskIds", "groupName"],
    },
    {
      value: "slotRestriction",
      label: "Slot Restrictions",
      description: "Limit tasks to specific time slots",
      parameters: ["taskIds", "allowedSlots", "restrictedSlots"],
    },
    {
      value: "loadLimit",
      label: "Load Limits",
      description: "Restrict worker load per phase",
      parameters: ["workerIds", "maxLoad", "phases"],
    },
    {
      value: "phaseWindow",
      label: "Phase Windows",
      description: "Tasks must run within specific phases",
      parameters: ["taskIds", "startPhase", "endPhase"],
    },
    {
      value: "patternMatch",
      label: "Pattern Matching",
      description: "Match tasks based on patterns",
      parameters: ["pattern", "action", "conditions"],
    },
    {
      value: "precedenceOverride",
      label: "Precedence Override",
      description: "Override default task precedence",
      parameters: ["beforeTaskIds", "afterTaskIds", "priority"],
    },
  ]

  const currentRuleType = ruleTypes.find((rt) => rt.value === selectedRuleType)

  const handleParameterChange = (param: string, value: any) => {
    setRuleParameters((prev) => ({
      ...prev,
      [param]: value,
    }))
  }

  const addToArray = (param: string, value: string) => {
    const currentArray = ruleParameters[param] || []
    if (!currentArray.includes(value)) {
      handleParameterChange(param, [...currentArray, value])
    }
  }

  const removeFromArray = (param: string, value: string) => {
    const currentArray = ruleParameters[param] || []
    handleParameterChange(
      param,
      currentArray.filter((item: string) => item !== value),
    )
  }

  const createRule = () => {
    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      type: selectedRuleType,
      description: ruleDescription || `${currentRuleType?.label} rule`,
      parameters: ruleParameters,
      priority: rulePriority[0],
      enabled: true,
    }

    addRule(newRule)
    onRuleCreate?.(newRule)

    // Reset form
    setRuleDescription("")
    setRuleParameters({})
    setRulePriority([5])
  }

  const renderParameterInput = (param: string) => {
    const value = ruleParameters[param] || (param.includes("Ids") ? [] : "")

    switch (param) {
      case "taskIds":
      case "workerIds":
      case "beforeTaskIds":
      case "afterTaskIds":
        const availableIds =
          param.includes("task") || param.includes("Task")
            ? tasks.map((t) => t.TaskID)
            : param.includes("worker") || param.includes("Worker")
              ? workers.map((w) => w.WorkerID)
              : []

        return (
          <div key={param} className="space-y-2">
            <Label>{param.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</Label>

            <div className="space-y-2">
              <Select onValueChange={(val) => addToArray(param, val)}>
                <SelectTrigger>
                  <SelectValue placeholder={`Add ${param}`} />
                </SelectTrigger>
                <SelectContent>
                  {availableIds
                    .filter((id) => !Array.isArray(value) || !value.includes(id))
                    .map((id) => (
                      <SelectItem key={id} value={id}>
                        {id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <div className="flex flex-wrap gap-1">
                {Array.isArray(value) &&
                  value.map((id: string, index: number) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {id}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeFromArray(param, id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
              </div>

              {Array.isArray(value) && value.length === 0 && (
                <p className="text-sm text-muted-foreground">No {param} selected</p>
              )}
            </div>
          </div>
        )

      // ... existing code for other parameter types ...
      case "allowedSlots":
      case "restrictedSlots":
      case "phases":
        return (
          <div key={param} className="space-y-2">
            <Label>{param.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</Label>
            <Input
              placeholder="Enter comma-separated numbers (e.g., 1,2,3)"
              value={Array.isArray(value) ? value.join(",") : value}
              onChange={(e) => {
                const numbers = e.target.value
                  .split(",")
                  .map((n) => Number.parseInt(n.trim()))
                  .filter(Boolean)
                handleParameterChange(param, numbers)
              }}
            />
          </div>
        )

      case "maxLoad":
      case "startPhase":
      case "endPhase":
      case "priority":
        return (
          <div key={param} className="space-y-2">
            <Label>{param.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => handleParameterChange(param, Number.parseInt(e.target.value))}
            />
          </div>
        )

      case "pattern":
      case "action":
      case "conditions":
      case "groupName":
        return (
          <div key={param} className="space-y-2">
            <Label>{param.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</Label>
            <Input
              value={value}
              onChange={(e) => handleParameterChange(param, e.target.value)}
              placeholder={`Enter ${param}`}
            />
          </div>
        )

      default:
        return (
          <div key={param} className="space-y-2">
            <Label>{param}</Label>
            <Input
              value={value}
              onChange={(e) => handleParameterChange(param, e.target.value)}
              placeholder={`Enter ${param}`}
            />
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Rule Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Rule Type</Label>
            <Select value={selectedRuleType} onValueChange={(value) => setSelectedRuleType(value as Rule["type"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ruleTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority (1-10)</Label>
            <div className="px-3">
              <Slider
                value={rulePriority}
                onValueChange={setRulePriority}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Low (1)</span>
                <span className="font-medium">{rulePriority[0]}</span>
                <span>High (10)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Describe what this rule does..."
            value={ruleDescription}
            onChange={(e) => setRuleDescription(e.target.value)}
          />
        </div>

        {currentRuleType && (
          <div className="space-y-4">
            <h4 className="font-semibold">Rule Parameters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentRuleType.parameters.map((param) => renderParameterInput(param))}
            </div>
          </div>
        )}

        <Button onClick={createRule} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </CardContent>
    </Card>
  )
}
