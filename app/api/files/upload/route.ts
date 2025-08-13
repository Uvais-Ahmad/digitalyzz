import { type NextRequest, NextResponse } from "next/server"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import type { EntityType, FileUploadResult } from "@/lib/types"
import { AIClient } from "@/lib/ai-client"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, errors: ["No file provided"] }, { status: 400 })
    }

    // Parse file based on extension first
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    let data: any[] = []

    if (fileExtension === "csv") {
      data = await parseCSV(file)
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      data = await parseExcel(file)
    } else {
      return NextResponse.json(
        { success: false, errors: ["Unsupported file format. Please use CSV or XLSX files."] },
        { status: 400 },
      )
    }

    const entityType = determineEntityType(file.name, data)
    console.log(`Detected entity type: ${entityType} for file: ${file.name}`)

    const aiClient = new AIClient()
    const originalHeaders = data.length > 0 ? Object.keys(data[0]) : []
    const expectedFields = getExpectedFields(entityType)

    console.log(`Original headers: ${originalHeaders.join(", ")}`)
    console.log(`Expected fields for ${entityType}: ${expectedFields.join(", ")}`)

    let headerMapping: Record<string, string> = {}
    let aiMappingUsed = false

    try {
      const aiMapping = await aiClient.parseHeaders(originalHeaders, expectedFields)
      const validatedMapping = validateHeaderMapping(aiMapping, originalHeaders, expectedFields, entityType)
      headerMapping = validatedMapping
      aiMappingUsed = true
      console.log("AI header mapping successful and validated for", file.name)
      console.log("Final mapping:", headerMapping)
    } catch (error) {
      console.warn("AI header mapping failed, using enhanced manual fallback:", error)
      headerMapping = createManualHeaderMapping(originalHeaders, expectedFields, entityType)
      aiMappingUsed = false
      console.log("Manual mapping applied:", headerMapping)
    }

    // Transform data using validated header mapping
    const transformedData = transformDataWithMapping(data, entityType, headerMapping)

    const result: FileUploadResult = {
      success: true,
      data: transformedData,
      entityType,
      aiMappingUsed,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("File upload error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to process file"
    return NextResponse.json(
      {
        success: false,
        errors: [errorMessage],
        aiMappingUsed: false,
      },
      { status: 500 },
    )
  }
}

function getExpectedFields(entityType: EntityType): string[] {
  const fieldMappings = {
    clients: ["ClientID", "ClientName", "PriorityLevel", "RequestedTaskIDs", "GroupTag", "AttributesJSON"],
    workers: [
      "WorkerID",
      "WorkerName",
      "Skills",
      "AvailableSlots",
      "MaxLoadPerPhase",
      "WorkerGroup",
      "QualificationLevel",
    ],
    tasks: ["TaskID", "TaskName", "RequiredSkills", "Duration", "PreferredPhases", "MaxConcurrent", "PriorityLevel"],
  }
  return fieldMappings[entityType] || []
}

function transformDataWithMapping(data: any[], entityType: EntityType, headerMapping: Record<string, string>): any[] {
  return data.map((row) => {
    const transformed: any = {}

    // Apply AI header mapping first
    Object.keys(row).forEach((originalKey) => {
      const mappedKey = headerMapping[originalKey] || originalKey
      let value = row[originalKey]

      // Parse arrays from strings
      if (typeof value === "string" && (value.includes(",") || value.includes(";"))) {
        if (
          mappedKey.includes("Skills") ||
          mappedKey.includes("TaskIDs") ||
          mappedKey.includes("Phases") ||
          mappedKey.includes("Slots")
        ) {
          value = value
            .split(/[,;]/)
            .map((item: string) => item.trim())
            .filter(Boolean)
        }
      }

      // Parse numbers
      if (
        mappedKey.includes("Level") ||
        mappedKey.includes("Duration") ||
        mappedKey.includes("Priority") ||
        mappedKey.includes("Load") ||
        mappedKey.includes("Concurrent")
      ) {
        const num = Number.parseFloat(value)
        if (!isNaN(num)) {
          value = num
        }
      }

      // Parse JSON
      if (mappedKey.includes("JSON") || mappedKey.includes("Attributes")) {
        try {
          value = JSON.parse(value)
        } catch {
          // Keep as string if not valid JSON
        }
      }

      transformed[mappedKey] = value
    })

    return transformed
  })
}

