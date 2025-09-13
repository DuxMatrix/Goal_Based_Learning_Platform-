"use client"

import type React from "react"

import { useState, useEffect, useRef, useRef as useReactRef } from "react"
import { useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { api, AuthManager } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AvatarDisplay, AvatarDisplayState } from "@/components/ui/avatar-display"
import { AIAvatar, AvatarState, defaultPersonalities, AvatarPersonalitySelector } from "@/components/ui/ai-avatar"
import { AdvancedAvatar, AdvancedAvatarState } from "@/components/ui/advanced-avatar"
import {
  BookOpen,
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageCircle,
  Brain,
  Lightbulb,
  Target,
  HelpCircle,
  Loader2,
  Sparkles,
  Square,
  Trash2
} from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  context?: {
    goalId?: string
    moduleId?: string
    type?: "theory" | "practice" | "question" | "explanation"
  }
}

interface LearningModule {
  id: string
  title: string
  description: string
  type: "theory" | "practice" | "assessment"
  goalId: string
  completed: boolean
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState("")
  const [currentModule, setCurrentModule] = useState<LearningModule | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const didInitRef = useRef(false)
  const [aiMode, setAiMode] = useState<'backend' | 'mock'>('mock')
  
  // Avatar state
  const [avatarState, setAvatarState] = useState<AdvancedAvatarState>({
    isSpeaking: false,
    isThinking: false,
    isListening: false,
    currentMood: 'neutral',
    currentTopic: undefined,
    isVideoEnabled: false,
    isAudioEnabled: false,
    isLookingAtUser: true,
    energyLevel: 75,
    confidenceLevel: 85
  })
  const [selectedPersonality, setSelectedPersonality] = useState({
    ...defaultPersonalities[0],
    style: 'professional' as const
  })
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now())

  // Load user goals from localStorage and merge with samples
  const goals = (() => {
    const samples = [
      { id: "1", title: "Learn Machine Learning", progress: 35 },
      { id: "2", title: "Web Development Mastery", progress: 65 },
    ]
    try {
      const stored = JSON.parse(localStorage.getItem("goals") || "[]")
      const normalized = (Array.isArray(stored) ? stored : []).map((g: any) => ({
        id: String(g.id || g._id || Date.now()),
        title: g.title || "Untitled Goal",
        progress: typeof g.progress === "number" ? g.progress : 0,
      }))
      return [...normalized, ...samples]
    } catch {
      return samples
    }
  })()

  const modules: LearningModule[] = [
    {
      id: "1",
      title: "Introduction to Neural Networks",
      description: "Understanding the basics of artificial neural networks",
      type: "theory",
      goalId: "1",
      completed: false,
    },
    {
      id: "2",
      title: "Linear Regression Practice",
      description: "Hands-on exercises with linear regression algorithms",
      type: "practice",
      goalId: "1",
      completed: true,
    },
    {
      id: "3",
      title: "React Hooks Deep Dive",
      description: "Advanced concepts in React hooks and state management",
      type: "theory",
      goalId: "2",
      completed: false,
    },
  ]

  useEffect(() => {
    if (didInitRef.current) return
    didInitRef.current = true
    const welcomeMessage: Message = {
      id: "welcome",
      type: "ai",
      content:
        "Hello! I'm your AI learning tutor. I'm here to help you understand concepts, answer questions, and guide you through your learning journey. What would you like to explore today?",
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
    const goalFromUrl = searchParams.get("goalId")
    if (goalFromUrl) setSelectedGoal(goalFromUrl)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const isMongoObjectId = (id?: string) => Boolean(id && /^[a-f0-9]{24}$/i.test(id))

  const generateAIResponse = async (userMessage: string, context?: any): Promise<string> => {
    // Try backend first if authenticated; otherwise fall back to mock
    try {
      const token = AuthManager.getToken()
      if (token) {
        const payload: { message: string; goalId?: string; context?: any } = {
          message: userMessage,
          context,
        }
        // Only send goalId if it looks like a Mongo ObjectId to satisfy backend validation
        if (isMongoObjectId(selectedGoal)) {
          payload.goalId = selectedGoal
        }

        const res = await api.chatWithTutor(payload)
        if (res?.success && res?.data?.response) {
          setAiMode('backend')
          return res.data.response
        }
      }
    } catch (err) {
      console.warn("Falling back to mock AI (chat endpoint failed):", err)
    }

    // Mock fallback
    setAiMode('mock')
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 800))
    const lowerMessage = userMessage.toLowerCase()
    if (lowerMessage.includes("neural network") || lowerMessage.includes("machine learning")) {
      return "Great question about neural networks! Think of a neural network like the human brain - it's made up of interconnected nodes (neurons) that process information. Each connection has a weight that determines how much influence one neuron has on another. When we train the network, we adjust these weights to help it recognize patterns in data. Would you like me to explain how the training process works, or do you have questions about a specific type of neural network?"
    }
    if (lowerMessage.includes("react") || lowerMessage.includes("hooks")) {
      return "React hooks are a powerful feature that let you use state and other React features in functional components. The most common ones are useState for managing component state and useEffect for side effects like API calls. The key principle is that hooks must be called in the same order every time - that's why we have the 'Rules of Hooks'. What specific aspect of hooks would you like to dive deeper into?"
    }
    if (lowerMessage.includes("help") || lowerMessage.includes("stuck")) {
      return "I understand you're facing a challenge! That's completely normal in learning. Let's break this down step by step. Can you tell me specifically what concept or problem you're working on? I can provide explanations, examples, or even suggest practice exercises to help you understand better."
    }
    if (lowerMessage.includes("practice") || lowerMessage.includes("exercise")) {
      return "Practice is essential for mastering any skill! I can create personalized exercises based on your current learning goal. For example, if you're learning machine learning, I could give you a dataset to analyze, or if you're studying web development, I could suggest a mini-project to build. What type of hands-on practice would be most helpful for you right now?"
    }
    const responses = [
      "That's an interesting question! Let me help you understand this concept better. Can you provide more context about what specifically you'd like to learn?",
      "I see what you're getting at. This is a common area where students need clarification. Let me break this down into simpler parts...",
      "Excellent question! This touches on some fundamental concepts. Let me explain this in a way that connects to your learning goals...",
      "I love your curiosity! This is exactly the kind of thinking that leads to deep understanding. Here's how I'd approach this...",
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
      context: {
        goalId: selectedGoal,
        moduleId: currentModule?.id,
      },
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    // Update avatar state for user input
    setAvatarState(prev => ({
      ...prev,
      isListening: false,
      isThinking: true,
      currentMood: 'thinking'
    }))

    try {
      const aiResponse = await generateAIResponse(inputMessage, {
        goal: selectedGoal,
        module: currentModule,
      })

      // Update avatar state for AI response
      setAvatarState(prev => ({
        ...prev,
        isThinking: false,
        isSpeaking: true,
        currentMood: 'explaining',
        energyLevel: Math.min(100, prev.energyLevel + 5),
        confidenceLevel: Math.min(100, prev.confidenceLevel + 2)
      }))

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponse,
        timestamp: new Date(),
        context: {
          goalId: selectedGoal,
          moduleId: currentModule?.id,
          type: "explanation",
        },
      }

      setMessages((prev) => [...prev, aiMessage])

      // Stop speaking after a delay
      setTimeout(() => {
        setAvatarState(prev => ({
          ...prev,
          isSpeaking: false,
          currentMood: 'neutral'
        }))
      }, 3000)

    } catch (error) {
      console.error("Error generating AI response:", error)
      setAvatarState(prev => ({
        ...prev,
        isThinking: false,
        currentMood: 'confused'
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndSession = async () => {
    if (messages.length === 0) return

    try {
      // Create a session record if we have messages
      const sessionDuration = Math.round((Date.now() - sessionStartTime) / (1000 * 60))
      const sessionData = {
        title: currentModule?.title || "Tutoring Session",
        focusArea: currentModule?.type || "general",
        goalId: selectedGoal,
        duration: {
          totalMinutes: sessionDuration
        },
        messages: messages.map(msg => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content,
          metadata: {
            messageType: msg.context?.type || "text",
            context: msg.context
          }
        }))
      }

      // Save session to backend (this will trigger summary generation)
      const sessionResponse = await api.createTutorSession(sessionData)
      
      // Create progress entry for the tutoring session
      if (sessionResponse.success && sessionResponse.data.session) {
        await api.addProgressEntry({
          goalId: selectedGoal,
          type: 'tutor',
          value: sessionDuration,
          unit: 'minutes',
          description: `Tutoring session: ${sessionData.title}`,
          metadata: {
            sessionId: sessionResponse.data.session._id,
            focusArea: sessionData.focusArea
          }
        })
      }
      
      // Show success message
      alert("Session ended successfully! A summary has been generated.")
      
      // Clear the chat
      setMessages([])
      setAvatarState(prev => ({
        ...prev,
        isSpeaking: false,
        isThinking: false,
        currentMood: 'neutral',
        energyLevel: 50,
        confidenceLevel: 50
      }))
    } catch (error) {
      console.error("Error ending session:", error)
      alert("Error ending session. Please try again.")
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setAvatarState(prev => ({
      ...prev,
      isSpeaking: false,
      isThinking: false,
      currentMood: 'neutral',
      energyLevel: 50,
      confidenceLevel: 50
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startLearningModule = (module: LearningModule) => {
    setCurrentModule(module)
    setSelectedGoal(module.goalId)

    // Update avatar state for module start
    setAvatarState(prev => ({
      ...prev,
      currentTopic: module.title,
      currentMood: 'excited',
      energyLevel: Math.min(100, prev.energyLevel + 10),
      confidenceLevel: Math.min(100, prev.confidenceLevel + 5)
    }))

    const moduleMessage: Message = {
      id: Date.now().toString(),
      type: "ai",
      content: `Great! Let's start with "${module.title}". ${module.description}. I'll guide you through this step by step. Feel free to ask questions at any time!`,
      timestamp: new Date(),
      context: {
        goalId: module.goalId,
        moduleId: module.id,
        type: "theory",
      },
    }

    setMessages((prev) => [...prev, moduleMessage])
  }

  const suggestQuestions = [
    "Explain the concept in simple terms",
    "Give me a practical example",
    "What are common mistakes to avoid?",
    "How does this apply to real projects?",
    "Can you create a practice exercise?",
  ]

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

            {/* Video Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant={isVideoEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              >
                {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
              <Button
                variant={isAudioEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              >
                {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* AI Avatar */}
              <AdvancedAvatar
                state={avatarState}
                onStateChange={(newState) => setAvatarState(prev => ({ ...prev, ...newState }))}
                personality={selectedPersonality}
                className="border-2 border-primary/20"
              />
              
              {/* AI Status */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Online & Ready</span>
                    </div>
                    {selectedGoal && (
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="truncate">
                          {goals.find((g) => g.id === selectedGoal)?.title || "Current Goal"}
                        </span>
                      </div>
                    )}
                    {currentModule && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-accent" />
                        <span className="truncate">{currentModule.title}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {aiMode === "backend" ? "Backend AI" : "Mock AI"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Avatar Personality Selector */}
              <AvatarPersonalitySelector
                personalities={defaultPersonalities}
                currentPersonality={selectedPersonality}
                onPersonalityChange={setSelectedPersonality}
              />

              {/* Learning Modules */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Learning Modules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        currentModule?.id === module.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => startLearningModule(module)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{module.title}</span>
                            {module.completed && (
                              <Badge variant="secondary" className="text-xs">
                                Done
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{module.description}</p>
                          <Badge variant="outline" className="text-xs mt-1 capitalize">
                            {module.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Questions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Quick Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {suggestQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-auto py-2 px-2 bg-transparent"
                      onClick={() => setInputMessage(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-3 flex flex-col">
              <Card className="flex-1 flex flex-col border-2">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        AI Tutor Chat
                      </CardTitle>
                      <CardDescription>
                        Ask questions, get explanations, and practice with your AI tutor
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        Active Session
                      </Badge>
                      <Badge variant="outline" className={aiMode === 'backend' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                        {aiMode === 'backend' ? 'Backend AI' : 'Mock AI'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.type === "ai" && (
                          <Avatar className="w-8 h-8 bg-gradient-to-br from-primary to-accent">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
                              AI
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            message.type === "user"
                              ? "bg-primary text-primary-foreground ml-auto"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {message.type === "user" && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-accent text-accent-foreground text-sm">U</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="w-8 h-8 bg-gradient-to-br from-primary to-accent">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
                            AI
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted text-foreground rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask a question or describe what you'd like to learn..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onFocus={() => setAvatarState(prev => ({ ...prev, isListening: true, currentMood: 'neutral' }))}
                      onBlur={() => setAvatarState(prev => ({ ...prev, isListening: false }))}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage("Can you explain this concept in simple terms?")}
                      className="bg-transparent"
                    >
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Explain
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage("Can you give me a practical example?")}
                      className="bg-transparent"
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Example
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage("Create a practice exercise for me")}
                      className="bg-transparent"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Practice
                    </Button>
                  </div>

                  {/* Session Actions */}
                  {messages.length > 0 && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEndSession}
                        className="bg-transparent"
                      >
                        <Square className="w-3 h-3 mr-1" />
                        End Session
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearChat}
                        className="bg-transparent"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Clear Chat
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
