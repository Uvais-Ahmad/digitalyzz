"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, AlertTriangle, CheckCircle, Lightbulb } from "lucide-react"
import { useDataStore } from "@/store/data-context"

export function ValidationPanel() {
  const { validationErrors, clearValidationErrors } = useDataStore()

  const errorCount = validationErrors.filter((e) => e.severity === "error").length
  const warningCount = validationErrors.filter((e) => e.severity === "warning").length

  if (validationErrors.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-center py-8">
            <div>
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Good!</h3>
              <p className="text-muted-foreground">No validation errors found in your data.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Validation Results
            <div className="flex gap-2">
              {errorCount > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errorCount} errors
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {warningCount} warnings
                </Badge>
              )}
            </div>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={clearValidationErrors}>
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {validationErrors.map((error) => (
          <Alert key={error.id} variant={error.severity === "error" ? "destructive" : "default"}>
            {error.severity === "error" ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {error.entity}
                  </Badge>
                  {error.field && (
                    <Badge variant="outline" className="text-xs">
                      {error.field}
                    </Badge>
                  )}
                </div>
                <p className="font-medium">{error.message}</p>
                {error.suggestions && error.suggestions.length > 0 && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-1 mb-1">
                      <Lightbulb className="h-3 w-3" />
                      <span className="text-xs font-medium">Suggestions:</span>
                    </div>
                    <ul className="text-xs space-y-1">
                      {error.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span>•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