function determineEntityType(filename: string, data?: any[]): EntityType {
  const name = filename.toLowerCase()

  // Primary detection from filename with expanded keywords
  if (name.includes("client") || name.includes("customer") || name.includes("buyer")) return "clients"
  if (
    name.includes("worker") ||
    name.includes("employee") ||
    name.includes("staff") ||
    name.includes("resource") ||
    name.includes("personnel") ||
    name.includes("team")
  )
    return "workers"
  if (
    name.includes("task") ||
    name.includes("job") ||
    name.includes("project") ||
    name.includes("assignment") ||
    name.includes("work") ||
    name.includes("activity")
  )
    return "tasks"

  // Fallback detection based on data structure
  if (data && data.length > 0) {
    return detectEntityTypeFromData(data)
  }

  // Default fallback
  return "clients"
}

function detectEntityTypeFromData(data: any[]): EntityType {
  if (!data || data.length === 0) return "clients"

  const firstRow = data[0]
  const headers = Object.keys(firstRow).map((key) => key.toLowerCase())

  // Count matches for each entity type
  const clientIndicators = headers.filter(
    (h) => h.includes("client") || h.includes("customer") || h.includes("priority") || h.includes("requested"),
  ).length

  const workerIndicators = headers.filter(
    (h) =>
      h.includes("worker") ||
      h.includes("employee") ||
      h.includes("staff") ||
      h.includes("skill") ||
      h.includes("available") ||
      h.includes("qualification") ||
      h.includes("load"),
  ).length

  const taskIndicators = headers.filter(
    (h) =>
      h.includes("task") ||
      h.includes("job") ||
      h.includes("project") ||
      h.includes("duration") ||
      h.includes("required") ||
      h.includes("phase") ||
      h.includes("concurrent"),
  ).length

  // Return the type with the most indicators
  if (workerIndicators >= clientIndicators && workerIndicators >= taskIndicators) {
    return "workers"
  } else if (taskIndicators >= clientIndicators && taskIndicators >= workerIndicators) {
    return "tasks"
  } else {
    return "clients"
  }
}

async function parseCSV(file: File): Promise<any[]> {
  const text = await file.text()

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
        } else {
          resolve(results.data as any[])
        }
      },
      error: (error) => reject(error),
    })
  })
}

async function parseExcel(file: File): Promise<any[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "buffer" })

  // Use first sheet
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  // Convert to JSON with header row
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

  if (data.length < 2) {
    throw new Error("Excel file must have at least a header row and one data row")
  }

  // Convert to objects using first row as headers
  const headers = data[0] as string[]
  const rows = data.slice(1) as any[][]

  return rows.map((row) => {
    const obj: any = {}
    headers.forEach((header, index) => {
      obj[header.trim()] = row[index] || ""
    })
    return obj
  })
}

