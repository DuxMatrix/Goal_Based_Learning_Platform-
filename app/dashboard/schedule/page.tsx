"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { BookOpen, ArrowLeft, Calendar, Clock, Bell, Settings, Plus, Edit, Trash2, Download, ExternalLink, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { CalendarView, EventDetailModal, CalendarEvent } from "@/components/ui/calendar-view"
import { CalendarService } from "@/lib/calendar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"

interface CheckInSchedule {
  id: string
  goalId: string
  goalTitle: string
  frequency: "daily" | "weekly" | "biweekly"
  dayOfWeek?: number // 0-6, Sunday = 0
  timeOfDay: string
  reminderEnabled: boolean
  reminderTime: number // minutes before
  isActive: boolean
  nextCheckIn: string
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<CheckInSchedule[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [availableGoals, setAvailableGoals] = useState<{id: string, title: string}[]>([])
  const [formData, setFormData] = useState<{
    goalId: string;
    frequency: "daily" | "weekly" | "biweekly";
    dayOfWeek: number;
    timeOfDay: string;
    reminderEnabled: boolean;
    reminderTime: number;
  }>({
    goalId: "",
    frequency: "weekly",
    dayOfWeek: 1,
    timeOfDay: "18:00",
    reminderEnabled: true,
    reminderTime: 30,
  })

  // Load goals from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("goals") || "[]");
      const storedGoals = (Array.isArray(stored) ? stored : []).map((g: any) => ({
        id: String(g.id || g._id || Date.now()),
        title: g.title || "Untitled Goal",
      }));
      
      // Add sample goals if no stored goals exist
      const sampleGoals = [
        { id: "1", title: "Learn Machine Learning" },
        { id: "2", title: "Web Development Mastery" },
      ];
      
      setAvailableGoals(storedGoals.length > 0 ? storedGoals : sampleGoals);
    } catch {
      // Fallback to sample goals if localStorage fails
      setAvailableGoals([
        { id: "1", title: "Learn Machine Learning" },
        { id: "2", title: "Web Development Mastery" },
      ]);
    }
  }, [])

  const frequencyOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Bi-weekly" },
  ]

  const dayOptions = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ]

  const reminderOptions = [
    { value: 15, label: "15 minutes before" },
    { value: 30, label: "30 minutes before" },
    { value: 60, label: "1 hour before" },
    { value: 120, label: "2 hours before" },
    { value: 1440, label: "1 day before" },
  ]

  useEffect(() => {
    // Load sample schedules
    const sampleSchedules: CheckInSchedule[] = [
      {
        id: "1",
        goalId: "1",
        goalTitle: "Learn Machine Learning",
        frequency: "weekly",
        dayOfWeek: 1,
        timeOfDay: "18:00",
        reminderEnabled: true,
        reminderTime: 30,
        isActive: true,
        nextCheckIn: "2024-12-16T18:00:00",
      },
      {
        id: "2",
        goalId: "2",
        goalTitle: "Web Development Mastery",
        frequency: "biweekly",
        dayOfWeek: 5,
        timeOfDay: "20:00",
        reminderEnabled: true,
        reminderTime: 60,
        isActive: true,
        nextCheckIn: "2024-12-20T20:00:00",
      },
    ]
    setSchedules(sampleSchedules)
  }, [])

  // Convert schedules to calendar events
  const calendarEvents: CalendarEvent[] = schedules.map(schedule => ({
    id: schedule.id,
    title: `Check-in: ${schedule.goalTitle}`,
    date: new Date(schedule.nextCheckIn),
    type: 'checkin' as const,
    status: 'pending' as const,
    goalId: schedule.goalId,
    goalTitle: schedule.goalTitle,
    time: schedule.timeOfDay,
    description: `Scheduled ${schedule.frequency} check-in for ${schedule.goalTitle}`
  }))

  const handleExportCalendar = (schedule: CheckInSchedule) => {
    const events = CalendarService.convertCheckinsToEvents([{
      _id: schedule.id,
      goal: schedule.goalId,
      scheduledFor: schedule.nextCheckIn,
      type: 'scheduled'
    }], schedule.goalTitle)
    
    CalendarService.generateICalFile(events, schedule.goalTitle)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const handleDateClick = (date: Date) => {
    // Could open a form to create a new check-in for this date
    console.log('Date clicked:', date)
  }

  const calculateNextCheckIn = (frequency: string, dayOfWeek: number, timeOfDay: string) => {
    const now = new Date()
    const next = new Date()

    if (frequency === "daily") {
      next.setDate(now.getDate() + 1)
    } else if (frequency === "weekly") {
      const daysUntilNext = (dayOfWeek - now.getDay() + 7) % 7 || 7
      next.setDate(now.getDate() + daysUntilNext)
    } else if (frequency === "biweekly") {
      const daysUntilNext = (dayOfWeek - now.getDay() + 14) % 14 || 14
      next.setDate(now.getDate() + daysUntilNext)
    }

    const [hours, minutes] = timeOfDay.split(":").map(Number)
    next.setHours(hours, minutes, 0, 0)

    return next.toISOString()
  }

  const handleSave = () => {
    const selectedGoal = availableGoals.find((g) => g.id === formData.goalId)
    if (!selectedGoal) return

    const newSchedule: CheckInSchedule = {
      id: editingId || Date.now().toString(),
      goalId: formData.goalId,
      goalTitle: selectedGoal.title,
      frequency: formData.frequency,
      dayOfWeek: formData.dayOfWeek,
      timeOfDay: formData.timeOfDay,
      reminderEnabled: formData.reminderEnabled,
      reminderTime: formData.reminderTime,
      isActive: true,
      nextCheckIn: calculateNextCheckIn(formData.frequency, formData.dayOfWeek, formData.timeOfDay),
    }

    if (editingId) {
      setSchedules((prev) => prev.map((s) => (s.id === editingId ? newSchedule : s)))
    } else {
      setSchedules((prev) => [...prev, newSchedule])
    }

    resetForm()
  }

  const resetForm = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({
      goalId: "",
      frequency: "weekly",
      dayOfWeek: 1,
      timeOfDay: "18:00",
      reminderEnabled: true,
      reminderTime: 30,
    })
  }

  const handleEdit = (schedule: CheckInSchedule) => {
    setFormData({
      goalId: schedule.goalId,
      frequency: schedule.frequency,
      dayOfWeek: schedule.dayOfWeek || 1,
      timeOfDay: schedule.timeOfDay,
      reminderEnabled: schedule.reminderEnabled,
      reminderTime: schedule.reminderTime,
    })
    setEditingId(schedule.id)
    setIsCreating(true)
  }

  const handleDelete = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id))
  }

  const toggleActive = (id: string) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)))
  }

  const formatNextCheckIn = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Check-In Schedule</h1>
                <p className="text-muted-foreground">Manage your learning check-in reminders and schedule</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  List View
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar View
                </Button>
              </div>
            </div>
          </div>

          {/* Create/Edit Form */}
          {isCreating && (
            <Card className="border-2 border-primary/20 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-6 h-6 text-primary" />
                  {editingId ? "Edit Schedule" : "Create New Schedule"}
                </CardTitle>
                <CardDescription>Set up automated check-in reminders for your learning goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Select Goal</Label>
                    <Select
                      value={formData.goalId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, goalId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableGoals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value: any) => setFormData((prev) => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.frequency !== "daily" && (
                    <div className="space-y-2">
                      <Label>Day of Week</Label>
                      <Select
                        value={formData.dayOfWeek.toString()}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, dayOfWeek: Number.parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dayOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Select
                      value={formData.timeOfDay}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, timeOfDay: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, "0")
                          return (
                            <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                              {new Date(`2000-01-01T${hour}:00`).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Enable Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get notified before your scheduled check-ins</p>
                    </div>
                    <Switch
                      checked={formData.reminderEnabled}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, reminderEnabled: checked }))}
                    />
                  </div>

                  {formData.reminderEnabled && (
                    <div className="space-y-2">
                      <Label>Reminder Time</Label>
                      <Select
                        value={formData.reminderTime.toString()}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, reminderTime: Number.parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {reminderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={resetForm} className="flex-1 bg-transparent">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={!formData.goalId} className="flex-1">
                    {editingId ? "Update Schedule" : "Create Schedule"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedules List or Calendar View */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {viewMode === 'list' ? 'Your Schedules' : 'Calendar View'}
              </h2>
              {!isCreating && (
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Schedule
                </Button>
              )}
            </div>

            {viewMode === 'calendar' ? (
              <CalendarView
                events={calendarEvents}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                className="w-full"
              />
            ) : schedules.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No schedules yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first check-in schedule to stay on track</p>
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Schedule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <Card key={schedule.id} className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{schedule.goalTitle}</h3>
                            <Badge variant={schedule.isActive ? "default" : "secondary"}>
                              {schedule.isActive ? "Active" : "Paused"}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {schedule.frequency}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                {schedule.frequency === "daily"
                                  ? `Daily at ${new Date(`2000-01-01T${schedule.timeOfDay}`).toLocaleTimeString(
                                      "en-US",
                                      {
                                        hour: "numeric",
                                        minute: "2-digit",
                                        hour12: true,
                                      },
                                    )}`
                                  : `${dayOptions.find((d) => d.value === schedule.dayOfWeek)?.label}s at ${new Date(
                                      `2000-01-01T${schedule.timeOfDay}`,
                                    ).toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}`}
                              </span>
                            </div>
                            {schedule.reminderEnabled && (
                              <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                <span>
                                  Reminder {reminderOptions.find((r) => r.value === schedule.reminderTime)?.label}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Next: {formatNextCheckIn(schedule.nextCheckIn)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleExportCalendar(schedule)}>
                                <Download className="w-4 h-4 mr-2" />
                                Export to Calendar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button variant="ghost" size="sm" onClick={() => toggleActive(schedule.id)}>
                            {schedule.isActive ? "Pause" : "Resume"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(schedule)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-1 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-transparent"
                  onClick={async () => {
                    try {
                      const result = await api.testNotificationService();
                      if (result.success) {
                        alert('Notification service is working correctly!');
                      } else {
                        alert('Notification service test failed: ' + result.message);
                      }
                    } catch (error) {
                      alert('Error testing notification service: ' + error);
                    }
                  }}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Test Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Detail Modal */}
        <EventDetailModal
          event={selectedEvent}
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false)
            setSelectedEvent(null)
          }}
        />
      </div>
    </AuthGuard>
  )
}
