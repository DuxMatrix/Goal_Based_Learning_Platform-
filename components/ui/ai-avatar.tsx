"use client"

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { 
  Brain, 
  MessageCircle, 
  Lightbulb, 
  BookOpen, 
  Target, 
  Sparkles,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX
} from 'lucide-react';

export interface AvatarState {
  isSpeaking: boolean;
  isThinking: boolean;
  isListening: boolean;
  currentMood: 'neutral' | 'happy' | 'excited' | 'thinking' | 'explaining';
  currentTopic?: string;
}

export interface AvatarPersonality {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  characteristics: string[];
  style?: 'professional' | 'friendly' | 'energetic' | 'wise';
}

interface AIAvatarProps {
  state: AvatarState;
  personality?: AvatarPersonality;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showControls?: boolean;
  onVideoToggle?: (enabled: boolean) => void;
  onAudioToggle?: (enabled: boolean) => void;
  className?: string;
}

const defaultPersonalities: AvatarPersonality[] = [
  {
    id: 'professor',
    name: 'Professor AI',
    description: 'Knowledgeable and patient teacher',
    color: 'bg-blue-500',
    icon: <Brain className="w-6 h-6" />,
    characteristics: ['Patient', 'Detailed', 'Academic'],
    style: 'professional'
  },
  {
    id: 'mentor',
    name: 'Mentor AI',
    description: 'Encouraging and supportive guide',
    color: 'bg-green-500',
    icon: <Lightbulb className="w-6 h-6" />,
    characteristics: ['Supportive', 'Encouraging', 'Practical'],
    style: 'friendly'
  },
  {
    id: 'tutor',
    name: 'Tutor AI',
    description: 'Interactive and engaging instructor',
    color: 'bg-purple-500',
    icon: <BookOpen className="w-6 h-6" />,
    characteristics: ['Interactive', 'Engaging', 'Adaptive'],
    style: 'energetic'
  },
  {
    id: 'sage',
    name: 'Sage AI',
    description: 'Wise and experienced advisor',
    color: 'bg-indigo-500',
    icon: <Sparkles className="w-6 h-6" />,
    characteristics: ['Wise', 'Experienced', 'Insightful'],
    style: 'wise'
  }
];

export function AIAvatar({
  state,
  personality = defaultPersonalities[0],
  size = 'lg',
  showControls = true,
  onVideoToggle,
  onAudioToggle,
  className
}: AIAvatarProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [currentPersonality, setCurrentPersonality] = useState(personality);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-16 h-16', avatar: 'w-12 h-12', text: 'text-xs' },
    md: { container: 'w-24 h-24', avatar: 'w-20 h-20', text: 'text-sm' },
    lg: { container: 'w-32 h-32', avatar: 'w-28 h-28', text: 'text-base' },
    xl: { container: 'w-48 h-48', avatar: 'w-44 h-44', text: 'text-lg' }
  };

  const config = sizeConfig[size];

  // Animation effects based on state
  useEffect(() => {
    if (avatarRef.current) {
      const avatar = avatarRef.current;
      
      // Remove existing animation classes
      avatar.classList.remove('animate-pulse', 'animate-bounce', 'animate-ping');
      
      if (state.isSpeaking) {
        avatar.classList.add('animate-pulse');
      } else if (state.isThinking) {
        avatar.classList.add('animate-ping');
      } else if (state.isListening) {
        avatar.classList.add('animate-bounce');
      }
    }
  }, [state.isSpeaking, state.isThinking, state.isListening]);

  const getMoodColor = () => {
    switch (state.currentMood) {
      case 'happy': return 'from-green-400 to-green-600';
      case 'excited': return 'from-yellow-400 to-orange-500';
      case 'thinking': return 'from-blue-400 to-blue-600';
      case 'explaining': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getMoodIcon = () => {
    switch (state.currentMood) {
      case 'happy': return <Sparkles className="w-4 h-4" />;
      case 'excited': return <Lightbulb className="w-4 h-4" />;
      case 'thinking': return <Brain className="w-4 h-4" />;
      case 'explaining': return <MessageCircle className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const handleVideoToggle = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    onVideoToggle?.(newState);
  };

  const handleAudioToggle = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    onAudioToggle?.(newState);
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar Container */}
          <div className="relative">
            {/* Background Glow Effect */}
            <div className={cn(
              "absolute inset-0 rounded-full bg-gradient-to-r opacity-20 blur-lg",
              getMoodColor(),
              state.isSpeaking && "animate-pulse"
            )} />
            
            {/* Main Avatar */}
            <div
              ref={avatarRef}
              className={cn(
                "relative rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-lg transition-all duration-300",
                config.avatar,
                getMoodColor(),
                state.isSpeaking && "scale-105",
                state.isThinking && "scale-95"
              )}
            >
              {/* Avatar Face/Icon */}
              <div className="relative z-10">
                {currentPersonality.icon}
              </div>
              
              {/* Speaking Indicator */}
              {state.isSpeaking && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping" />
              )}
              
              {/* Thinking Indicator */}
              {state.isThinking && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>

          {/* Avatar Info */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h3 className={cn("font-semibold", config.text)}>
                {currentPersonality.name}
              </h3>
              <div className="flex items-center gap-1 text-muted-foreground">
                {getMoodIcon()}
                <span className="text-xs capitalize">{state.currentMood}</span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground max-w-32 text-center">
              {currentPersonality.description}
            </p>
            
            {/* Current Topic */}
            {state.currentTopic && (
              <Badge variant="outline" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                {state.currentTopic}
              </Badge>
            )}
          </div>

          {/* Controls */}
          {showControls && (
            <div className="flex items-center gap-2">
              <Button
                variant={isVideoEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleVideoToggle}
                className="h-8 w-8 p-0"
              >
                {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
              
              <Button
                variant={isAudioEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleAudioToggle}
                className="h-8 w-8 p-0"
              >
                {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
          )}

          {/* Status Indicators */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {state.isSpeaking && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Speaking</span>
              </div>
            )}
            {state.isThinking && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>Thinking</span>
              </div>
            )}
            {state.isListening && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span>Listening</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Avatar Personality Selector Component
interface AvatarPersonalitySelectorProps {
  personalities: AvatarPersonality[];
  currentPersonality: AvatarPersonality;
  onPersonalityChange: (personality: AvatarPersonality) => void;
  className?: string;
}

export function AvatarPersonalitySelector({
  personalities,
  currentPersonality,
  onPersonalityChange,
  className
}: AvatarPersonalitySelectorProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h4 className="text-sm font-semibold mb-3">Choose Your AI Tutor</h4>
        <div className="space-y-2">
          {personalities.map((personality) => (
            <div
              key={personality.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                currentPersonality.id === personality.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted/50"
              )}
              onClick={() => onPersonalityChange(personality)}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white",
                personality.color
              )}>
                {personality.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{personality.name}</div>
                <div className="text-xs text-muted-foreground">
                  {personality.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Export default personalities for easy access
export { defaultPersonalities };
