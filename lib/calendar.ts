import { saveAs } from 'file-saver';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  url?: string;
}

export interface CheckinEvent extends CalendarEvent {
  goalId: string;
  goalTitle: string;
  type: 'scheduled' | 'reminder';
}

export class CalendarService {
  /**
   * Generate and download iCal file for check-ins
   */
  static generateICalFile(events: CheckinEvent[], goalTitle?: string): void {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    
    let icalString = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AI Learning Platform//Learning Goals//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${goalTitle ? `${goalTitle} - Check-ins` : 'Learning Goal Check-ins'}`,
      `X-WR-CALDESC:Scheduled check-ins for your learning goals`,
      `X-WR-TIMEZONE:${timezone}`,
    ].join('\r\n') + '\r\n';

    events.forEach(event => {
      const startDate = this.formatDateForICal(event.start);
      const endDate = this.formatDateForICal(event.end);
      const createdDate = this.formatDateForICal(now);
      const uid = `${event.id}@ailearningplatform.com`;
      
      icalString += [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `DTSTAMP:${createdDate}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || `Check-in for ${event.goalTitle}`}`,
        event.location ? `LOCATION:${event.location}` : '',
        event.url ? `URL:${event.url}` : '',
        'ORGANIZER:CN=AI Learning Platform:MAILTO:noreply@ailearningplatform.com',
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      ].filter(line => line !== '').join('\r\n') + '\r\n';
    });

    icalString += 'END:VCALENDAR\r\n';

    const blob = new Blob([icalString], { type: 'text/calendar;charset=utf-8' });
    const fileName = goalTitle 
      ? `${goalTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_checkins.ics`
      : 'learning_checkins.ics';
    
    saveAs(blob, fileName);
  }

  /**
   * Format date for iCal format
   */
  private static formatDateForICal(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  /**
   * Generate Google Calendar URL
   */
  static generateGoogleCalendarUrl(event: CheckinEvent): string {
    const startDate = event.start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = event.end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startDate}/${endDate}`,
      details: event.description || `Check-in for ${event.goalTitle}`,
      location: event.location || '',
      trp: 'false'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Generate Outlook Calendar URL
   */
  static generateOutlookCalendarUrl(event: CheckinEvent): string {
    const startDate = event.start.toISOString();
    const endDate = event.end.toISOString();
    
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      startdt: startDate,
      enddt: endDate,
      body: event.description || `Check-in for ${event.goalTitle}`,
      location: event.location || ''
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  /**
   * Convert check-in data to calendar events
   */
  static convertCheckinsToEvents(checkins: any[], goalTitle: string): CheckinEvent[] {
    return checkins.map(checkin => ({
      id: checkin._id || checkin.id,
      title: `Check-in: ${goalTitle}`,
      description: `Scheduled check-in for your learning progress in ${goalTitle}`,
      start: new Date(checkin.scheduledFor),
      end: new Date(new Date(checkin.scheduledFor).getTime() + 30 * 60 * 1000), // 30 minutes duration
      goalId: checkin.goal,
      goalTitle,
      type: checkin.type || 'scheduled',
      location: 'AI Learning Platform',
      url: `${typeof window !== 'undefined' ? window.location.origin : 'https://ailearningplatform.com'}/dashboard/schedule?goalId=${checkin.goal}`
    }));
  }

  /**
   * Get calendar export options
   */
  static getExportOptions(): Array<{
    name: string;
    action: (events: CheckinEvent[], goalTitle?: string) => void;
    icon: string;
  }> {
    return [
      {
        name: 'Download iCal File',
        action: (events, goalTitle) => this.generateICalFile(events, goalTitle),
        icon: '📅'
      },
      {
        name: 'Add to Google Calendar',
        action: (events) => {
          if (events.length === 1) {
            window.open(this.generateGoogleCalendarUrl(events[0]), '_blank');
          } else {
            // For multiple events, download iCal file
            this.generateICalFile(events);
          }
        },
        icon: '📊'
      },
      {
        name: 'Add to Outlook',
        action: (events) => {
          if (events.length === 1) {
            window.open(this.generateOutlookCalendarUrl(events[0]), '_blank');
          } else {
            // For multiple events, download iCal file
            this.generateICalFile(events);
          }
        },
        icon: '📧'
      }
    ];
  }
}
