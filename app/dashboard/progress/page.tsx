"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  BookOpen,
  ArrowLeft,
  TrendingUp,
  Target,
  Clock,
  Award,
  Calendar,
  Activity,
  BarChart3,
  PieChartIcon,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

interface ProgressData {
  date: string
  progress: number
  timeSpent: number
  sessionsCompleted: number
  goal: string
}

interface GoalProgress {
  id: string
  title: string
  progress: number
  timeSpent: number
  sessionsCompleted: number
  milestones: number
  completedMilestones: number
  averageScore: number
  streak: number
}

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedGoal, setSelectedGoal] = useState("all")
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [goals, setGoals] = useState<any[]>([])
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [overviewData, setOverviewData] = useState<any>(null)

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange, selectedGoal])

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const response = await api.getGoals()
      if (response.success && response.data) {
        const goalsArray = Array.isArray(response.data) ? response.data : []
        setGoals(goalsArray)
      } else {
        // Use mock goals if API fails
        setGoals(generateMockGoals())
      }
    } catch (error) {
      console.error("Error loading goals:", error)
      // Use mock goals as fallback
      setGoals(generateMockGoals())
    }
  }

  const generateMockGoals = () => {
    return [
      {
        _id: "1",
        title: "Learn Machine Learning",
        description: "Master the fundamentals of ML algorithms and applications",
        milestones: [
          { id: "1", title: "Linear Regression", isCompleted: true },
          { id: "2", title: "Neural Networks", isCompleted: true },
          { id: "3", title: "Deep Learning", isCompleted: true },
          { id: "4", title: "Computer Vision", isCompleted: false },
          { id: "5", title: "NLP", isCompleted: false },
          { id: "6", title: "Model Deployment", isCompleted: false },
          { id: "7", title: "MLOps", isCompleted: false },
          { id: "8", title: "Advanced Topics", isCompleted: false }
        ]
      },
      {
        _id: "2",
        title: "Web Development Mastery",
        description: "Build full-stack applications with React and Node.js",
        milestones: [
          { id: "1", title: "HTML/CSS", isCompleted: true },
          { id: "2", title: "JavaScript", isCompleted: true },
          { id: "3", title: "React Basics", isCompleted: true },
          { id: "4", title: "React Hooks", isCompleted: true },
          { id: "5", title: "State Management", isCompleted: true },
          { id: "6", title: "Node.js", isCompleted: true },
          { id: "7", title: "Express.js", isCompleted: true },
          { id: "8", title: "Database Integration", isCompleted: true },
          { id: "9", title: "Authentication", isCompleted: false },
          { id: "10", title: "Testing", isCompleted: false },
          { id: "11", title: "Deployment", isCompleted: false },
          { id: "12", title: "Performance", isCompleted: false }
        ]
      },
      {
        _id: "3",
        title: "Data Science Fundamentals",
        description: "Learn data analysis, visualization, and statistical modeling",
        milestones: [
          { id: "1", title: "Python Basics", isCompleted: true },
          { id: "2", title: "Pandas", isCompleted: true },
          { id: "3", title: "NumPy", isCompleted: false },
          { id: "4", title: "Matplotlib", isCompleted: false },
          { id: "5", title: "Seaborn", isCompleted: false },
          { id: "6", title: "Statistical Analysis", isCompleted: false },
          { id: "7", title: "Data Cleaning", isCompleted: false },
          { id: "8", title: "Feature Engineering", isCompleted: false },
          { id: "9", title: "Model Building", isCompleted: false },
          { id: "10", title: "Data Visualization", isCompleted: false }
        ]
      }
    ]
  }
  

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true)
      
      // Load analytics data
      const period = timeRange === "7d" ? "week" : timeRange === "30d" ? "month" : "quarter"
      const analyticsResponse = await api.getProgressAnalytics({
        goalId: selectedGoal === "all" ? undefined : selectedGoal,
        period
      })

      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalyticsData(analyticsResponse.data)
        
        // Transform analytics data to progress data format
        const transformedData = transformAnalyticsToProgressData(analyticsResponse.data)
        setProgressData(transformedData)
      } else {
        // Use mock data if API fails
        setProgressData(generateMockProgressData())
      }

      // Load overview data
      const overviewResponse = await api.getProgressOverview()
      if (overviewResponse.success && overviewResponse.data) {
        setOverviewData(overviewResponse.data)
        
        // Transform overview data to goal progress format
        const transformedGoalProgress = transformOverviewToGoalProgress(overviewResponse.data, goals)
        setGoalProgress(transformedGoalProgress)
      } else {
        // Use mock data if API fails
        setGoalProgress(generateMockGoalProgress())
      }

    } catch (error) {
      console.error("Error loading analytics data:", error)
      // Fallback to mock data
      setProgressData(generateMockProgressData())
      setGoalProgress(generateMockGoalProgress())
    } finally {
      setIsLoading(false)
    }
  }

  const transformAnalyticsToProgressData = (analytics: any): ProgressData[] => {
    if (!analytics.dailyStudyTime) return []
    
    return analytics.dailyStudyTime.map((item: any) => ({
      date: item._id,
      progress: Math.min(100, (item.totalMinutes / 60) * 10), // Convert minutes to progress percentage
      timeSpent: Math.round(item.totalMinutes / 60 * 10) / 10, // Convert to hours
      sessionsCompleted: 1, // Default to 1 session per day
      goal: "Combined", // Will be updated based on selected goal
    }))
  }

  const transformOverviewToGoalProgress = (overview: any, goalsList: any[]): GoalProgress[] => {
    if (!goalsList.length) return []
    
    return goalsList.map((goal: any) => {
      // Calculate progress based on milestones
      const totalMilestones = goal.milestones?.length || 0
      const completedMilestones = goal.milestones?.filter((m: any) => m.isCompleted).length || 0
      const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
      
      // Use consistent mock data based on goal ID
      const mockData = {
        "1": { timeSpent: 24.5, sessionsCompleted: 12, averageScore: 85, streak: 7 },
        "2": { timeSpent: 42.3, sessionsCompleted: 18, averageScore: 92, streak: 12 },
        "3": { timeSpent: 15.7, sessionsCompleted: 8, averageScore: 78, streak: 3 }
      }
      
      const data = mockData[goal._id as keyof typeof mockData] || {
        timeSpent: Math.round(Math.random() * 50 + 10),
        sessionsCompleted: Math.round(Math.random() * 20 + 5),
        averageScore: Math.round(Math.random() * 30 + 70),
        streak: Math.round(Math.random() * 15 + 1)
      }
      
      return {
        id: goal._id,
        title: goal.title,
        progress,
        timeSpent: data.timeSpent,
        sessionsCompleted: data.sessionsCompleted,
        milestones: totalMilestones,
        completedMilestones,
        averageScore: data.averageScore,
        streak: data.streak,
      }
    })
  }

  // Mock data generation functions
  const generateMockProgressData = (): ProgressData[] => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const data: ProgressData[] = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      data.push({
        date: date.toISOString().split('T')[0],
        progress: Math.round(Math.random() * 20 + 10), // 10-30% progress per day
        timeSpent: Math.round((Math.random() * 3 + 1) * 10) / 10, // 1-4 hours
        sessionsCompleted: Math.round(Math.random() * 3 + 1), // 1-4 sessions
        goal: "Combined"
      })
    }
    
    return data
  }

  const generateMockGoalProgress = (): GoalProgress[] => {
    return [
      {
        id: "1",
        title: "Learn Machine Learning",
        progress: 35,
        timeSpent: 24.5,
        sessionsCompleted: 12,
        milestones: 8,
        completedMilestones: 3,
        averageScore: 85,
        streak: 7
      },
      {
        id: "2", 
        title: "Web Development Mastery",
        progress: 65,
        timeSpent: 42.3,
        sessionsCompleted: 18,
        milestones: 12,
        completedMilestones: 8,
        averageScore: 92,
        streak: 12
      },
      {
        id: "3",
        title: "Data Science Fundamentals", 
        progress: 20,
        timeSpent: 15.7,
        sessionsCompleted: 8,
        milestones: 10,
        completedMilestones: 2,
        averageScore: 78,
        streak: 3
      }
    ]
  }

  const refreshData = () => {
    loadAnalyticsData()
  }

  const filteredData = selectedGoal === "all" ? progressData : progressData.filter((d) => d.goal === selectedGoal)

  const totalTimeSpent = goalProgress.length > 0 ? goalProgress.reduce((acc, goal) => acc + goal.timeSpent, 0) : 0
  const totalSessions = goalProgress.length > 0 ? goalProgress.reduce((acc, goal) => acc + goal.sessionsCompleted, 0) : 0
  const averageProgress = goalProgress.length > 0 ? Math.round(goalProgress.reduce((acc, goal) => acc + goal.progress, 0) / goalProgress.length) : 0
  const longestStreak = goalProgress.length > 0 ? Math.max(...goalProgress.map((g) => g.streak)) : 0

  // Chart data transformations
  const weeklyData = progressData.reduce((acc, curr) => {
    const week = new Date(curr.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const existing = acc.find((item) => item.week === week)
    if (existing) {
      existing.timeSpent += curr.timeSpent
      existing.sessions += curr.sessionsCompleted
    } else {
      acc.push({
        week,
        timeSpent: curr.timeSpent,
        sessions: curr.sessionsCompleted,
        progress: curr.progress,
      })
    }
    return acc
  }, [] as any[])

  const goalDistribution = goalProgress.map((goal) => ({
    name: goal.title,
    value: goal.timeSpent,
    progress: goal.progress,
  }))

  const COLORS = ["#164e63", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"]

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

            <div className="flex items-center gap-3">
              <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Goals</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal._id} value={goal._id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Progress Analytics</h1>
            <p className="text-muted-foreground">Track your learning journey with detailed insights and metrics</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold">{averageProgress}%</p>
                        <p className="text-sm text-muted-foreground">Avg Progress</p>
                      </>
                    )}
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
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold">{totalTimeSpent}h</p>
                        <p className="text-sm text-muted-foreground">Total Time</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold">{totalSessions}</p>
                        <p className="text-sm text-muted-foreground">Sessions</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold">{longestStreak}</p>
                        <p className="text-sm text-muted-foreground">Day Streak</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Progress Over Time */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Progress Over Time
                    </CardTitle>
                    <CardDescription>Your learning progress trend</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center h-[300px]">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    ) : weeklyData.length === 0 ? (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="text-center">
                          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No progress data available</p>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={weeklyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="progress" stroke="#164e63" fill="#164e63" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Time Distribution */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-accent" />
                      Time Distribution
                    </CardTitle>
                    <CardDescription>Time spent per goal</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center h-[300px]">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    ) : goalDistribution.length === 0 ? (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="text-center">
                          <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No goal data available</p>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={goalDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}h`}
                          >
                            {goalDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Activity */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Weekly Activity
                  </CardTitle>
                  <CardDescription>Study sessions and time spent per week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="timeSpent" fill="#164e63" name="Hours Spent" />
                      <Bar yAxisId="right" dataKey="sessions" fill="#f59e0b" name="Sessions" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="space-y-6">
              <div className="space-y-6">
                {goalProgress.map((goal) => (
                  <Card key={goal.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          {goal.title}
                        </CardTitle>
                        <Badge variant="outline">{goal.progress}% complete</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Progress value={goal.progress} className="h-3" />

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{goal.timeSpent}h</div>
                          <div className="text-sm text-muted-foreground">Time Spent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-accent">{goal.sessionsCompleted}</div>
                          <div className="text-sm text-muted-foreground">Sessions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {goal.completedMilestones}/{goal.milestones}
                          </div>
                          <div className="text-sm text-muted-foreground">Milestones</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-accent">{goal.averageScore}%</div>
                          <div className="text-sm text-muted-foreground">Avg Score</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-accent" />
                          <span>{goal.streak} day streak</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>Last session: 2 hours ago</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-2">
                  <CardHeader>
                    <CardTitle>Daily Activity Heatmap</CardTitle>
                    <CardDescription>Your learning activity over the past month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 35 }, (_, i) => {
                        const intensity = Math.random()
                        return (
                          <div
                            key={i}
                            className={`w-8 h-8 rounded border ${
                              intensity > 0.7
                                ? "bg-primary"
                                : intensity > 0.4
                                  ? "bg-primary/60"
                                  : intensity > 0.2
                                    ? "bg-primary/30"
                                    : "bg-muted"
                            }`}
                            title={`Day ${i + 1}: ${Math.round(intensity * 4)} hours`}
                          />
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                      <span>Less</span>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 bg-muted rounded"></div>
                        <div className="w-3 h-3 bg-primary/30 rounded"></div>
                        <div className="w-3 h-3 bg-primary/60 rounded"></div>
                        <div className="w-3 h-3 bg-primary rounded"></div>
                      </div>
                      <span>More</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Recent Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { title: "Neural Networks", duration: "45 min", score: "92%", time: "2h ago" },
                        { title: "React Hooks", duration: "30 min", score: "88%", time: "1d ago" },
                        { title: "Linear Regression", duration: "60 min", score: "76%", time: "2d ago" },
                        { title: "State Management", duration: "40 min", score: "94%", time: "3d ago" },
                      ].map((session, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{session.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {session.duration} • {session.time}
                            </div>
                          </div>
                          <Badge variant="outline">{session.score}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-green-700">Strengths</CardTitle>
                    <CardDescription>Areas where you're excelling</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Consistent Learning</p>
                        <p className="text-sm text-muted-foreground">
                          You've maintained a {longestStreak}-day learning streak
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">High Engagement</p>
                        <p className="text-sm text-muted-foreground">
                          Average session score of 85% shows strong comprehension
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Balanced Learning</p>
                        <p className="text-sm text-muted-foreground">Good mix of theory and practical exercises</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-amber-700">Opportunities</CardTitle>
                    <CardDescription>Areas for improvement</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Study Duration</p>
                        <p className="text-sm text-muted-foreground">
                          Consider longer study sessions for deeper understanding
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Practice Exercises</p>
                        <p className="text-sm text-muted-foreground">
                          Increase hands-on practice to reinforce concepts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Review Sessions</p>
                        <p className="text-sm text-muted-foreground">Schedule regular review of completed modules</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 md:col-span-2">
                  <CardHeader>
                    <CardTitle>AI Recommendations</CardTitle>
                    <CardDescription>Personalized suggestions to optimize your learning</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <h4 className="font-medium mb-2">Optimal Study Time</h4>
                      <p className="text-sm text-muted-foreground">
                        Based on your activity patterns, you're most productive between 6-8 PM. Consider scheduling your
                        most challenging topics during this time.
                      </p>
                    </div>
                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                      <h4 className="font-medium mb-2">Learning Path Adjustment</h4>
                      <p className="text-sm text-muted-foreground">
                        You're progressing faster than expected in Web Development. Consider advancing to more complex
                        topics or starting a new complementary skill.
                      </p>
                    </div>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <h4 className="font-medium mb-2">Spaced Repetition</h4>
                      <p className="text-sm text-muted-foreground">
                        Schedule a review of Neural Networks concepts from 2 weeks ago to strengthen long-term
                        retention.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
