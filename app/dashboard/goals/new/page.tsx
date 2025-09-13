"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ArrowLeft, Loader2, Target, Calendar, Lightbulb, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface GoalSuggestion {
  timeline: string
  milestones: string[]
  description: string
}

export default function NewGoalPage() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    timeline: "",
    customTimeline: "",
  })
  const [suggestion, setSuggestion] = useState<GoalSuggestion | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()

  const categories = [
    "Programming & Development",
    "Data Science & AI",
    "Design & Creative",
    "Business & Marketing",
    "Language Learning",
    "Science & Mathematics",
    "Personal Development",
    "Other",
  ]

  const timelineOptions = [
    { value: "6-weeks", label: "6 weeks - Quick skill" },
    { value: "3-months", label: "3 months - Solid foundation" },
    { value: "6-months", label: "6 months - Deep expertise" },
    { value: "custom", label: "Custom timeline" },
  ]

  const humanizeTimeline = (value: string, custom: string) => {
    if (value === "custom") return custom || "Custom"
    const found = timelineOptions.find((t) => t.value === value)
    return found ? found.label.split(" - ")[0] : value
  }

  const parseTimelineToUnits = (value: string, custom: string) => {
    // Map preset values to weeks
    if (value === "6-weeks") return { unit: "week", count: 6, label: "6 weeks" }
    if (value === "3-months") return { unit: "week", count: 12, label: "12 weeks" }
    if (value === "6-months") return { unit: "week", count: 24, label: "24 weeks" }

    // Try parsing custom like "8 weeks", "14 days", "3 months"
    const text = (custom || "").trim().toLowerCase()
    const match = text.match(/(\d+)\s*(day|days|week|weeks|month|months)/)
    if (match) {
      const n = Math.max(1, parseInt(match[1], 10))
      const u = match[2]
      if (u.startsWith("day")) return { unit: "day", count: n, label: `${n} ${n === 1 ? "day" : "days"}` }
      if (u.startsWith("week")) return { unit: "week", count: n, label: `${n} ${n === 1 ? "week" : "weeks"}` }
      // convert months to weeks (approx 4 weeks per month)
      return { unit: "week", count: n * 4, label: `${n} ${n === 1 ? "month" : "months"}` }
    }
    // Default to 6 weeks if unparsable
    return { unit: "week", count: 6, label: "6 weeks" }
  }

  const generatePhasedMilestones = (title: string, unit: "day" | "week", count: number) => {
    const topic = title.trim()

    // Generate weekly/bi-weekly chunks based on duration
    let chunkSize = 1
    let target = 8
    
    if (unit === "week") {
      // For weeks, create weekly or bi-weekly chunks
      if (count <= 4) {
        chunkSize = 1 // Weekly chunks
        target = count
      } else if (count <= 8) {
        chunkSize = 1 // Weekly chunks
        target = count
      } else if (count <= 16) {
        chunkSize = 2 // Bi-weekly chunks
        target = Math.ceil(count / 2)
      } else {
        chunkSize = 2 // Bi-weekly chunks
        target = Math.ceil(count / 2)
      }
    } else {
      // For days, convert to weekly chunks
      const weeks = Math.ceil(count / 7)
      if (weeks <= 4) {
        chunkSize = 1
        target = weeks
      } else if (weeks <= 8) {
        chunkSize = 1
        target = weeks
      } else {
        chunkSize = 2
        target = Math.ceil(weeks / 2)
      }
    }

    // Diverse, non-repeating themes with learning phases
    const themes = [
      `Foundations & Setup`,
      `Core Concepts & Theory`,
      `Hands‑on Practice`,
      `Mini Project Implementation`,
      `Advanced Patterns & Techniques`,
      `Deep Dive & Optimization`,
      `Tools & Ecosystem Mastery`,
      `Best Practices & Testing`,
      `Capstone Project Development`,
      `Real‑world Applications`,
      `Performance & Scaling`,
      `Review & Next Steps`,
    ]

    const milestones = []
    for (let i = 1; i <= target; i++) {
      const theme = themes[i - 1] || `Phase ${i}`
      const chunkLabel = chunkSize === 1 ? 
        (unit === "day" ? `Week ${i}` : `Week ${i}`) : 
        (unit === "day" ? `Weeks ${(i-1)*2 + 1}-${i*2}` : `Weeks ${(i-1)*2 + 1}-${i*2}`)
      
      milestones.push({
        id: `milestone-${i}`,
        title: `${chunkLabel}: ${theme}`,
        isCompleted: false,
        dependencies: i > 1 ? [`milestone-${i-1}`] : [],
        order: i,
        type: i <= 3 ? 'theory' : i <= 6 ? 'practice' : i <= 9 ? 'project' : 'assessment',
        estimatedDuration: chunkSize * (unit === "day" ? 7 : 1) * 2, // 2 hours per day/week
        learningObjectives: [
          `Master key concepts in ${theme.toLowerCase()}`,
          `Apply ${theme.toLowerCase()} through practical exercises`,
          `Build confidence with ${theme.toLowerCase()}`
        ],
        assessmentCriteria: [
          `Complete all ${theme.toLowerCase()} exercises`,
          `Demonstrate understanding through practical application`,
          `Show progress in ${theme.toLowerCase()} skills`
        ]
      })
    }
    return milestones
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const generateSuggestion = async () => {
    if (!formData.title || !formData.category) {
      setError("Please fill in the goal title and category first")
      return
    }

    setIsLoading(true)

    try {
      // Simulate AI suggestion generation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const timelineUnits = parseTimelineToUnits(formData.timeline, formData.customTimeline)
      const milestones = generatePhasedMilestones(formData.title || "Your Topic", timelineUnits.unit as any, timelineUnits.count)
      const mockSuggestion: GoalSuggestion = {
        timeline: timelineUnits.label,
        milestones,
        description: `A structured ${timelineUnits.label} learning path for ${formData.title.toLowerCase()} with ${milestones.length} clear ${timelineUnits.unit === "day" ? "daily" : "weekly"} milestones to build from fundamentals to mastery.`,
      }

      setSuggestion(mockSuggestion)
      setStep(2)
    } catch (err) {
      setError("Failed to generate suggestion. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const createGoal = async () => {
    setIsLoading(true)

    try {
      // Simulate goal creation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real app, this would save to database
      const timelineUnits = parseTimelineToUnits(formData.timeline, formData.customTimeline)
      const { unit, count } = timelineUnits
      const milestoneObjects = generatePhasedMilestones(formData.title, unit, count)

      const newGoal = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description || suggestion?.description || "",
        timeline: suggestion?.timeline || humanizeTimeline(formData.timeline, formData.customTimeline),
        category: formData.category,
        milestones: milestoneObjects,
        progress: 0,
        status: "active",
        createdAt: new Date().toISOString(),
      }

      // Save to localStorage for demo
      const existingGoals = JSON.parse(localStorage.getItem("goals") || "[]")
      localStorage.setItem("goals", JSON.stringify([...existingGoals, newGoal]))

      router.push("/dashboard")
    } catch (err) {
      setError("Failed to create goal. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-primary">LearnAI</span>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                1
              </div>
              <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Goal Details</span>
              <span>AI Suggestions</span>
            </div>
          </div>

          {step === 1 && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  Create Your Learning Goal
                </CardTitle>
                <CardDescription>
                  Tell us what you want to learn, and our AI will create a personalized learning journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">What do you want to learn? *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Machine Learning, React Development, Spanish Language"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Additional Details (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your current level, specific areas of interest, or what you hope to achieve..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Preferred Timeline *</Label>
                  <Select value={formData.timeline} onValueChange={(value) => handleInputChange("timeline", value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="How long do you want to spend?" />
                    </SelectTrigger>
                    <SelectContent>
                      {timelineOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.timeline === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="customTimeline">Custom Timeline</Label>
                    <Input
                      id="customTimeline"
                      placeholder="e.g., 8 weeks, 1 year"
                      value={formData.customTimeline}
                      onChange={(e) => handleInputChange("customTimeline", e.target.value)}
                    />
                  </div>
                )}

                <Button
                  onClick={generateSuggestion}
                  disabled={isLoading || !formData.title || !formData.category || !formData.timeline}
                  className="w-full h-12 text-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating AI Suggestions...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-5 w-5" />
                      Generate Learning Path
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && suggestion && (
            <div className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-6 h-6 text-accent" />
                    AI-Generated Learning Path
                  </CardTitle>
                  <CardDescription>Here's your personalized learning journey for "{formData.title}"</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Timeline
                      </h4>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {suggestion.timeline}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Milestones
                      </h4>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {suggestion.milestones.length} learning phases
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Learning Milestones</h4>
                    <div className="space-y-3">
                      {suggestion.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">{index + 1}</span>
                          </div>
                          <span className="font-medium">{milestone.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground">{suggestion.description}</p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Modify Goal
                    </Button>
                    <Button onClick={createGoal} disabled={isLoading} className="flex-1">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Goal...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Create Goal
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
