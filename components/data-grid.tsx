"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Download, Plus, Edit2, Check, X } from "lucide-react"
import { useDataStore } from "@/store/data-context"
import type { EntityType } from "@/lib/types"

interface EditingCell {
  rowId: string
  field: string
}

interface DataGridProps {
  entityType: EntityType
}

// Custom cell renderers
const ArrayCellRenderer = ({
  value,
  isEditing,
  onChange,
}: { value: any; isEditing: boolean; onChange?: (value: string) => void }) => {
  if (isEditing) {
    return (
      <Input
        defaultValue={Array.isArray(value) ? value.join(", ") : ""}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full"
        placeholder="Comma-separated values"
      />
    )
  }

  if (!Array.isArray(value)) return <span>{value}</span>
  return (
    <div className="flex flex-wrap gap-1">
      {value.map((item, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {item}
        </Badge>
      ))}
    </div>
  )
}

const JSONCellRenderer = ({
  value,
  isEditing,
  onChange,
}: { value: any; isEditing: boolean; onChange?: (value: string) => void }) => {
  if (isEditing) {
    return (
      <Textarea
        defaultValue={typeof value === "object" ? JSON.stringify(value, null, 2) : value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full min-h-[60px]"
        placeholder="JSON object"
      />
    )
  }

  if (typeof value !== "object" || value === null) return <span>{value}</span>
  return (
    <div className="text-xs font-mono bg-muted p-1 rounded max-w-[200px] overflow-hidden">
      {JSON.stringify(value, null, 2).substring(0, 50)}...
    </div>
  )
}

const clientColumns = [
  { field: "ClientID", header: "Client ID" },
  { field: "ClientName", header: "Client Name" },
  { field: "PriorityLevel", header: "Priority" },
  { field: "RequestedTaskIDs", header: "Requested Tasks" },
  { field: "GroupTag", header: "Group" },
  { field: "AttributesJSON", header: "Attributes" },
]

const workerColumns = [
  { field: "WorkerID", header: "Worker ID" },
  { field: "WorkerName", header: "Worker Name" },
  { field: "Skills", header: "Skills" },
  { field: "AvailableSlots", header: "Available Slots" },
  { field: "MaxLoadPerPhase", header: "Max Load" },
  { field: "WorkerGroup", header: "Group" },
  { field: "QualificationLevel", header: "Qualification" },
]

const taskColumns = [
  { field: "TaskID", header: "Task ID" },
  { field: "TaskName", header: "Task Name" },
  { field: "Category", header: "Category" },
  { field: "Duration", header: "Duration" },
  { field: "RequiredSkills", header: "Required Skills" },
  { field: "PreferredPhases", header: "Preferred Phases" },
  { field: "MaxConcurrent", header: "Max Concurrent" },
]

export function DataGrid({ entityType }: DataGridProps) {
  const {
    clients,
    workers,
    tasks,
    updateClient,
    updateWorker,
    updateTask,
    validationErrors,
    addClient,
    addWorker,
    addTask,
  } = useDataStore()
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [editValue, setEditValue] = useState("")

  const hasValidationError = (entityType: string, entityId: string, field: string) => {
    return validationErrors.some(
      (error) => error.entity === entityType && error.field === field && error.message.includes(entityId),
    )
  }

  const startEdit = (rowId: string, field: string, currentValue: any) => {
    setEditingCell({ rowId, field })
    if (Array.isArray(currentValue)) {
      setEditValue(currentValue.join(", "))
    } else if (typeof currentValue === "object") {
      setEditValue(JSON.stringify(currentValue, null, 2))
    } else {
      setEditValue(currentValue?.toString() || "")
    }
  }

  const saveEdit = (entityType: EntityType, rowId: string, field: string) => {
    let processedValue = editValue

    // Process array fields
    if (field.includes("Skills") || field.includes("Slots") || field.includes("Phases") || field.includes("TaskIDs")) {
      if (field.includes("Slots") || field.includes("Phases")) {
        processedValue = editValue
          .split(",")
          .map((s) => Number.parseInt(s.trim()))
          .filter((n) => !isNaN(n))
      } else {
        processedValue = editValue
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      }
    }

    // Process JSON fields
    if (field.includes("JSON") || field.includes("Attributes")) {
      try {
        processedValue = JSON.parse(editValue)
      } catch {
        processedValue = editValue
      }
    }

    // Process number fields
    if (
      field.includes("Level") ||
      field.includes("Duration") ||
      field.includes("Load") ||
      field.includes("Concurrent")
    ) {
      const num = Number.parseFloat(editValue)
      if (!isNaN(num)) {
        processedValue = num
      }
    }

    // Update the appropriate entity
    if (entityType === "clients") {
      updateClient(rowId, { [field]: processedValue })
    } else if (entityType === "workers") {
      updateWorker(rowId, { [field]: processedValue })
    } else if (entityType === "tasks") {
      updateTask(rowId, { [field]: processedValue })
    }

    setEditingCell(null)
    setEditValue("")
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const addNewRow = (entityType: EntityType) => {
    if (entityType === "clients") {
      const newId = `CLIENT_${Date.now()}`
      addClient({
        ClientID: newId,
        ClientName: "New Client",
        PriorityLevel: 5,
        RequestedTaskIDs: [],
        GroupTag: "",
        AttributesJSON: {},
      })
    } else if (entityType === "workers") {
      const newId = `WORKER_${Date.now()}`
      addWorker({
        WorkerID: newId,
        WorkerName: "New Worker",
        Skills: [],
        AvailableSlots: [],
        MaxLoadPerPhase: 10,
        WorkerGroup: "",
        QualificationLevel: 3,
      })
    } else if (entityType === "tasks") {
      const newId = `TASK_${Date.now()}`
      addTask({
        TaskID: newId,
        TaskName: "New Task",
        Category: "",
        Duration: 1,
        RequiredSkills: [],
        PreferredPhases: [],
        MaxConcurrent: 1,
      })
    }
  }

  const exportData = (entityType: EntityType) => {
    let data: any[] = []
    let filename = ""

    if (entityType === "clients") {
      data = clients
      filename = "clients.csv"
    } else if (entityType === "workers") {
      data = workers
      filename = "workers.csv"
    } else if (entityType === "tasks") {
      data = tasks
      filename = "tasks.csv"
    }

    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (Array.isArray(value)) return `"${value.join("; ")}"`
            if (typeof value === "object") return `"${JSON.stringify(value)}"`
            return `"${value}"`
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderCell = (row: any, field: string, entityType: EntityType) => {
    const isEditing = editingCell?.rowId === row[Object.keys(row)[0]] && editingCell?.field === field
    const hasError = hasValidationError(entityType, row[Object.keys(row)[0]], field)
    const value = row[field]

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          {field.includes("Skills") ||
          field.includes("Slots") ||
          field.includes("Phases") ||
          field.includes("TaskIDs") ? (
            <ArrayCellRenderer value={value} isEditing={true} onChange={setEditValue} />
          ) : field.includes("JSON") || field.includes("Attributes") ? (
            <JSONCellRenderer value={value} isEditing={true} onChange={setEditValue} />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full"
              type={
                field.includes("Level") ||
                field.includes("Duration") ||
                field.includes("Load") ||
                field.includes("Concurrent")
                  ? "number"
                  : "text"
              }
            />
          )}
          <Button size="sm" onClick={() => saveEdit(entityType, row[Object.keys(row)[0]], field)}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={cancelEdit}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )
    }

    return (
      <div
        className={`flex items-center justify-between group cursor-pointer p-2 rounded ${hasError ? "bg-red-50 border-l-2 border-red-500" : ""}`}
        onClick={() => startEdit(row[Object.keys(row)[0]], field, value)}
      >
        <div className="flex-1">
          {field.includes("Skills") ||
          field.includes("Slots") ||
          field.includes("Phases") ||
          field.includes("TaskIDs") ? (
            <ArrayCellRenderer value={value} isEditing={false} />
          ) : field.includes("JSON") || field.includes("Attributes") ? (
            <JSONCellRenderer value={value} isEditing={false} />
          ) : (
            <span>{value}</span>
          )}
        </div>
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  const renderTable = (data: any[], entityType: EntityType, columns: { field: string; header: string }[]) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No data available. Upload a file or add a new row to get started.
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted">
              {columns.map((col) => (
                <th key={col.field} className="border border-border p-2 text-left font-medium">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row[Object.keys(row)[0]] || index} className="hover:bg-muted/50">
                {columns.map((col) => (
                  <td key={col.field} className="border border-border min-w-[120px]">
                    {renderCell(row, col.field, entityType)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const getData = () => {
    switch (entityType) {
      case "clients":
        return { data: clients, columns: clientColumns }
      case "workers":
        return { data: workers, columns: workerColumns }
      case "tasks":
        return { data: tasks, columns: taskColumns }
      default:
        return { data: [], columns: [] }
    }
  }

  const { data, columns } = getData()

  const getEntityTitle = () => {
    switch (entityType) {
      case "clients":
        return "Clients Data"
      case "workers":
        return "Workers Data"
      case "tasks":
        return "Tasks Data"
      default:
        return "Data"
    }
  }

  const getAddButtonText = () => {
    switch (entityType) {
      case "clients":
        return "Add Client"
      case "workers":
        return "Add Worker"
      case "tasks":
        return "Add Task"
      default:
        return "Add Row"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {getEntityTitle()} ({data.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addNewRow(entityType)}>
              <Plus className="h-4 w-4 mr-2" />
              {getAddButtonText()}
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData(entityType)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>{renderTable(data, entityType, columns)}</CardContent>
    </Card>
  )
}
