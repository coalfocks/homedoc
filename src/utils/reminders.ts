export type ReminderInput = {
  date: string;
  time: string;
};

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

const pad = (value: number) => value.toString().padStart(2, '0');

export const splitReminderAt = (value?: string | null): ReminderInput => {
  if (!value) return { date: '', time: '' };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };

  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
};

export const parseReminderInput = ({
  date,
  time,
}: ReminderInput): { reminderAt: string | null; error: string | null } => {
  const cleanDate = date.trim();
  const cleanTime = time.trim();

  if (!cleanDate && !cleanTime) {
    return { reminderAt: null, error: null };
  }

  const dateMatch = cleanDate.match(DATE_PATTERN);
  if (!dateMatch) {
    return { reminderAt: null, error: 'Use reminder date format YYYY-MM-DD.' };
  }

  const [, yearValue, monthValue, dayValue] = dateMatch;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  let hour = 9;
  let minute = 0;

  if (cleanTime) {
    const timeMatch = cleanTime.match(TIME_PATTERN);
    if (!timeMatch) {
      return { reminderAt: null, error: 'Use reminder time format HH:MM.' };
    }

    hour = Number(timeMatch[1]);
    minute = Number(timeMatch[2]);
  }

  if (hour > 23 || minute > 59) {
    return { reminderAt: null, error: 'Use a valid reminder time.' };
  }

  const reminderDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    reminderDate.getFullYear() !== year ||
    reminderDate.getMonth() !== month - 1 ||
    reminderDate.getDate() !== day
  ) {
    return { reminderAt: null, error: 'Use a valid reminder date.' };
  }

  return { reminderAt: reminderDate.toISOString(), error: null };
};

export const formatReminder = (value?: string | null): string | null => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
