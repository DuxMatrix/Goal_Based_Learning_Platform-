"use client"

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './card';
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
  VolumeX,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';

export interface AvatarDisplayState {
  isSpeaking: boolean;
  isThinking: boolean;
  isListening: boolean;
  currentMood: 'neutral' | 'happy' | 'excited' | 'thinking' | 'explaining' | 'confused';
  currentTopic?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isLookingAtUser: boolean;
}

interface AvatarDisplayProps {
  state: AvatarDisplayState;
  onStateChange: (newState: Partial<AvatarDisplayState>) => void;
  className?: string;
}

export function AvatarDisplay({ state, onStateChange, className }: AvatarDisplayProps) {
  const [animationPhase, setAnimationPhase] = useState(0);
  const avatarRef = useRef<HTMLDivElement>(null);
  const eyeRef = useRef<HTMLDivElement>(null);

  // Animation loop for speaking
  useEffect(() => {
    if (state.isSpeaking) {
      const interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 4);
      }, 200);
      return () => clearInterval(interval);
    } else {
      setAnimationPhase(0);
    }
  }, [state.isSpeaking]);

  // Eye movement animation
  useEffect(() => {
    if (eyeRef.current && state.isLookingAtUser) {
      const eye = eyeRef.current;
      const moveEye = () => {
        const randomX = (Math.random() - 0.5) * 4;
        const randomY = (Math.random() - 0.5) * 2;
        eye.style.transform = `translate(${randomX}px, ${randomY}px)`;
      };
      
      const interval = setInterval(moveEye, 2000);
      return () => clearInterval(interval);
    }
  }, [state.isLookingAtUser]);

  const getMoodColor = () => {
    switch (state.currentMood) {
      case 'happy': return 'from-green-400 to-green-600';
      case 'excited': return 'from-yellow-400 to-orange-500';
      case 'thinking': return 'from-blue-400 to-blue-600';
      case 'explaining': return 'from-purple-400 to-purple-600';
      case 'confused': return 'from-orange-400 to-red-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getMoodIcon = () => {
    switch (state.currentMood) {
      case 'happy': return <Sparkles className="w-5 h-5" />;
      case 'excited': return <Lightbulb className="w-5 h-5" />;
      case 'thinking': return <Brain className="w-5 h-5" />;
      case 'explaining': return <MessageCircle className="w-5 h-5" />;
      case 'confused': return <Target className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getMoodText = () => {
    switch (state.currentMood) {
      case 'happy': return 'Happy to help!';
      case 'excited': return 'Excited to teach!';
      case 'thinking': return 'Thinking...';
      case 'explaining': return 'Explaining concept';
      case 'confused': return 'Need clarification';
      default: return 'Ready to assist';
    }
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Tutor Avatar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Avatar Display */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Background Glow */}
            <div className={cn(
              "absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r opacity-30 blur-xl",
              getMoodColor(),
              state.isSpeaking && "animate-pulse"
            )} />
            
            {/* Avatar Face */}
            <div
              ref={avatarRef}
              className={cn(
                "relative w-32 h-32 rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-2xl transition-all duration-500",
                getMoodColor(),
                state.isSpeaking && "scale-110",
                state.isThinking && "scale-95"
              )}
            >
              {/* Face Elements */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Eyes */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex gap-4">
                  <div className="w-3 h-3 bg-white rounded-full relative">
                    <div 
                      ref={eyeRef}
                      className="absolute top-0.5 left-0.5 w-2 h-2 bg-black rounded-full transition-transform duration-300"
                    />
                  </div>
                  <div className="w-3 h-3 bg-white rounded-full relative">
                    <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-black rounded-full" />
                  </div>
                </div>
                
                {/* Mouth */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  {state.isSpeaking ? (
                    <div className="flex gap-1">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1 h-1 bg-white rounded-full transition-all duration-200",
                            animationPhase === i && "h-2"
                          )}
                        />
                      ))}
                    </div>
                  ) : state.currentMood === 'happy' ? (
                    <div className="w-6 h-3 border-2 border-white border-t-0 rounded-b-full" />
                  ) : state.currentMood === 'thinking' ? (
                    <div className="w-4 h-1 bg-white rounded-full" />
                  ) : (
                    <div className="w-4 h-1 bg-white rounded-full" />
                  )}
                </div>
                
                {/* Central Icon */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  {getMoodIcon()}
                </div>
              </div>
              
              {/* Status Indicators */}
              {state.isSpeaking && (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <Mic className="w-3 h-3 text-white" />
                </div>
              )}
              
              {state.isThinking && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                  <Brain className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {getMoodIcon()}
              {getMoodText()}
            </Badge>
          </div>
          
          {state.currentTopic && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {state.currentTopic}
            </Badge>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={state.isVideoEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => onStateChange({ isVideoEnabled: !state.isVideoEnabled })}
            className="h-8 w-8 p-0"
          >
            {state.isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>
          
          <Button
            variant={state.isAudioEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => onStateChange({ isAudioEnabled: !state.isAudioEnabled })}
            className="h-8 w-8 p-0"
          >
            {state.isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          
          <Button
            variant={state.isLookingAtUser ? "default" : "outline"}
            size="sm"
            onClick={() => onStateChange({ isLookingAtUser: !state.isLookingAtUser })}
            className="h-8 w-8 p-0"
          >
            {state.isLookingAtUser ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
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
          {!state.isSpeaking && !state.isThinking && !state.isListening && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full" />
              <span>Idle</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
