'use server';

import type { Holiday } from '@/lib/types';

export async function getNationalHolidays(
  timeMin: string,
  timeMax: string
): Promise<Holiday[]> {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    console.warn(
      'Google Calendar API key is missing or is a placeholder. National holidays will not be displayed. Please add it to your .env file.'
    );
    return [];
  }

  const calendarId = 'en.indonesian#holiday@group.v.calendar.google.com';

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId
  )}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 * 24 } }); // Revalidate once a day
    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        'Failed to fetch holidays:',
        response.status,
        response.statusText,
        errorData
      );
      return [];
    }
    const data = await response.json();
    if (!data.items) {
      return [];
    }

    return data.items.map(
      (item: any): Holiday => ({
        id: `holiday-${item.id}`,
        // Google all-day events have a `date` property, not `dateTime`.
        // The end date for all-day events is exclusive.
        startDate: new Date(item.start.date || item.start.dateTime),
        endDate: new Date(
          new Date(item.end.date || item.end.dateTime).getTime() -
            (item.start.date ? 24 * 60 * 60 * 1000 : 0)
        ),
        title: item.summary,
        type: 'holiday',
      })
    );
  } catch (error) {
    console.error('Error fetching national holidays:', error);
    return [];
  }
}
