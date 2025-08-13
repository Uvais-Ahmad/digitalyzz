// Core data types for the Data Alchemist application
export interface Client {
  ClientID: string
  ClientName: string
  PriorityLevel: number
  RequestedTaskIDs: string[]
  GroupTag: string
  AttributesJSON: Record<string, any>
}

export interface Worker {
  WorkerID: string
  WorkerName: string
  Skills: string[]
  AvailableSlots: number[]
  MaxLoadPerPhase: number
  WorkerGroup: string
  QualificationLevel: number
}

export interface Task {
  TaskID: string
  TaskName: string
  Category: string
  Duration: number
  RequiredSkills: string[]
  PreferredPhases: number[]
  MaxConcurrent: number
}

export interface ValidationError {
  id: string
  type: string
  severity: "error" | "warning"
  message: string
  entity: string
  field?: string
  suggestions?: string[]
}

export interface Rule {
  id: string
  type: "coRun" | "slotRestriction" | "loadLimit" | "phaseWindow" | "patternMatch" | "precedenceOverride"
  description: string
  parameters: Record<string, any>
  priority: number
  enabled: boolean
}

export interface DataState {
  clients: Client[]
  workers: Worker[]
  tasks: Task[]
  validationErrors: ValidationError[]
  rules: Rule[]
  isLoading: boolean
  currentFile: string | null
}

export type EntityType = "clients" | "workers" | "tasks"

export interface FileUploadResult {
  success: boolean
  data?: any[]
  errors?: string[]
  entityType?: EntityType
}
