"use client"

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isPast, isFuture } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'checkin' | 'milestone' | 'reminder';
  status: 'pending' | 'completed' | 'missed';
  goalId: string;
  goalTitle: string;
  time?: string;
  description?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  className?: string;
}

export function CalendarView({ events, onEventClick, onDateClick, className }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days to show full weeks
  const startPadding = monthStart.getDay();
  const endPadding = 6 - monthEnd.getDay();
  const allDays = [
    ...Array.from({ length: startPadding }, (_, i) => subMonths(monthStart, 1).getDate() - startPadding + i + 1).map(day => ({
      date: new Date(subMonths(monthStart, 1).getFullYear(), subMonths(monthStart, 1).getMonth(), day),
      isCurrentMonth: false
    })),
    ...monthDays.map(date => ({ date, isCurrentMonth: true })),
    ...Array.from({ length: endPadding }, (_, i) => i + 1).map(day => ({
      date: new Date(addMonths(monthStart, 1).getFullYear(), addMonths(monthStart, 1).getMonth(), day),
      isCurrentMonth: false
    }))
  ];

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'missed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'checkin': return <CheckCircle2 className="w-3 h-3" />;
      case 'milestone': return <CalendarIcon className="w-3 h-3" />;
      case 'reminder': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {allDays.map(({ date, isCurrentMonth }, index) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentDay = isToday(date);
            const isPastDay = isPast(date) && !isToday(date);
            
            return (
              <div
                key={index}
                className={cn(
                  "min-h-[100px] p-1 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                  !isCurrentMonth && "bg-gray-50 text-gray-400",
                  isCurrentDay && "bg-blue-50 border-blue-200",
                  isPastDay && "bg-gray-25"
                )}
                onClick={() => onDateClick?.(date)}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isCurrentDay && "text-blue-600 font-bold",
                  !isCurrentMonth && "text-gray-400"
                )}>
                  {format(date, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        "text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow",
                        getEventStatusColor(event.status)
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {getEventTypeIcon(event.type)}
                        <span className="truncate">{event.title}</span>
                      </div>
                      {event.time && (
                        <div className="text-xs opacity-75">{event.time}</div>
                      )}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Event detail modal component
interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{event.title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-600">Goal</div>
            <div className="text-sm">{event.goalTitle}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-600">Date & Time</div>
            <div className="text-sm">
              {format(event.date, 'EEEE, MMMM d, yyyy')}
              {event.time && ` at ${event.time}`}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-600">Status</div>
            <Badge className={cn(
              "text-xs",
              event.status === 'completed' && "bg-green-100 text-green-800",
              event.status === 'missed' && "bg-red-100 text-red-800",
              event.status === 'pending' && "bg-blue-100 text-blue-800"
            )}>
              {event.status}
            </Badge>
          </div>
          
          {event.description && (
            <div>
              <div className="text-sm font-medium text-gray-600">Description</div>
              <div className="text-sm">{event.description}</div>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button className="flex-1" onClick={onClose}>
              Close
            </Button>
            {event.type === 'checkin' && event.status === 'pending' && (
              <Button variant="outline" className="flex-1">
                Complete Check-in
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
