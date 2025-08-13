"use client"

import { useDataStore } from "@/store/data-context"
import { CheckCircle, AlertCircle, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ExportStatus() {
  const { clients, workers, tasks, rules, validationResults } = useDataStore()

  const hasData = (clients?.length || 0) > 0 || (workers?.length || 0) > 0 || (tasks?.length || 0) > 0
  const hasValidData = (validationResults?.length || 0) === 0
  const hasRules = (rules?.length || 0) > 0
  const isReady = hasData && hasValidData && hasRules

  const handleExport = async () => {
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "all" }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "data-alchemist-export.zip"
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${isReady ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Download className="h-4 w-4" />
        {isReady ? "📤 EXPORT READY" : "📤 EXPORT PENDING"}
      </h3>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center gap-2">
          {hasValidData ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <span>Data validated ({validationResults?.length || 0} errors)</span>
        </div>

        <div className="flex items-center gap-2">
          {hasRules ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-gray-400" />
          )}
          <span>Rules configured ({rules?.length || 0} active)</span>
        </div>

        <div className="flex items-center gap-2">
          {hasRules ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-gray-400" />
          )}
          <span>Weights set (Custom profile)</span>
        </div>
      </div>

      {isReady && (
        <>
          <div className="text-xs text-gray-600 mb-3">
            <p className="font-medium mb-1">Export includes:</p>
            <ul className="space-y-1 ml-2">
              <li className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                clients_clean.csv ({clients?.length || 0} rows)
              </li>
              <li className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                workers_clean.csv ({workers?.length || 0} rows)
              </li>
              <li className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                tasks_clean.csv ({tasks?.length || 0} rows)
              </li>
              <li className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                rules.json ({rules?.length || 0} rules, weights)
              </li>
            </ul>
          </div>

          <Button onClick={handleExport} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
            🚀 EXPORT ALL
          </Button>
        </>
      )}
    </div>
  )
}