function normalizeFieldName(fieldName: string, entityType: EntityType): string {
  const field = fieldName.trim().replace(/\s+/g, "")

  // Common field mappings with more variations
  const mappings: Record<string, Record<string, string>> = {
    clients: {
      ClientId: "ClientID",
      Client_ID: "ClientID",
      Id: "ClientID",
      ID: "ClientID",
      Name: "ClientName",
      Client_Name: "ClientName",
      CustomerName: "ClientName",
      Customer_Name: "ClientName",
      Priority: "PriorityLevel",
      PriorityLevel: "PriorityLevel",
      Tasks: "RequestedTaskIDs",
      TaskIds: "RequestedTaskIDs",
      Task_IDs: "RequestedTaskIDs",
      RequestedTasks: "RequestedTaskIDs",
      Group: "GroupTag",
      Tag: "GroupTag",
      Attributes: "AttributesJSON",
      AttributesJSON: "AttributesJSON",
    },
    workers: {
      WorkerId: "WorkerID",
      Worker_ID: "WorkerID",
      EmployeeId: "WorkerID",
      Employee_ID: "WorkerID",
      StaffId: "WorkerID",
      Id: "WorkerID",
      ID: "WorkerID",
      Name: "WorkerName",
      Worker_Name: "WorkerName",
      EmployeeName: "WorkerName",
      Employee_Name: "WorkerName",
      StaffName: "WorkerName",
      Skills: "Skills",
      Skill: "Skills",
      Slots: "AvailableSlots",
      Available_Slots: "AvailableSlots",
      AvailableSlots: "AvailableSlots",
      MaxLoad: "MaxLoadPerPhase",
      Max_Load: "MaxLoadPerPhase",
      MaxLoadPerPhase: "MaxLoadPerPhase",
      Group: "WorkerGroup",
      WorkerGroup: "WorkerGroup",
      Team: "WorkerGroup",
      Qualification: "QualificationLevel",
      QualificationLevel: "QualificationLevel",
      Qual_Level: "QualificationLevel",
    },
    tasks: {
      TaskId: "TaskID",
      Task_ID: "TaskID",
      JobId: "TaskID",
      Job_ID: "TaskID",
      ProjectId: "TaskID",
      Project_ID: "TaskID",
      Id: "TaskID",
      ID: "TaskID",
      Name: "TaskName",
      Task_Name: "TaskName",
      JobName: "TaskName",
      Job_Name: "TaskName",
      ProjectName: "TaskName",
      Project_Name: "TaskName",
      Skills: "RequiredSkills",
      Required_Skills: "RequiredSkills",
      RequiredSkills: "RequiredSkills",
      Duration: "Duration",
      Time: "Duration",
      Phases: "PreferredPhases",
      Preferred_Phases: "PreferredPhases",
      PreferredPhases: "PreferredPhases",
      MaxConcurrent: "MaxConcurrent",
      Max_Concurrent: "MaxConcurrent",
      Priority: "PriorityLevel",
      PriorityLevel: "PriorityLevel",
    },
  }

  return mappings[entityType]?.[field] || field
}

function validateHeaderMapping(
  aiMapping: Record<string, string>,
  originalHeaders: string[],
  expectedFields: string[],
  entityType: EntityType,
): Record<string, string> {
  const validatedMapping: Record<string, string> = {}
  const usedTargetFields = new Set<string>()

  // Validate each mapping
  for (const [originalHeader, mappedField] of Object.entries(aiMapping)) {
    // Check if original header exists
    if (!originalHeaders.includes(originalHeader)) {
      console.warn(`AI mapping contains non-existent header: ${originalHeader}`)
      continue
    }

    // Check if mapped field is appropriate for entity type
    if (expectedFields.includes(mappedField)) {
      // Prevent duplicate mappings to the same target field
      if (!usedTargetFields.has(mappedField)) {
        validatedMapping[originalHeader] = mappedField
        usedTargetFields.add(mappedField)
      } else {
        console.warn(`Duplicate mapping to ${mappedField}, using fallback for ${originalHeader}`)
        validatedMapping[originalHeader] = findBestFallbackMapping(
          originalHeader,
          expectedFields,
          usedTargetFields,
          entityType,
        )
      }
    } else {
      // If AI mapped to invalid field, find better mapping
      console.warn(`AI mapped ${originalHeader} to invalid field ${mappedField}, finding fallback`)
      validatedMapping[originalHeader] = findBestFallbackMapping(
        originalHeader,
        expectedFields,
        usedTargetFields,
        entityType,
      )
    }
  }

  // Handle any unmapped original headers
  for (const header of originalHeaders) {
    if (!validatedMapping[header]) {
      validatedMapping[header] = findBestFallbackMapping(header, expectedFields, usedTargetFields, entityType)
    }
  }

  return validatedMapping
}

