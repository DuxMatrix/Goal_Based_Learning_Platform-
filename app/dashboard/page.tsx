"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  BookOpen,
  Plus,
  Target,
  Calendar,
  TrendingUp,
  MessageCircle,
  Settings,
  LogOut,
  Clock,
  FileText,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Goal {
  id: string
  title: string
  description: string
  timeline: string
  progress: number
  status: "active" | "completed" | "paused"
  createdAt: string
  milestones: number
  completedMilestones: number
}

export default function DashboardPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const router = useRouter()
  const { user, logout } = useAuth()

  useEffect(() => {
    // Load saved goals from localStorage, then append sample goals
    try {
      const stored = JSON.parse(localStorage.getItem("goals") || "[]");
      const storedGoals: Goal[] = (Array.isArray(stored) ? stored : []).map((g: any) => {
        const milestonesCount = Array.isArray(g.milestones) ? g.milestones.length : typeof g.milestones === "number" ? g.milestones : 0;
        const completedMilestonesCount = Array.isArray(g.milestones)
          ? g.milestones.filter((m: any) => m && (m.isCompleted || m.completed)).length
          : typeof g.completedMilestones === "number"
          ? g.completedMilestones
          : 0;
        return {
          id: String(g.id || g._id || Date.now()),
          title: g.title || "Untitled Goal",
          description: g.description || "",
          timeline: g.timeline || (g.estimatedDuration ? `${g.estimatedDuration.value} ${g.estimatedDuration.unit}` : ""),
          progress: typeof g.progress === "number" ? g.progress : 0,
          status: ["active", "completed", "paused"].includes(g.status) ? g.status : "active",
          createdAt: g.createdAt || new Date().toISOString(),
          milestones: milestonesCount,
          completedMilestones: completedMilestonesCount,
        } as Goal;
      });

      const sampleGoals: Goal[] = [
        {
          id: "1",
          title: "Learn Machine Learning",
          description: "Master the fundamentals of ML algorithms and applications",
          timeline: "4 months",
          progress: 35,
          status: "active",
          createdAt: "2024-01-15",
          milestones: 8,
          completedMilestones: 3,
        },
        {
          id: "2",
          title: "Web Development Mastery",
          description: "Build full-stack applications with React and Node.js",
          timeline: "6 months",
          progress: 65,
          status: "active",
          createdAt: "2024-01-01",
          milestones: 12,
          completedMilestones: 8,
        },
      ]

      setGoals([...(storedGoals || []), ...sampleGoals])
    } catch {
      const sampleGoals: Goal[] = [
        {
          id: "1",
          title: "Learn Machine Learning",
          description: "Master the fundamentals of ML algorithms and applications",
          timeline: "4 months",
          progress: 35,
          status: "active",
          createdAt: "2024-01-15",
          milestones: 8,
          completedMilestones: 3,
        },
        {
          id: "2",
          title: "Web Development Mastery",
          description: "Build full-stack applications with React and Node.js",
          timeline: "6 months",
          progress: 65,
          status: "active",
          createdAt: "2024-01-01",
          milestones: 12,
          completedMilestones: 8,
        },
      ]
      setGoals(sampleGoals)
    }
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">LearnAI</span>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/dashboard/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-muted-foreground">Continue your learning journey and achieve your goals</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{goals.filter((g) => g.status === "active").length}</p>
                    <p className="text-sm text-muted-foreground">Active Goals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {goals.reduce((acc, goal) => acc + goal.completedMilestones, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Completed Milestones</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length) || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-sm text-muted-foreground">Study Hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Goals Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Learning Goals</h2>
                <Link href="/dashboard/goals/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Goal
                  </Button>
                </Link>
              </div>

              <div className="space-y-6">
                {goals.length === 0 ? (
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-12 text-center">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
                      <p className="text-muted-foreground mb-4">Create your first learning goal to get started</p>
                      <Link href="/dashboard/goals/new">
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Goal
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  goals.map((goal) => (
                    <Card key={goal.id} className="border-2 hover:border-primary/20 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-xl">{goal.title}</CardTitle>
                              <Badge variant={goal.status === "active" ? "default" : "secondary"}>{goal.status}</Badge>
                            </div>
                            <CardDescription className="text-base">{goal.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{goal.progress}% complete</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">Timeline: {goal.timeline}</span>
                              <span className="text-muted-foreground">
                                Milestones: {goal.completedMilestones}/{goal.milestones}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/goals/${goal.id}`)}>
                                View Details
                              </Button>
                              <Button size="sm" onClick={() => router.push(`/dashboard/tutor?goalId=${goal.id}`)}>
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Chat with AI
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/dashboard/goals/new">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Goal
                    </Button>
                  </Link>
                  <Link href="/dashboard/tutor">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat with AI Tutor
                    </Button>
                  </Link>
                  <Link href="/dashboard/schedule">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Check-ins
                    </Button>
                  </Link>
                  <Link href="/dashboard/progress">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Progress
                    </Button>
                  </Link>
                  <Link href="/dashboard/sessions">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <FileText className="w-4 h-4 mr-2" />
                      Session Summaries
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Completed "Neural Networks Basics"</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Started new learning module</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">AI tutor session completed</p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Streak */}
              <Card>
                <CardHeader>
                  <CardTitle>Learning Streak</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">7</div>
                    <p className="text-sm text-muted-foreground">Days in a row</p>
                    <p className="text-xs text-muted-foreground mt-2">Keep it up! 🔥</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
