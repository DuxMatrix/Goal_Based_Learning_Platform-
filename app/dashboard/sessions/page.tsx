"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SessionSummary } from "@/components/ui/session-summary"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  BookOpen, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Star,
  TrendingUp,
  Eye,
  RefreshCw
} from "lucide-react"
import { api } from "@/lib/api"

interface SessionSummaryData {
  _id: string
  title: string
  focusArea: string
  duration: {
    totalMinutes: number
    startTime: string
    endTime?: string
  }
  status: string
  createdAt: string
  summary: {
    keyTopics: string[]
    mainQuestions: string[]
    nextSteps: string[]
    resources: string[]
    learningPoints: string[]
    actionItems: string[]
    conceptsLearned: string[]
    areasForImprovement: string[]
    confidenceLevel: number
    sessionRating: number
    generatedAt: string
  }
  goal: {
    _id: string
    title: string
    description: string
  }
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummaryData[]>([])
  const [filteredSessions, setFilteredSessions] = useState<SessionSummaryData[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionSummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [currentPage])

  useEffect(() => {
    filterAndSortSessions()
  }, [sessions, searchTerm, filterBy, sortBy])

  const loadSessions = async () => {
    try {
      setIsLoading(true)
      const response = await api.getSessionSummaries({
        limit: 20,
        page: currentPage
      })
      
      if (response.success) {
        setSessions(response.data.sessions)
        setTotalPages(response.data.pagination.total)
      }
    } catch (error) {
      console.error("Error loading sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortSessions = () => {
    let filtered = [...sessions]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.focusArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.goal.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (filterBy !== "all") {
      filtered = filtered.filter(session => session.focusArea === filterBy)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "duration":
          return b.duration.totalMinutes - a.duration.totalMinutes
        case "rating":
          return b.summary.sessionRating - a.summary.sessionRating
        case "confidence":
          return b.summary.confidenceLevel - a.summary.confidenceLevel
        default:
          return 0
      }
    })

    setFilteredSessions(filtered)
  }

  const handleRegenerateSummary = async (sessionId: string) => {
    try {
      setIsRegenerating(true)
      const response = await api.regenerateSessionSummary(sessionId)
      
      if (response.success) {
        // Reload sessions to get updated summary
        await loadSessions()
        
        // Update selected session if it's the one being regenerated
        if (selectedSession && selectedSession._id === sessionId) {
          const updatedSession = sessions.find(s => s._id === sessionId)
          if (updatedSession) {
            setSelectedSession(updatedSession)
          }
        }
      }
    } catch (error) {
      console.error("Error regenerating summary:", error)
    } finally {
      setIsRegenerating(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getConfidenceColor = (level: number) => {
    if (level >= 8) return "text-green-600"
    if (level >= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ))
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Session Summaries
          </h1>
          <p className="text-muted-foreground mt-1">
            Review your learning sessions and track your progress
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by focus area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Focus Areas</SelectItem>
                <SelectItem value="theory">Theory</SelectItem>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="qna">Q&A</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="confidence">Confidence</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSessions.map((session) => (
          <Card key={session._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">
                    {session.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {session.goal.title}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {session.focusArea}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Session Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{formatDuration(session.duration.totalMinutes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className={getConfidenceColor(session.summary.confidenceLevel)}>
                    {session.summary.confidenceLevel}/10
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {getRatingStars(session.summary.sessionRating)}
                </div>
              </div>

              {/* Key Topics Preview */}
              {session.summary.keyTopics.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Key Topics:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {session.summary.keyTopics.slice(0, 3).map((topic, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {session.summary.keyTopics.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{session.summary.keyTopics.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    onClick={() => setSelectedSession(session)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Summary
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Session Summary</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[70vh] pr-4">
                    {selectedSession && (
                      <SessionSummary
                        session={selectedSession}
                        summary={selectedSession.summary}
                        onRegenerate={() => handleRegenerateSummary(selectedSession._id)}
                        isLoading={isRegenerating}
                      />
                    )}
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSessions.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterBy !== "all" 
                ? "Try adjusting your search or filters"
                : "Complete some tutoring sessions to see summaries here"
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
