"use client"

import type React from "react"

import { useCallback, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useDataStore } from "@/store/data-context"
import type { EntityType, FileUploadResult } from "@/lib/types"

interface FileUploadProps {
  onValidationComplete?: () => void
}

type UploadStage = "idle" | "uploading" | "ai-processing" | "manual-fallback" | "validating" | "complete"

export function FileUploader({ onValidationComplete }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState<UploadStage>("idle")
  const [currentFileName, setCurrentFileName] = useState<string>("")
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; type: EntityType; status: string; aiUsed: boolean }>
  >([])
  const [isValidating, setIsValidating] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const { setData, setLoading, setCurrentFile, setValidationErrors, clients, workers, tasks } = useDataStore()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const getStageMessage = (stage: UploadStage, fileName: string) => {
    switch (stage) {
      case "uploading":
        return `Uploading ${fileName}...`
      case "ai-processing":
        return `Processing ${fileName} with AI enhancement...`
      case "manual-fallback":
        return `AI unavailable, using manual processing for ${fileName}...`
      case "validating":
        return "Running comprehensive validation..."
      case "complete":
        return "Upload complete!"
      default:
        return ""
    }
  }

  const getStageProgress = (stage: UploadStage, baseProgress: number) => {
    switch (stage) {
      case "uploading":
        return baseProgress * 0.3 // 30% for upload
      case "ai-processing":
        return 30 + baseProgress * 0.4 // 30-70% for AI processing
      case "manual-fallback":
        return 30 + baseProgress * 0.4 // 30-70% for manual processing
      case "validating":
        return 70 + baseProgress * 0.3 // 70-100% for validation
      case "complete":
        return 100
      default:
        return 0
    }
  }

  const runComprehensiveValidation = async () => {
    if (clients.length === 0 && workers.length === 0 && tasks.length === 0) {
      return
    }

    setIsValidating(true)
    setCurrentStage("validating")
    setUploadProgress(70)

    try {
      const response = await fetch("/api/validate/comprehensive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clients, workers, tasks }),
      })

      for (let i = 70; i <= 100; i += 10) {
        setUploadProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (response.ok) {
        const result = await response.json()
        setValidationErrors(result.errors || [])
        onValidationComplete?.()

        if (result.errors && result.errors.length > 0) {
          toast({
            variant: "destructive",
            title: "Validation Issues Found",
            description: `Found ${result.errors.length} validation issues. Check the Validation tab for details.`,
          })
        } else {
          toast({
            title: "Validation Complete",
            description: "All data passed validation successfully!",
          })
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: "Failed to run comprehensive validation. Please try again.",
      })
    } finally {
      setIsValidating(false)
      setCurrentStage("complete")
      setTimeout(() => {
        setCurrentStage("idle")
        setUploadProgress(0)
      }, 2000)
    }
  }

  const processFile = async (file: File): Promise<FileUploadResult> => {
    const formData = new FormData()
    formData.append("file", file)

    setCurrentFileName(file.name)
    setCurrentStage("uploading")
    setUploadProgress(10)

    try {
      // Simulate upload progress
      for (let i = 10; i <= 30; i += 5) {
        setUploadProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      setCurrentStage("ai-processing")
      setUploadProgress(40)

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      })

      // Simulate AI processing progress
      for (let i = 40; i <= 70; i += 10) {
        setUploadProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 150))
      }

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.error && (result.error.includes("quota") || result.error.includes("rate limit"))) {
        toast({
          title: "AI Processing Quota Exceeded",
          description:
            "AI-enhanced file processing is temporarily unavailable due to quota limits. File processed with basic mapping instead.",
          variant: "destructive",
        })
        setCurrentStage("manual-fallback")
      } else if (!result.aiMappingUsed) {
        setCurrentStage("manual-fallback")
        // Brief pause to show manual fallback message
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed"

      if (errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
        toast({
          title: "AI Quota Exceeded",
          description:
            "AI file processing quota exceeded. Files will be processed with basic mapping. Please try again later or upgrade your plan.",
          variant: "destructive",
        })
        setCurrentStage("manual-fallback")
      }

      return {
        success: false,
        errors: [errorMessage],
      }
    }
  }

  const handleFiles = useCallback(
    async (files: File[]) => {
      const validFiles = files.filter((file) => {
        const validTypes = [
          "text/csv",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ]
        return (
          validTypes.includes(file.type) ||
          file.name.endsWith(".csv") ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls")
        )
      })

      if (validFiles.length === 0) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload CSV or Excel files only.",
        })
        return
      }

      setLoading(true)
      setUploadProgress(0)
      setCurrentStage("idle")

      const newUploadedFiles: Array<{ name: string; type: EntityType; status: string; aiUsed: boolean }> = []
      let hasErrors = false
      let hasQuotaErrors = false

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]

        const result = await processFile(file)

        if (result.success && result.data && result.entityType) {
          setData(result.entityType, result.data)
          setCurrentFile(file.name)
          newUploadedFiles.push({
            name: file.name,
            type: result.entityType,
            status: "success",
            aiUsed: 'aiMappingUsed' in result ? Boolean((result as any).aiMappingUsed) : false,
          })

          const processingMethod = 'aiMappingUsed' in result && result.aiMappingUsed ? "AI-enhanced mapping" : "basic mapping"
          const quotaNote = result.errors && Array.isArray(result.errors) && result.errors.some(e => e.includes("quota")) ? " (AI quota reached)" : ""

          toast({
            title: "File Uploaded Successfully",
            description: `${file.name} processed as ${result.entityType} data (${processingMethod}${quotaNote})`,
          })
        } else {
          hasErrors = true
          const errorMessage = result.errors?.join(", ") || "Unknown error occurred"
          if (result.errors && Array.isArray(result.errors) && result.errors.some(e => e.includes("quota") || e.includes("rate limit"))) {
            hasQuotaErrors = true
          }

          newUploadedFiles.push({
            name: file.name,
            type: "clients", // fallback
            status: "error",
            aiUsed: false,
          })

          toast({
            variant: "destructive",
            title: "File Upload Failed",
            description: `${file.name}: ${errorMessage}`,
          })
        }
      }

      setUploadedFiles((prev) => [...prev, ...newUploadedFiles])
      setLoading(false)

      if (!hasErrors) {
        const quotaMessage = hasQuotaErrors ? " Note: AI processing was limited due to quota restrictions." : ""
        toast({
          title: "All Files Uploaded",
          description: `Successfully processed ${validFiles.length} file(s). Running validation...${quotaMessage}`,
        })
      } else if (hasQuotaErrors) {
        toast({
          title: "AI Processing Limited",
          description:
            "Some files were processed with basic mapping due to AI quota limits. Consider upgrading your plan for enhanced AI features.",
          variant: "destructive",
        })
      }

      setTimeout(() => {
        runComprehensiveValidation()
      }, 500)
    },
    [setData, setLoading, setCurrentFile, setValidationErrors, onValidationComplete, clients, workers, tasks, toast],
  )

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setUploadedFiles([])
    setUploadProgress(0)
    setCurrentStage("idle")
  }

  return (
    <div className="space-y-4" data-tour="file-upload">
      <Card>
        <CardContent className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            {isDragOver ? (
              <p className="text-lg">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop your CSV or XLSX files here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to select files</p>
                <Button variant="outline">Select Files</Button>
              </div>
            )}
          </div>

          {currentStage !== "idle" && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{getStageMessage(currentStage, currentFileName)}</p>
                <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />

              {/* Stage indicators */}
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span className={currentStage === "uploading" ? "text-blue-600 font-medium" : ""}>Upload</span>
                <span className={currentStage === "ai-processing" ? "text-purple-600 font-medium" : ""}>
                  AI Processing
                </span>
                <span className={currentStage === "manual-fallback" ? "text-orange-600 font-medium" : ""}>
                  Manual Fallback
                </span>
                <span className={currentStage === "validating" ? "text-green-600 font-medium" : ""}>Validation</span>
              </div>
            </div>
          )}

          {(clients.length > 0 || workers.length > 0 || tasks.length > 0) && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={runComprehensiveValidation}
                disabled={isValidating}
                variant="outline"
                className="w-full bg-transparent"
              >
                {isValidating ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Running Comprehensive Validation...
                  </>
                ) : (
                  <>
                    <div className="h-4 w-4 mr-2">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Run Comprehensive Validation
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Uploaded Files</h3>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <span className="font-medium">{file.name}</span>
                    <Badge variant={file.status === "success" ? "default" : "destructive"}>{file.type}</Badge>
                    {file.status === "success" && (
                      <Badge variant={file.aiUsed ? "secondary" : "outline"} className="text-xs">
                        {file.aiUsed ? "🤖 AI Enhanced" : "📝 Manual"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === "success" ? (
                      <div className="h-4 w-4 text-green-500">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-red-500" />
                    )}
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <div className="h-4 w-4">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        <p className="mb-2">Supported file types: CSV, XLSX, XLS</p>
        <p>Expected file naming: clients.csv, workers.csv, tasks.csv (or similar patterns)</p>
        <p className="text-xs mt-2 text-blue-600">
          ✨ AI-enhanced header mapping automatically detects column meanings
        </p>
        <p className="text-xs mt-1 text-orange-600">
          ⚠️ AI features may be limited by usage quotas - files will fallback to manual processing if needed
        </p>
      </div>
    </div>
  )
}
