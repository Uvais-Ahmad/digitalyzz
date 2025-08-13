import { openai } from "@ai-sdk/openai"
import { generateObject, generateText } from "ai"
import { z } from "zod"
import type { Client, Worker, Task, ValidationError } from "@/lib/types"

export class AIClient {
  private model
  private isAIAvailable: boolean

  constructor() {
    // Check if OpenAI API key is available
    this.isAIAvailable = !!process.env.OPENAI_API_KEY
    this.model = this.isAIAvailable ? openai("gpt-4o-mini") : null
  }

  async parseHeaders(headers: string[], expectedFields: string[]): Promise<Record<string, string>> {
    // If AI is not available, use basic mapping
    if (!this.isAIAvailable) {
      console.log("OpenAI API key not found, using basic header mapping")
      return this.basicHeaderMapping(headers, expectedFields)
    }

    const prompt = `
Given these CSV headers: ${headers.join(", ")}
Map them to expected fields: ${expectedFields.join(", ")}

Handle common variations like:
- "Client ID" -> "ClientID"
- "Worker Name" -> "WorkerName"
- "Task IDs" -> "RequestedTaskIDs"
- "Skills" -> "RequiredSkills" or "Skills"
- "Phases" -> "PreferredPhases" or "AvailableSlots"

Return a JSON mapping object where keys are original headers and values are mapped field names.
If a header doesn't match any expected field, map it to itself.

Example response format:
{"Client ID": "ClientID", "Worker Name": "WorkerName", "Skills": "Skills"}
`

    try {
      const { text } = await generateText({
        model: this.model,
        prompt: prompt + "\n\nRespond with ONLY the JSON mapping object, no additional text.",
      })

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.log("No JSON found in AI response, using basic header mapping")
        return this.basicHeaderMapping(headers, expectedFields)
      }

      const mapping = JSON.parse(jsonMatch[0])

      const missingHeaders = headers.filter((header) => !(header in mapping))
      if (missingHeaders.length > 0) {
        console.log(`AI mapping missing headers: ${missingHeaders.join(", ")}, filling with basic mapping`)
        const basicMapping = this.basicHeaderMapping(missingHeaders, expectedFields)
        Object.assign(mapping, basicMapping)
      }

      console.log("AI header mapping successful:", mapping)
      return mapping
    } catch (error: any) {
      console.error("AI header mapping failed:", error)

      if (error?.message?.includes("No object generated")) {
        console.log("AI model failed to generate object, falling back to basic header mapping")
      } else if (error?.message?.includes("rate limit") || error?.message?.includes("quota")) {
        console.log("OpenAI rate limit reached, falling back to basic header mapping")
      } else if (error?.message?.includes("API key")) {
        console.log("OpenAI API key issue, falling back to basic header mapping")
      } else {
        console.log("OpenAI request failed, falling back to basic header mapping")
      }

      // Always fallback to basic mapping - never let the upload fail
      return this.basicHeaderMapping(headers, expectedFields)
    }
  }

  private basicHeaderMapping(headers: string[], expectedFields: string[]): Record<string, string> {
    const mapping: Record<string, string> = {}

    // Enhanced keyword mappings for better fallback
    const keywordMappings: Record<string, string[]> = {
      ClientID: ["client", "customer", "clientid", "customerid", "id"],
      ClientName: ["name", "clientname", "customername", "client_name", "customer_name"],
      PriorityLevel: ["priority", "level", "prioritylevel", "priority_level"],
      Budget: ["budget", "cost", "price", "amount"],
      WorkerID: ["worker", "employee", "staff", "workerid", "employeeid", "staffid"],
      WorkerName: ["name", "workername", "employeename", "staffname", "worker_name"],
      Skills: ["skills", "skill", "abilities", "expertise", "competencies"],
      AvailableSlots: ["slots", "availability", "available", "phases", "time"],
      TaskID: ["task", "job", "project", "taskid", "jobid", "projectid"],
      TaskName: ["name", "taskname", "jobname", "projectname", "task_name"],
      Duration: ["duration", "time", "hours", "days", "length"],
      RequiredSkills: ["skills", "required", "requirements", "needed"],
    }

    headers.forEach((header) => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "")
      let bestMatch = header // Default to original header

      // Try to find best match using keyword mappings
      for (const [expectedField, keywords] of Object.entries(keywordMappings)) {
        if (expectedFields.includes(expectedField)) {
          const matches = keywords.some(
            (keyword) => normalizedHeader.includes(keyword) || keyword.includes(normalizedHeader),
          )
          if (matches) {
            bestMatch = expectedField
            break
          }
        }
      }

      // If no keyword match, try direct field matching
      if (bestMatch === header) {
        const directMatch = expectedFields.find((field) => {
          const normalizedField = field.toLowerCase().replace(/[^a-z0-9]/g, "")
          return normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader)
        })
        bestMatch = directMatch || header
      }

      mapping[header] = bestMatch
    })

    return mapping
  }

  async queryData(
    query: string,
    clients: Client[],
    workers: Worker[],
    tasks: Task[],
  ): Promise<{ results: any[]; explanation: string }> {
    if (!this.isAIAvailable) {
      return {
        results: [],
        explanation:
          "AI search is not available. Please configure OPENAI_API_KEY in Project Settings to enable AI-powered data queries.",
      }
    }

    const dataSchema = {
      clients: clients.length > 0 ? Object.keys(clients[0]) : [],
      workers: workers.length > 0 ? Object.keys(workers[0]) : [],
      tasks: tasks.length > 0 ? Object.keys(tasks[0]) : [],
    }

    const prompt = `
User query: "${query}"
Available data schema: ${JSON.stringify(dataSchema, null, 2)}

Sample data:
Clients (${clients.length} total): ${JSON.stringify(clients.slice(0, 2), null, 2)}
Workers (${workers.length} total): ${JSON.stringify(workers.slice(0, 2), null, 2)}
Tasks (${tasks.length} total): ${JSON.stringify(tasks.slice(0, 2), null, 2)}

Convert the user's natural language query into a structured filter and return matching results.

IMPORTANT: Respond with ONLY a valid JSON object in this exact format:
{
  "entityType": "clients|workers|tasks|all",
  "filters": [
    {
      "field": "fieldName",
      "operator": "equals|contains|greater|less|greaterEqual|lessEqual",
      "value": "searchValue"
    }
  ],
  "explanation": "Brief explanation of what was found"
}

Examples:
- "Show tasks with duration > 2" -> {"entityType": "tasks", "filters": [{"field": "Duration", "operator": "greater", "value": 2}], "explanation": "Found tasks with duration greater than 2"}
- "Find workers with JavaScript skills" -> {"entityType": "workers", "filters": [{"field": "Skills", "operator": "contains", "value": "JavaScript"}], "explanation": "Found workers with JavaScript skills"}
`

    try {
      const { text } = await generateText({
        model: this.model,
        prompt,
      })

      let parsed: any = null

      // Try to extract JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0])
        } catch (parseError) {
          console.log("Failed to parse extracted JSON, trying to clean it")
          // Try to clean and parse again
          const cleanedJson = jsonMatch[0]
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
            .replace(/,\s*}/g, "}") // Remove trailing commas
            .replace(/,\s*]/g, "]")

          try {
            parsed = JSON.parse(cleanedJson)
          } catch (secondParseError) {
            console.log("JSON cleaning failed, using fallback")
          }
        }
      }

      // If JSON parsing failed, create a basic search fallback
      if (!parsed) {
        console.log("No valid JSON found, creating basic search fallback")
        const queryLower = query.toLowerCase()

        // Determine entity type from query
        let entityType = "all"
        if (queryLower.includes("client") || queryLower.includes("customer")) {
          entityType = "clients"
        } else if (queryLower.includes("worker") || queryLower.includes("employee")) {
          entityType = "workers"
        } else if (queryLower.includes("task") || queryLower.includes("job")) {
          entityType = "tasks"
        }

        parsed = {
          entityType,
          filters: [],
          explanation: `Performed basic search for: ${query}`,
        }
      }

      // Apply filters to get results
      let data: any[] = []
      switch (parsed.entityType) {
        case "clients":
          data = clients
          break
        case "workers":
          data = workers
          break
        case "tasks":
          data = tasks
          break
        default:
          // If no specific entity type, search all
          data = [...clients, ...workers, ...tasks]
      }

      const results = data.filter((item) => {
        if (!parsed.filters || !Array.isArray(parsed.filters) || parsed.filters.length === 0) {
          // If no filters, do basic text search across all fields
          const queryLower = query.toLowerCase()
          return Object.values(item).some((value) => String(value).toLowerCase().includes(queryLower))
        }

        return parsed.filters.every((filter: any) => {
          if (!filter.field || !item.hasOwnProperty(filter.field)) {
            return true // Skip invalid filters
          }

          const fieldValue = item[filter.field]
          try {
            switch (filter.operator) {
              case "equals":
                return fieldValue === filter.value
              case "contains":
                return Array.isArray(fieldValue)
                  ? fieldValue.includes(filter.value)
                  : String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase())
              case "greater":
                return Number(fieldValue) > Number(filter.value)
              case "less":
                return Number(fieldValue) < Number(filter.value)
              case "greaterEqual":
                return Number(fieldValue) >= Number(filter.value)
              case "lessEqual":
                return Number(fieldValue) <= Number(filter.value)
              default:
                return true
            }
          } catch (filterError) {
            console.log(`Filter error for field ${filter.field}:`, filterError)
            return true // Don't exclude items due to filter errors
          }
        })
      })

      return {
        results,
        explanation: parsed.explanation || `Found ${results.length} matching results for: ${query}`,
      }
    } catch (error: any) {
      console.error("AI query failed:", error)

      let explanation = "Sorry, I couldn't process that query. Please try rephrasing it."
      if (error?.message?.includes("rate limit")) {
        explanation = "AI service is temporarily unavailable due to rate limits. Please try again later."
      } else if (error?.message?.includes("quota")) {
        explanation = "AI service quota exceeded. Please try again later or contact support."
      }

      return {
        results: [],
        explanation,
      }
    }
  }

  async generateErrorCorrections(
    errors: ValidationError[],
  ): Promise<Array<{ errorId: string; corrections: string[] }>> {
    if (!this.isAIAvailable) {
      return errors.map((error) => ({
        errorId: error.id,
        corrections: [
          "AI corrections not available - configure OPENAI_API_KEY",
          "Review the data manually",
          "Check documentation for proper format",
        ],
      }))
    }

    const prompt = `
Analyze these validation errors and provide specific correction suggestions:

${errors
  .map(
    (error) => `
Error ID: ${error.id}
Type: ${error.type}
Entity: ${error.entity}
Field: ${error.field || "N/A"}
Message: ${error.message}
`,
  )
  .join("\n")}

For each error, provide 2-3 specific, actionable correction steps.
Focus on practical solutions that can be implemented immediately.

Respond with a JSON object containing a "corrections" array.
`

    try {
      const { object } = await generateObject({
        model: this.model,
        mode: "json",
        schema: z.object({
          corrections: z.array(
            z.object({
              errorId: z.string(),
              corrections: z.array(z.string()),
            }),
          ),
        }),
        prompt,
      })

      return object.corrections
    } catch (error) {
      console.error("AI error correction failed:", error)
      return errors.map((error) => ({
        errorId: error.id,
        corrections: ["Review the data manually", "Check documentation for proper format"],
      }))
    }
  }

  async convertTextToRule(ruleText: string, dataContext: { clients: Client[]; workers: Worker[]; tasks: Task[] }) {
    if (!this.isAIAvailable) {
      return {
        id: `rule-${Date.now()}`,
        type: "patternMatch" as const,
        description: ruleText,
        parameters: { pattern: ruleText },
        priority: 5,
        enabled: true,
      }
    }

    try {
      const { text } = await generateText({
        model: this.model,
        prompt: `Convert this rule to JSON: "${ruleText}". Return a JSON object with type, description, parameters, priority (1-10).`,
      })

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          id: `rule-${Date.now()}`,
          type: parsed.type || "patternMatch",
          description: parsed.description || ruleText,
          parameters: parsed.parameters || { pattern: ruleText },
          priority: parsed.priority || 5,
          enabled: true,
        }
      }
    } catch (error) {
      console.error("AI rule conversion failed:", error)
    }

    return {
      id: `rule-${Date.now()}`,
      type: "patternMatch" as const,
      description: ruleText,
      parameters: { pattern: ruleText },
      priority: 5,
      enabled: true,
    }
  }

  async recommendRules(clients: Client[], workers: Worker[], tasks: Task[]): Promise<any[]> {
    if (!this.isAIAvailable) {
      return [
        {
          id: `basic-rec-${Date.now()}`,
          type: "loadLimit",
          description: "Basic load balancing rule (AI recommendations require OPENAI_API_KEY)",
          parameters: { maxTasks: 5 },
          priority: 5,
          reasoning: "Default recommendation when AI is not available",
          impact: "medium",
          enabled: false,
        },
      ]
    }

    try {
      const { text } = await generateText({
        model: this.model,
        prompt: `Analyze this data and recommend 3 allocation rules as JSON array: ${clients.length} clients, ${workers.length} workers, ${tasks.length} tasks.`,
      })

      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0])
        return recommendations.map((rec: any, index: number) => ({
          id: `ai-rec-${Date.now()}-${index}`,
          type: rec.type || "loadLimit",
          description: rec.description || "AI recommended rule",
          parameters: rec.parameters || {},
          priority: rec.priority || 5,
          reasoning: rec.reasoning || "Based on data analysis",
          impact: rec.impact || "medium",
          enabled: false,
        }))
      }
    } catch (error) {
      console.error("AI rule recommendation failed:", error)
    }

    return []
  }

  async generateModificationSuggestions(
    command: string,
    data: { clients: Client[]; workers: Worker[]; tasks: Task[] },
  ): Promise<any[]> {
    if (!this.isAIAvailable) {
      return [
        {
          id: `mod-${Date.now()}`,
          command,
          entityType: "clients",
          changes: [],
          confidence: 0.5,
          preview: "AI modifications require OPENAI_API_KEY configuration",
        },
      ]
    }

    const prompt = `
Analyze this modification command: "${command}"

Available data:
- Clients (${data.clients.length}): ${JSON.stringify(data.clients.slice(0, 2), null, 2)}
- Workers (${data.workers.length}): ${JSON.stringify(data.workers.slice(0, 2), null, 2)}  
- Tasks (${data.tasks.length}): ${JSON.stringify(data.tasks.slice(0, 2), null, 2)}

Generate specific modification suggestions with:
1. Which entities to modify
2. What fields to change
3. Old and new values
4. Confidence score (0-1)
5. Reasoning for each change

Examples:
- "Set priority to 8 for JavaScript developers" → find workers with JavaScript skills, change their priority
- "Increase duration by 1 for urgent tasks" → find high priority tasks, increment duration
- "Add Python skill to all backend developers" → find relevant workers, add Python to skills array

Return JSON array of modification suggestions.
`

    try {
      const { text } = await generateText({
        model: this.model,
        prompt,
      })

      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error("No JSON array found in response")
      }

      const suggestions = JSON.parse(jsonMatch[0])
      return suggestions.map((suggestion: any, index: number) => ({
        id: `mod-${Date.now()}-${index}`,
        command: suggestion.command || command,
        entityType: suggestion.entityType || "clients",
        changes: suggestion.changes || [],
        confidence: suggestion.confidence || 0.7,
        preview: suggestion.preview || "AI-generated modification suggestion",
      }))
    } catch (error) {
      console.error("AI modification suggestion failed:", error)
      return [
        {
          id: `mod-${Date.now()}`,
          command,
          entityType: "clients",
          changes: [],
          confidence: 0.3,
          preview: "Could not process modification command - please try rephrasing",
        },
      ]
    }
  }
}
