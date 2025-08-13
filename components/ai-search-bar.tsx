"use client"

import { useState } from "react"
import { Search, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function AISearchBar() {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<string>("")

  const { toast } = useToast()

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      const data = await response.json()
      setResults(data.result)

      if (data.result?.includes("quota exceeded") || data.result?.includes("rate limit")) {
        toast({
          title: "AI Search Unavailable",
          description: "AI search is temporarily unavailable due to quota limits. Please try again later.",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      if (errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
        toast({
          title: "AI Quota Exceeded",
          description: "AI search quota exceeded. Please try again later or upgrade your plan.",
          variant: "destructive",
        })
        setResults("AI search temporarily unavailable due to quota limits.")
      } else {
        toast({
          title: "Search Failed",
          description: "Error processing your AI search query.",
          variant: "destructive",
        })
        setResults("Error processing your query. Please try again.")
      }
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="🤖 Ask AI about your data..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4"
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSearching ? <div className="animate-pulse">🤖</div> : <Sparkles className="h-4 w-4" />}
        </Button>
      </div>

      {results && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-purple-600">🤖</span>
            <p className="text-sm text-purple-800">{results}</p>
          </div>
        </div>
      )}
    </div>
  )
}
