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
  Settings,
  Zap,
  Heart,
  Star
} from 'lucide-react';

export interface AdvancedAvatarState {
  isSpeaking: boolean;
  isThinking: boolean;
  isListening: boolean;
  currentMood: 'neutral' | 'happy' | 'excited' | 'thinking' | 'explaining' | 'confused' | 'encouraging';
  currentTopic?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isLookingAtUser: boolean;
  energyLevel: number; // 0-100
  confidenceLevel: number; // 0-100
}

interface AdvancedAvatarProps {
  state: AdvancedAvatarState;
  onStateChange: (newState: Partial<AdvancedAvatarState>) => void;
  personality: {
    id: string;
    name: string;
    color: string;
    icon: React.ReactNode;
    style: 'professional' | 'friendly' | 'energetic' | 'wise';
  };
  className?: string;
}

export function AdvancedAvatar({ state, onStateChange, personality, className }: AdvancedAvatarProps) {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Animation loop for speaking
  useEffect(() => {
    if (state.isSpeaking) {
      const interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 4);
        setPulseIntensity(prev => Math.min(100, prev + 10));
      }, 150);
      return () => clearInterval(interval);
    } else {
      setAnimationPhase(0);
      setPulseIntensity(0);
    }
  }, [state.isSpeaking]);

  // Energy pulse effect
  useEffect(() => {
    if (state.energyLevel > 70) {
      const interval = setInterval(() => {
        setPulseIntensity(prev => (prev + 5) % 100);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [state.energyLevel]);


  const getMoodColor = () => {
    switch (state.currentMood) {
      case 'happy': return 'from-green-400 to-green-600';
      case 'excited': return 'from-yellow-400 to-orange-500';
      case 'thinking': return 'from-blue-400 to-blue-600';
      case 'explaining': return 'from-purple-400 to-purple-600';
      case 'confused': return 'from-orange-400 to-red-500';
      case 'encouraging': return 'from-pink-400 to-purple-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getMoodIcon = () => {
    switch (state.currentMood) {
      case 'happy': return <Sparkles className="w-5 h-5" />;
      case 'excited': return <Zap className="w-5 h-5" />;
      case 'thinking': return <Brain className="w-5 h-5" />;
      case 'explaining': return <MessageCircle className="w-5 h-5" />;
      case 'confused': return <Target className="w-5 h-5" />;
      case 'encouraging': return <Heart className="w-5 h-5" />;
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
      case 'encouraging': return 'You can do it!';
      default: return 'Ready to assist';
    }
  };

  const getPersonalityStyle = () => {
    switch (personality.style) {
      case 'professional': return 'border-blue-200 shadow-lg';
      case 'friendly': return 'border-green-200 shadow-md';
      case 'energetic': return 'border-yellow-200 shadow-xl animate-pulse';
      case 'wise': return 'border-purple-200 shadow-2xl';
      default: return 'border-gray-200 shadow-md';
    }
  };

  return (
    <Card className={cn("relative overflow-hidden", getPersonalityStyle(), className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {personality.icon}
          {personality.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Avatar Display */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Energy Ring */}
            {state.energyLevel > 50 && (
              <div 
                className="absolute inset-0 w-36 h-36 rounded-full border-2 border-yellow-400 opacity-30 animate-spin"
                style={{ 
                  animationDuration: `${Math.max(1, 3 - (state.energyLevel / 50))}s`,
                  borderColor: `hsl(${60 + (state.energyLevel / 2)}, 100%, 50%)`
                }}
              />
            )}
            
            {/* Background Glow */}
            <div className={cn(
              "absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r opacity-40 blur-xl",
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
                state.isThinking && "scale-95",
                state.energyLevel > 80 && "animate-bounce"
              )}
            >
              {/* Personality Icon */}
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="text-white text-4xl">
                  {personality.icon}
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

              {/* Confidence Indicator */}
              {state.confidenceLevel > 80 && (
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
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

          {/* Energy and Confidence Bars */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Energy</span>
              <span>{state.energyLevel}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${state.energyLevel}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span>Confidence</span>
              <span>{state.confidenceLevel}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-blue-400 to-purple-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${state.confidenceLevel}%` }}
              />
            </div>
          </div>
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
