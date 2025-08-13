"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploader } from "@/components/file-uploader"
import { ValidationPanel } from "@/components/validation-panel"
import { DataGrid } from "@/components/data-grid"
import { AIQueryPanel } from "@/components/ai-query-panel"
import { AICorrectionsPanel } from "@/components/ai-corrections-panel"
import { AIModificationPanel } from "@/components/ai-modification-panel"
import { RuleBuilder } from "@/components/rule-builder"
import { NaturalLanguageRules } from "@/components/natural-language-rules"
import { AIRuleRecommendations } from "@/components/ai-rule-recommendations"
import { RuleManagement } from "@/components/rule-management"
import { ExportPanel } from "@/components/export-panel"
import { ProgressBar } from "@/components/progress-bar"
import { AISearchBar } from "@/components/ai-search-bar"
import { ImpactPreview } from "@/components/impact-preview"
import { ExportStatus } from "@/components/export-status"

interface LayoutProps {
  children?: ReactNode
}

const UploadIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
)

const DatabaseIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
    />
  </svg>
)

const AlertIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
)

const CpuIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
    />
  </svg>
)

const WrenchIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
)

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ProgressBar />

      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Digitalyzz</h1>
          <p className="text-lg text-gray-600">AI-Enhanced Resource Allocation & Data Processing</p>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <UploadIcon />
              Upload
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <DatabaseIcon />
              Data
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <AlertIcon />
              Validation
            </TabsTrigger>
            <TabsTrigger value="ai-query" className="flex items-center gap-2">
              <CpuIcon />
              AI Query
            </TabsTrigger>
            <TabsTrigger value="ai-corrections" className="flex items-center gap-2">
              <WrenchIcon />
              AI Corrections
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <SettingsIcon />
              Rules
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <DownloadIcon />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>File Upload</CardTitle>
                <CardDescription>Upload CSV or XLSX files containing client, worker, and task data</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Data Search</CardTitle>
                <CardDescription>Ask questions about your data in natural language</CardDescription>
              </CardHeader>
              <CardContent>
                <AISearchBar />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>View and edit your uploaded data</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="clients" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="clients">Clients</TabsTrigger>
                    <TabsTrigger value="workers">Workers</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  </TabsList>
                  <TabsContent value="clients" className="mt-4">
                    <DataGrid entityType="clients" />
                  </TabsContent>
                  <TabsContent value="workers" className="mt-4">
                    <DataGrid entityType="workers" />
                  </TabsContent>
                  <TabsContent value="tasks" className="mt-4">
                    <DataGrid entityType="tasks" />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation" className="space-y-6">
            <ValidationPanel />
          </TabsContent>

          <TabsContent value="ai-query" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIQueryPanel />
              <AIModificationPanel />
            </div>
          </TabsContent>

          <TabsContent value="ai-corrections" className="space-y-6">
            <AICorrectionsPanel />
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Natural Language Rules</CardTitle>
                    <CardDescription>Create rules using plain English</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NaturalLanguageRules />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rule Builder</CardTitle>
                    <CardDescription>Create structured business rules</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RuleBuilder />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Rule Recommendations</CardTitle>
                    <CardDescription>Get intelligent rule suggestions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AIRuleRecommendations />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Impact Preview</CardTitle>
                    <CardDescription>See how rules affect your allocation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImpactPreview />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rule Management</CardTitle>
                    <CardDescription>Manage and organize your rules</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RuleManagement />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <ExportStatus />

            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>Download your processed data and configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <ExportPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
