"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Target,
  Clock,
  Award,
  RefreshCw,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

interface Question {
  id: string
  type: "multiple-choice" | "code" | "explanation"
  question: string
  options?: string[]
  correctAnswer?: string
  explanation: string
  difficulty: "easy" | "medium" | "hard"
  topic: string
}

interface PracticeSession {
  id: string
  title: string
  description: string
  questions: Question[]
  timeLimit?: number
  passingScore: number
}

export default function PracticePage() {
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // Mock practice sessions
  const practiceSessions: PracticeSession[] = [
    {
      id: "ml-basics",
      title: "Machine Learning Fundamentals",
      description: "Test your understanding of basic ML concepts and algorithms",
      timeLimit: 15,
      passingScore: 70,
      questions: [
        {
          id: "q1",
          type: "multiple-choice",
          question: "What is the main goal of supervised learning?",
          options: [
            "To find hidden patterns in unlabeled data",
            "To learn from labeled examples to make predictions",
            "To maximize rewards through trial and error",
            "To reduce the dimensionality of data",
          ],
          correctAnswer: "To learn from labeled examples to make predictions",
          explanation:
            "Supervised learning uses labeled training data to learn a mapping from inputs to outputs, enabling predictions on new, unseen data.",
          difficulty: "easy",
          topic: "Supervised Learning",
        },
        {
          id: "q2",
          type: "multiple-choice",
          question: "Which algorithm is best suited for linear relationships?",
          options: ["Decision Trees", "Linear Regression", "K-Means Clustering", "Neural Networks"],
          correctAnswer: "Linear Regression",
          explanation:
            "Linear regression is specifically designed to model linear relationships between variables, making it the best choice for this scenario.",
          difficulty: "easy",
          topic: "Regression",
        },
        {
          id: "q3",
          type: "explanation",
          question: "Explain the concept of overfitting and how to prevent it.",
          explanation:
            "Overfitting occurs when a model learns the training data too well, including noise, leading to poor generalization. Prevention methods include cross-validation, regularization, early stopping, and using more training data.",
          difficulty: "medium",
          topic: "Model Validation",
        },
      ],
    },
    {
      id: "react-hooks",
      title: "React Hooks Mastery",
      description: "Practice advanced React hooks concepts and patterns",
      timeLimit: 20,
      passingScore: 80,
      questions: [
        {
          id: "q1",
          type: "multiple-choice",
          question: "When should you use useCallback?",
          options: [
            "To memoize expensive calculations",
            "To memoize function references",
            "To manage component state",
            "To handle side effects",
          ],
          correctAnswer: "To memoize function references",
          explanation:
            "useCallback memoizes function references to prevent unnecessary re-renders of child components that depend on those functions.",
          difficulty: "medium",
          topic: "Performance Optimization",
        },
      ],
    },
  ]

  const startSession = (session: PracticeSession) => {
    setCurrentSession(session)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResults(false)
    setSessionComplete(false)
    if (session.timeLimit) {
      setTimeRemaining(session.timeLimit * 60) // Convert to seconds
    }
  }

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const nextQuestion = () => {
    if (currentSession && currentQuestionIndex < currentSession.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      completeSession()
    }
  }

  const completeSession = () => {
    setSessionComplete(true)
    setShowResults(true)
  }

  const calculateScore = () => {
    if (!currentSession) return 0
    const correctAnswers = currentSession.questions.filter((q) => {
      if (q.type === "multiple-choice") {
        return answers[q.id] === q.correctAnswer
      }
      return answers[q.id] && answers[q.id].length > 20 // Basic check for explanation questions
    }).length
    return Math.round((correctAnswers / currentSession.questions.length) * 100)
  }

  const resetSession = () => {
    setCurrentSession(null)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResults(false)
    setSessionComplete(false)
    setTimeRemaining(null)
  }

  if (!currentSession) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
          {/* Header */}
          <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/tutor">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Tutor
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
              <h1 className="text-3xl font-bold mb-2">Practice Sessions</h1>
              <p className="text-muted-foreground">Test your knowledge with interactive practice exercises</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {practiceSessions.map((session) => (
                <Card key={session.id} className="border-2 hover:border-primary/20 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      {session.title}
                    </CardTitle>
                    <CardDescription>{session.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">{session.questions.length} questions</span>
                        {session.timeLimit && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.timeLimit} min
                          </span>
                        )}
                      </div>
                      <Badge variant="outline">Pass: {session.passingScore}%</Badge>
                    </div>

                    <div className="flex gap-2">
                      {session.questions.map((q, index) => (
                        <div
                          key={q.id}
                          className={`w-3 h-3 rounded-full ${
                            q.difficulty === "easy"
                              ? "bg-green-200"
                              : q.difficulty === "medium"
                                ? "bg-yellow-200"
                                : "bg-red-200"
                          }`}
                          title={`Question ${index + 1} - ${q.difficulty}`}
                        />
                      ))}
                    </div>

                    <Button onClick={() => startSession(session)} className="w-full">
                      Start Practice Session
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const currentQuestion = currentSession.questions[currentQuestionIndex]
  const score = calculateScore()

  if (showResults) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
          <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-primary">LearnAI</span>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Card className="border-2">
              <CardContent className="p-12 text-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                    score >= currentSession.passingScore ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {score >= currentSession.passingScore ? (
                    <Award className="w-10 h-10 text-green-600" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-600" />
                  )}
                </div>

                <h2 className="text-3xl font-bold mb-4">
                  {score >= currentSession.passingScore ? "Congratulations!" : "Keep Learning!"}
                </h2>

                <div className="text-6xl font-bold mb-4 text-primary">{score}%</div>

                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {score >= currentSession.passingScore
                    ? "You've successfully completed this practice session!"
                    : `You need ${currentSession.passingScore}% to pass. Review the concepts and try again.`}
                </p>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{currentSession.questions.length}</div>
                    <div className="text-sm text-muted-foreground">Total Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {currentSession.questions.filter((q) => answers[q.id] === q.correctAnswer).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Correct Answers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">{currentSession.passingScore}%</div>
                    <div className="text-sm text-muted-foreground">Passing Score</div>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={resetSession}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Link href="/dashboard/tutor">
                    <Button>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Tutor
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">LearnAI</span>
            </div>
            {timeRemaining && (
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                <Clock className="w-3 h-3 mr-1" />
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
              </Badge>
            )}
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{currentSession.title}</h1>
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {currentSession.questions.length}
              </Badge>
            </div>
            <Progress value={((currentQuestionIndex + 1) / currentSession.questions.length) * 100} className="h-2" />
          </div>

          {/* Question */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    currentQuestion.difficulty === "easy"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : currentQuestion.difficulty === "medium"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-red-50 text-red-700 border-red-200"
                  }
                >
                  {currentQuestion.difficulty}
                </Badge>
              </div>
              <CardDescription>{currentQuestion.topic}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === "explanation" && (
                <div className="space-y-2">
                  <Label htmlFor="explanation">Your Answer:</Label>
                  <Textarea
                    id="explanation"
                    placeholder="Provide a detailed explanation..."
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    rows={6}
                  />
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={nextQuestion}
                  disabled={!answers[currentQuestion.id]}
                  className={
                    currentQuestionIndex === currentSession.questions.length - 1
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }
                >
                  {currentQuestionIndex === currentSession.questions.length - 1 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Complete
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Hint */}
          <Card className="mt-6 bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Hint</h4>
                  <p className="text-sm text-muted-foreground">
                    Think about the fundamental concepts we've covered. If you're unsure, consider the context and
                    practical applications.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
