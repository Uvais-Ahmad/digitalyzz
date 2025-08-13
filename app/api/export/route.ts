import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import JSZip from "jszip"

export async function POST(request: NextRequest) {
  try {
    const { exportType, data, options } = await request.json()

    switch (exportType) {
      case "csv":
        return exportCSV(data, options)
      case "xlsx":
        return exportXLSX(data, options)
      case "json":
        return exportJSON(data, options)
      case "zip":
        return exportZip(data, options)
      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

async function exportCSV(data: any, options: any) {
  const { entityType, records } = data

  if (!records || records.length === 0) {
    return NextResponse.json({ error: "No data to export" }, { status: 400 })
  }

  // Convert to CSV
  const headers = Object.keys(records[0])
  const csvContent = [
    headers.join(","),
    ...records.map((row: any) =>
      headers
        .map((header) => {
          let value = row[header]
          if (Array.isArray(value)) {
            value = value.join(";")
          } else if (typeof value === "object" && value !== null) {
            value = JSON.stringify(value)
          }
          return `"${String(value).replace(/"/g, '""')}"`
        })
        .join(","),
    ),
  ].join("\n")

  const filename = `${entityType}_${new Date().toISOString().split("T")[0]}.csv`

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

async function exportXLSX(data: any, options: any) {
  const { entityType, records } = data

  if (!records || records.length === 0) {
    return NextResponse.json({ error: "No data to export" }, { status: 400 })
  }

  // Create workbook
  const workbook = XLSX.utils.book_new()

  // Convert arrays and objects to strings for Excel compatibility
  const processedRecords = records.map((row: any) => {
    const processedRow: any = {}
    Object.keys(row).forEach((key) => {
      let value = row[key]
      if (Array.isArray(value)) {
        value = value.join("; ")
      } else if (typeof value === "object" && value !== null) {
        value = JSON.stringify(value)
      }
      processedRow[key] = value
    })
    return processedRow
  })

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(processedRecords)

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, entityType)

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

  const filename = `${entityType}_${new Date().toISOString().split("T")[0]}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

async function exportJSON(data: any, options: any) {
  const jsonContent = JSON.stringify(data, null, 2)
  const filename = `${options.filename || "export"}_${new Date().toISOString().split("T")[0]}.json`

  return new NextResponse(jsonContent, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

async function exportZip(data: any, options: any) {
  const zip = new JSZip()
  const timestamp = new Date().toISOString().split("T")[0]

  // Add data files
  if (data.clients && data.clients.length > 0) {
    const csvContent = generateCSVContent(data.clients)
    zip.file(`clients_${timestamp}.csv`, csvContent)
  }

  if (data.workers && data.workers.length > 0) {
    const csvContent = generateCSVContent(data.workers)
    zip.file(`workers_${timestamp}.csv`, csvContent)
  }

  if (data.tasks && data.tasks.length > 0) {
    const csvContent = generateCSVContent(data.tasks)
    zip.file(`tasks_${timestamp}.csv`, csvContent)
  }

  // Add rules file
  if (data.rules && data.rules.length > 0) {
    zip.file(`rules_${timestamp}.json`, JSON.stringify(data.rules, null, 2))
  }

  // Add validation report
  if (data.validationErrors && data.validationErrors.length > 0) {
    const report = generateValidationReport(data.validationErrors)
    zip.file(`validation_report_${timestamp}.json`, JSON.stringify(report, null, 2))
  }

  // Add export metadata
  const metadata = {
    exportDate: new Date().toISOString(),
    dataStats: {
      clients: data.clients?.length || 0,
      workers: data.workers?.length || 0,
      tasks: data.tasks?.length || 0,
      rules: data.rules?.length || 0,
      validationErrors: data.validationErrors?.length || 0,
    },
    exportOptions: options,
  }
  zip.file(`export_metadata_${timestamp}.json`, JSON.stringify(metadata, null, 2))

  // Generate zip buffer
  const buffer = await zip.generateAsync({ type: "nodebuffer" })

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="data_alchemist_export_${timestamp}.zip"`,
    },
  })
}

function generateCSVContent(records: any[]): string {
  if (records.length === 0) return ""

  const headers = Object.keys(records[0])
  return [
    headers.join(","),
    ...records.map((row) =>
      headers
        .map((header) => {
          let value = row[header]
          if (Array.isArray(value)) {
            value = value.join(";")
          } else if (typeof value === "object" && value !== null) {
            value = JSON.stringify(value)
          }
          return `"${String(value).replace(/"/g, '""')}"`
        })
        .join(","),
    ),
  ].join("\n")
}

function generateValidationReport(errors: any[]) {
  const report = {
    summary: {
      totalErrors: errors.length,
      errorCount: errors.filter((e) => e.severity === "error").length,
      warningCount: errors.filter((e) => e.severity === "warning").length,
      byEntity: errors.reduce(
        (acc, error) => {
          acc[error.entity] = (acc[error.entity] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
      byType: errors.reduce(
        (acc, error) => {
          acc[error.type] = (acc[error.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    },
    errors: errors,
    recommendations: [
      "Review all errors marked as 'error' severity before proceeding",
      "Consider the suggestions provided for each validation issue",
      "Use the AI correction features for automated fixes",
    ],
  }

  return report
}
