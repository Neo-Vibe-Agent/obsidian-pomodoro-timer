import { requestUrl } from 'obsidian';
import { PomodoroSettings, CalendarEvent } from './types';

export class CalendarSync {
  private settings: PomodoroSettings;
  private events: CalendarEvent[] = [];
  private lastFetch: number = 0;
  private fetchInterval: number = 5 * 60 * 1000; // 5 min cache

  constructor(settings: PomodoroSettings) {
    this.settings = settings;
  }

  updateSettings(settings: PomodoroSettings): void {
    this.settings = settings;
  }

  async getUpcomingEvents(): Promise<CalendarEvent[]> {
    if (!this.settings.calendarSyncEnabled || !this.settings.googleCalendarId) {
      return [];
    }

    // Use cache if fresh
    if (Date.now() - this.lastFetch < this.fetchInterval && this.events.length > 0) {
      return this.filterUpcoming(this.events);
    }

    try {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      // Google Calendar API (requires API key in settings)
      // For v1, we use the public iCal feed which doesn't require OAuth
      const calId = encodeURIComponent(this.settings.googleCalendarId);
      const timeMin = now.toISOString();
      const timeMax = endOfDay.toISOString();

      // Note: requires a Google API key (not just calendar ID) for v2
      // For now, try the public calendar endpoint which works for public calendars
      const response = await requestUrl({
        url: `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        method: 'GET',
      });

      if (response.status === 200) {
        const data = response.json;
        this.events = (data.items || []).map((item: any) => ({
          title: item.summary || 'Untitled',
          start: new Date(item.start.dateTime || item.start.date),
          end: new Date(item.end.dateTime || item.end.date),
          isAllDay: !item.start.dateTime,
        }));
        this.lastFetch = Date.now();
      }
    } catch (e) {
      console.warn('Pomodoro: Calendar sync failed', e);
    }

    return this.filterUpcoming(this.events);
  }

  getNextEvent(): CalendarEvent | null {
    const upcoming = this.filterUpcoming(this.events);
    return upcoming.length > 0 ? upcoming[0] : null;
  }

  getAvailablePomodoros(workDuration: number): number {
    const next = this.getNextEvent();
    if (!next) return Infinity;

    const minutesUntil = Math.floor((next.start.getTime() - Date.now()) / 60000);
    return Math.floor(minutesUntil / (workDuration + 5)); // +5 for break
  }

  private filterUpcoming(events: CalendarEvent[]): CalendarEvent[] {
    const now = new Date();
    return events
      .filter(e => e.end > now && !e.isAllDay)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }
}
