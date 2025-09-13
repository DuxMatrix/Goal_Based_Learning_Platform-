"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

import { AuthGuard } from "@/components/auth-guard"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, BookOpen, MessageCircle, Target } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

interface Milestone {
  id: string
  title: string
  isCompleted: boolean
  dependencies: string[]
  order: number
  type?: 'theory' | 'practice' | 'project' | 'assessment'
  estimatedDuration?: number
  learningObjectives?: string[]
  assessmentCriteria?: string[]
}

interface StoredGoal {
  id: string
  title: string
  description?: string
  timeline?: string
  category?: string
  milestones?: Milestone[] | { title: string; isCompleted?: boolean; completed?: boolean }[] | number
  progress?: number
  status?: string
  createdAt?: string
}

export default function GoalDetailsPage() {
  const router = useRouter()
  const routeParams = useParams<{ id: string }>()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [milestoneList, setMilestoneList] = useState<Milestone[]>([])
  const [showDependencyManager, setShowDependencyManager] = useState(false)

  const goalId = String(routeParams?.id || "")

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("goals") || "[]")
      const storedArray: StoredGoal[] = Array.isArray(stored) ? stored : []
      const normalized: Goal[] = storedArray.map((g: any) => {
        const milestonesCount = Array.isArray(g.milestones)
          ? g.milestones.length
          : typeof g.milestones === "number"
          ? g.milestones
          : 0
        const completedMilestonesCount = Array.isArray(g.milestones)
          ? g.milestones.filter((m: any) => m && (m.isCompleted || m.completed)).length
          : typeof g.completedMilestones === "number"
          ? g.completedMilestones
          : 0
        return {
          id: String(g.id || g._id || Date.now()),
          title: g.title || "Untitled Goal",
          description: g.description || "",
          timeline: g.timeline || (g.estimatedDuration ? `${g.estimatedDuration.value} ${g.estimatedDuration.unit}` : ""),
          progress: typeof g.progress === "number" ? g.progress : 0,
          status: ["active", "completed", "paused"].includes((g as any).status) ? (g as any).status : "active",
          createdAt: g.createdAt || new Date().toISOString(),
          milestones: milestonesCount,
          completedMilestones: completedMilestonesCount,
        } as Goal
      })

      // Include sample goals used on dashboard so details work for them too
      const sample: Goal[] = [
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

      const all = [...normalized, ...sample]
      const found = all.find((g) => String(g.id) === String(goalId)) || null
      setGoal(found)

      const original = storedArray.find((g) => String((g as any).id || (g as any)._id) === String(goalId))
      if (original && Array.isArray(original.milestones)) {
        const list = (original.milestones as any[]).map((m, index) => ({
          id: (m as any)?.id || `milestone-${index}`,
          title: (m as any)?.title || String(m),
          isCompleted: Boolean((m as any)?.isCompleted || (m as any)?.completed),
          dependencies: (m as any)?.dependencies || [],
          order: (m as any)?.order || index,
          type: (m as any)?.type || 'theory',
          estimatedDuration: (m as any)?.estimatedDuration || 1,
          learningObjectives: (m as any)?.learningObjectives || [],
          assessmentCriteria: (m as any)?.assessmentCriteria || [],
        }))
        setMilestoneList(list)
      } else {
        setMilestoneList([])
      }
    } catch {
      setGoal(null)
    }
  }, [goalId])

  const persistMilestones = (updatedList: Milestone[]) => {
    try {
      const stored = JSON.parse(localStorage.getItem("goals") || "[]") as StoredGoal[]
      const next = (Array.isArray(stored) ? stored : []).map((g: any) => {
        const id = String(g?.id || g?._id)
        if (id !== String(goalId)) return g
        return {
          ...g,
          milestones: updatedList,
          progress:
            updatedList.length > 0
              ? Math.round((updatedList.filter((m) => m.isCompleted).length / updatedList.length) * 100)
              : g.progress || 0,
        }
      })
      localStorage.setItem("goals", JSON.stringify(next))
    } catch {}
  }

  const isMilestoneBlocked = (milestone: Milestone) => {
    if (milestone.isCompleted) return false
    return milestone.dependencies.some(depId => {
      const depMilestone = milestoneList.find(m => m.id === depId)
      return depMilestone && !depMilestone.isCompleted
    })
  }

  const toggleMilestone = (index: number) => {
    const milestone = milestoneList[index]
    
    // Check if trying to complete a blocked milestone
    if (!milestone.isCompleted && isMilestoneBlocked(milestone)) {
      alert("Cannot complete this milestone. Please complete its dependencies first.")
      return
    }

    setMilestoneList((prev) => {
      const updated = [...prev]
      const wasCompleted = updated[index].isCompleted
      updated[index] = { ...updated[index], isCompleted: !updated[index].isCompleted }
      
      setGoal((g) =>
        g
          ? {
              ...g,
              completedMilestones: updated.filter((m) => m.isCompleted).length,
              milestones: updated.length,
              progress:
                updated.length > 0
                  ? Math.round((updated.filter((m) => m.isCompleted).length / updated.length) * 100)
                  : g.progress,
            }
          : g,
      )
      persistMilestones(updated)
      
      // Create progress entry for milestone completion
      if (!wasCompleted && updated[index].isCompleted) {
        api.addProgressEntry({
          goalId: goalId,
          type: 'milestone',
          value: 1,
          unit: 'count',
          description: `Completed milestone: ${updated[index].title}`,
          metadata: {
            milestoneId: updated[index].id
          }
        }).catch(error => {
          console.error("Error creating progress entry:", error)
        })
      }
      
      return updated
    })
  }

  const addDependency = (milestoneId: string, dependencyId: string) => {
    setMilestoneList((prev) => {
      const updated = prev.map(m => 
        m.id === milestoneId 
          ? { ...m, dependencies: [...m.dependencies, dependencyId] }
          : m
      )
      persistMilestones(updated)
      return updated
    })
  }

  const removeDependency = (milestoneId: string, dependencyId: string) => {
    setMilestoneList((prev) => {
      const updated = prev.map(m => 
        m.id === milestoneId 
          ? { ...m, dependencies: m.dependencies.filter(dep => dep !== dependencyId) }
          : m
      )
      persistMilestones(updated)
      return updated
    })
  }

  const deleteGoal = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("goals") || "[]") as any[]
      const next = (Array.isArray(stored) ? stored : []).filter(
        (g) => String((g as any)?.id || (g as any)?._id) !== String(goalId),
      )
      localStorage.setItem("goals", JSON.stringify(next))
      router.push("/dashboard")
    } catch {
      router.push("/dashboard")
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}> 
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
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
          {!goal ? (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <CardTitle className="mb-2">Goal not found</CardTitle>
                <CardDescription className="mb-4">We couldn't find details for this goal.</CardDescription>
                <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">{goal.title}</CardTitle>
                    <CardDescription className="text-base mt-1">{goal.description}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={goal.status === "active" ? "default" : "secondary"}>{goal.status}</Badge>
                      <span className="text-sm text-muted-foreground">Created {new Date(goal.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/dashboard/tutor?goalId=${goal.id}`)}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat with AI
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Goal</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. It will permanently remove this goal and its milestones from your device.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={deleteGoal}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{goal.progress}% complete</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 rounded-md border">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="font-medium">Timeline</span>
                    </div>
                    <div className="text-muted-foreground">{goal.timeline}</div>
                  </div>
                  <div className="p-4 rounded-md border">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-accent" />
                      <span className="font-medium">Milestones</span>
                    </div>
                    <div className="text-muted-foreground">{goal.completedMilestones}/{goal.milestones}</div>
                  </div>
                </div>

                {milestoneList.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Your Milestones</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowDependencyManager(!showDependencyManager)}
                      >
                        {showDependencyManager ? "Hide" : "Manage"} Dependencies
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {milestoneList.map((m, idx) => {
                        const isBlocked = isMilestoneBlocked(m)
                        const dependencies = m.dependencies.map(depId => {
                          const dep = milestoneList.find(dep => dep.id === depId)
                          return dep ? dep.title : depId
                        })
                        
                        return (
                          <div key={m.id} className={`flex items-center gap-3 p-3 border rounded-md ${
                            isBlocked ? 'bg-muted/50 border-muted' : ''
                          }`}>
                            <Checkbox
                              checked={m.isCompleted}
                              onCheckedChange={() => toggleMilestone(idx)}
                              disabled={isBlocked}
                              className="size-5 border-primary/60 shadow-md shadow-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:ring-primary/40 disabled:opacity-50"
                            />
                            <div className="flex-1">
                              <span className={`${m.isCompleted ? "line-through text-muted-foreground" : ""} ${
                                isBlocked ? "text-muted-foreground" : ""
                              }`}>
                                {m.title}
                              </span>
                              {isBlocked && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  ⚠️ Blocked by: {dependencies.join(", ")}
                                </div>
                              )}
                              {m.dependencies.length > 0 && !isBlocked && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Depends on: {dependencies.join(", ")}
                                </div>
                              )}
                            </div>
                            {showDependencyManager && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Simple dependency management - in a real app, this would open a modal
                                  const availableDeps = milestoneList
                                    .filter(dep => dep.id !== m.id && !m.dependencies.includes(dep.id))
                                    .map(dep => dep.title)
                                  
                                  if (availableDeps.length > 0) {
                                    const depTitle = prompt(`Add dependency for "${m.title}":\nAvailable: ${availableDeps.join(", ")}`)
                                    if (depTitle) {
                                      const depMilestone = milestoneList.find(dep => dep.title === depTitle)
                                      if (depMilestone) {
                                        addDependency(m.id, depMilestone.id)
                                      }
                                    }
                                  } else {
                                    alert("No available dependencies to add.")
                                  }
                                }}
                              >
                                Add Dep
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Link href={`/dashboard/tutor?goalId=${goal.id}`}>
                    <Button>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Continue with AI Tutor
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}


