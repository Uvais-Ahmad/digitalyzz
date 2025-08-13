"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileText, Package, Loader2, Settings } from "lucide-react"
import { useDataStore } from "@/store/data-context"

export function ExportPanel() {
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "xlsx" | "json">("csv")
  const [selectedEntities, setSelectedEntities] = useState<string[]>(["clients", "workers", "tasks"])
  const [includeRules, setIncludeRules] = useState(true)
  const [includeValidation, setIncludeValidation] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const { clients, workers, tasks, rules, validationErrors } = useDataStore()

  const entityOptions = [
    { id: "clients", label: "Clients", count: clients.length },
    { id: "workers", label: "Workers", count: workers.length },
    { id: "tasks", label: "Tasks", count: tasks.length },
  ]

  const handleEntityToggle = (entityId: string, checked: boolean) => {
    if (checked) {
      setSelectedEntities((prev) => [...prev, entityId])
    } else {
      setSelectedEntities((prev) => prev.filter((id) => id !== entityId))
    }
  }

  const exportSingleEntity = async (entityType: string) => {
    const data = {
      clients,
      workers,
      tasks,
    }

    const entityData = data[entityType as keyof typeof data]
    if (!entityData || entityData.length === 0) {
      alert(`No ${entityType} data to export`)
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exportType: selectedFormat,
          data: {
            entityType,
            records: entityData,
          },
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download =
          response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") ||
          `${entityType}.${selectedFormat}`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const exportRules = async () => {
    if (rules.length === 0) {
      alert("No rules to export")
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exportType: "json",
          data: {
            rules,
            metadata: {
              totalRules: rules.length,
              enabledRules: rules.filter((r) => r.enabled).length,
              ruleTypes: [...new Set(rules.map((r) => r.type))],
              exportDate: new Date().toISOString(),
            },
          },
          options: { filename: "rules" },
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download =
          response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "rules.json"
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Rules export failed:", error)
      alert("Rules export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const exportValidationReport = async () => {
    if (validationErrors.length === 0) {
      alert("No validation errors to export")
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exportType: "json",
          data: {
            validationReport: {
              summary: {
                totalErrors: validationErrors.length,
                errorCount: validationErrors.filter((e) => e.severity === "error").length,
                warningCount: validationErrors.filter((e) => e.severity === "warning").length,
              },
              errors: validationErrors,
              exportDate: new Date().toISOString(),
            },
          },
          options: { filename: "validation_report" },
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download =
          response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") ||
          "validation_report.json"
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Validation report export failed:", error)
      alert("Validation report export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const exportAll = async () => {
    const hasData = clients.length > 0 || workers.length > 0 || tasks.length > 0
    if (!hasData) {
      alert("No data to export")
      return
    }

    setIsExporting(true)
    try {
      const exportData: any = {}

      if (selectedEntities.includes("clients")) exportData.clients = clients
      if (selectedEntities.includes("workers")) exportData.workers = workers
      if (selectedEntities.includes("tasks")) exportData.tasks = tasks
      if (includeRules) exportData.rules = rules
      if (includeValidation) exportData.validationErrors = validationErrors

      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exportType: "zip",
          data: exportData,
          options: {
            format: selectedFormat,
            includeRules,
            includeValidation,
          },
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download =
          response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "export.zip"
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Export all failed:", error)
      alert("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const totalRecords = clients.length + workers.length + tasks.length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <Select value={selectedFormat} onValueChange={(value: any) => setSelectedFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Summary</label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{totalRecords} total records</Badge>
                <Badge variant="outline">{rules.length} rules</Badge>
                <Badge variant="outline">{validationErrors.length} validation issues</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Select Data to Export</label>
            {entityOptions.map((entity) => (
              <div key={entity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={entity.id}
                  checked={selectedEntities.includes(entity.id)}
                  onCheckedChange={(checked) => handleEntityToggle(entity.id, checked as boolean)}
                />
                <label htmlFor={entity.id} className="text-sm flex items-center gap-2">
                  {entity.label}
                  <Badge variant="secondary">{entity.count} records</Badge>
                </label>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Additional Options</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="rules" checked={includeRules} onCheckedChange={setIncludeRules} />
                <label htmlFor="rules" className="text-sm flex items-center gap-2">
                  Include Rules Configuration
                  <Badge variant="secondary">{rules.length} rules</Badge>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="validation" checked={includeValidation} onCheckedChange={setIncludeValidation} />
                <label htmlFor="validation" className="text-sm flex items-center gap-2">
                  Include Validation Report
                  <Badge variant="secondary">{validationErrors.length} issues</Badge>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Export Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entityOptions.map((entity) => (
              <Button
                key={entity.id}
                variant="outline"
                onClick={() => exportSingleEntity(entity.id)}
                disabled={isExporting || entity.count === 0}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export {entity.label}
                <Badge variant="secondary" className="ml-auto">
                  {entity.count}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={exportRules}
              disabled={isExporting || rules.length === 0}
              className="flex items-center gap-2 bg-transparent"
            >
              <Settings className="h-4 w-4" />
              Export Rules
              <Badge variant="secondary" className="ml-auto">
                {rules.length}
              </Badge>
            </Button>

            <Button
              variant="outline"
              onClick={exportValidationReport}
              disabled={isExporting || validationErrors.length === 0}
              className="flex items-center gap-2 bg-transparent"
            >
              <FileText className="h-4 w-4" />
              Export Validation Report
              <Badge variant="secondary" className="ml-auto">
                {validationErrors.length}
              </Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Complete Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalRecords === 0 && (
            <Alert>
              <AlertDescription>Upload some data first to enable export functionality.</AlertDescription>
            </Alert>
          )}

          <Button onClick={exportAll} disabled={isExporting || totalRecords === 0} className="w-full" size="lg">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Export All as ZIP
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Downloads a ZIP file containing all selected data, rules, and validation reports
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
