import { supabase } from '../lib/supabase';

export interface NotificationPreferences {
  profile_id?: string;
  timezone: string;
  setup_reminders_enabled: boolean;
  daily_summary_enabled: boolean;
  push_enabled: boolean;
}

const defaultPreferences: NotificationPreferences = {
  timezone: 'Africa/Harare',
  setup_reminders_enabled: true,
  daily_summary_enabled: true,
  push_enabled: true
};

async function getAuthHeaders(includeJson = false): Promise<Record<string, string> | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${session.access_token}`
  };
}

export async function fetchNotifications() {
  const headers = await getAuthHeaders();
  if (!headers) return { notifications: [], unreadCount: 0 };
  const response = await fetch('/api/notifications', { headers });
  if (!response.ok) throw new Error('Failed to load notifications');
  return response.json();
}

export async function markAllNotificationsRead() {
  const headers = await getAuthHeaders(true);
  if (!headers) throw new Error('Not authenticated');
  const response = await fetch('/api/notifications/mark-read', {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  });
  if (!response.ok) throw new Error('Failed to update notifications');
  return response.json();
}

export async function markNotificationRead(notificationId: string) {
  const headers = await getAuthHeaders(true);
  if (!headers) throw new Error('Not authenticated');
  const response = await fetch('/api/notifications/mark-one', {
    method: 'POST',
    headers,
    body: JSON.stringify({ notificationId })
  });
  if (!response.ok) throw new Error('Failed to update notification');
  return response.json();
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const headers = await getAuthHeaders();
  if (!headers) return defaultPreferences;
  const response = await fetch('/api/notifications/preferences', { headers });
  if (!response.ok) throw new Error('Failed to load notification preferences');
  const data = await response.json();
  return { ...defaultPreferences, ...(data.preferences || {}) };
}

export async function saveNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const headers = await getAuthHeaders(true);
  if (!headers) throw new Error('Not authenticated');
  const response = await fetch('/api/notifications/preferences', {
    method: 'PUT',
    headers,
    body: JSON.stringify(preferences)
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Failed to save notification preferences');
  }
  const data = await response.json();
  return { ...defaultPreferences, ...(data.preferences || {}) };
}