function createManualHeaderMapping(
  originalHeaders: string[],
  expectedFields: string[],
  entityType: EntityType,
): Record<string, string> {
  const mapping: Record<string, string> = {}
  const usedTargetFields = new Set<string>()

  // Enhanced keyword mappings by entity type
  const entityKeywordMappings: Record<EntityType, Record<string, string[]>> = {
    clients: {
      ClientID: ["client", "customer", "id", "clientid", "customerid", "client_id", "customer_id"],
      ClientName: ["name", "clientname", "customername", "client_name", "customer_name", "company"],
      PriorityLevel: ["priority", "level", "prioritylevel", "priority_level", "importance"],
      RequestedTaskIDs: ["tasks", "taskids", "task_ids", "requested", "assignments"],
      GroupTag: ["group", "tag", "category", "type", "segment"],
      AttributesJSON: ["attributes", "metadata", "properties", "details", "info"],
    },
    workers: {
      WorkerID: ["worker", "employee", "staff", "id", "workerid", "employeeid", "staffid", "worker_id", "employee_id"],
      WorkerName: ["name", "workername", "employeename", "staffname", "worker_name", "employee_name", "fullname"],
      Skills: ["skills", "skill", "abilities", "expertise", "competencies", "technologies"],
      AvailableSlots: ["slots", "availability", "available", "phases", "time", "schedule", "capacity"],
      MaxLoadPerPhase: ["load", "maxload", "capacity", "max_load", "workload", "bandwidth"],
      WorkerGroup: ["group", "team", "department", "division", "unit", "squad"],
      QualificationLevel: ["qualification", "level", "experience", "seniority", "grade", "rank"],
    },
    tasks: {
      TaskID: ["task", "job", "project", "id", "taskid", "jobid", "projectid", "task_id", "job_id"],
      TaskName: ["name", "taskname", "jobname", "projectname", "task_name", "job_name", "title"],
      RequiredSkills: ["skills", "required", "requirements", "needed", "technologies", "expertise"],
      Duration: ["duration", "time", "hours", "days", "length", "effort", "estimate"],
      PreferredPhases: ["phases", "preferred", "schedule", "timeline", "slots", "periods"],
      MaxConcurrent: ["concurrent", "parallel", "simultaneous", "max_concurrent", "capacity"],
      PriorityLevel: ["priority", "level", "importance", "urgency", "criticality"],
    },
  }

  const keywordMappings = entityKeywordMappings[entityType] || {}

  for (const originalHeader of originalHeaders) {
    const normalizedHeader = originalHeader.toLowerCase().replace(/[^a-z0-9]/g, "")
    let bestMatch = originalHeader // Default to original header
    let bestScore = 0

    // Try to find best match using keyword mappings
    for (const [expectedField, keywords] of Object.entries(keywordMappings)) {
      if (expectedFields.includes(expectedField) && !usedTargetFields.has(expectedField)) {
        // Calculate match score
        let score = 0
        for (const keyword of keywords) {
          const normalizedKeyword = keyword.toLowerCase().replace(/[^a-z0-9]/g, "")
          if (normalizedHeader === normalizedKeyword) {
            score = 100 // Exact match
            break
          } else if (normalizedHeader.includes(normalizedKeyword)) {
            score = Math.max(score, 80)
          } else if (normalizedKeyword.includes(normalizedHeader)) {
            score = Math.max(score, 60)
          }
        }

        if (score > bestScore) {
          bestScore = score
          bestMatch = expectedField
        }
      }
    }

    // If we found a good match, mark the target field as used
    if (bestScore > 50 && expectedFields.includes(bestMatch)) {
      usedTargetFields.add(bestMatch)
    } else {
      bestMatch = originalHeader // Keep original if no good match
    }

    mapping[originalHeader] = bestMatch
  }

  return mapping
}

function findBestFallbackMapping(
  originalHeader: string,
  expectedFields: string[],
  usedTargetFields: Set<string>,
  entityType: EntityType,
): string {
  const normalizedHeader = originalHeader.toLowerCase().replace(/[^a-z0-9]/g, "")

  // Try to find an unused expected field that matches
  for (const field of expectedFields) {
    if (!usedTargetFields.has(field)) {
      const normalizedField = field.toLowerCase().replace(/[^a-z0-9]/g, "")
      if (normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader)) {
        usedTargetFields.add(field)
        return field
      }
    }
  }

  // If no match found, return original header
  return originalHeader
}
