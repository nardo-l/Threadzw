import { supabase } from './supabase';

export type UsageEventType = 'shop_visit' | 'shop_view' | 'whatsapp_click' | 'visit_shop_click' | 'map_open';

export interface UsageResult {
  counted: boolean;
  current_visits: number;
  current_interests: number;
  quota_exceeded: boolean;
  reason: string;
}

const VISITOR_STORAGE_KEY = 'threadzw_visitor_id';

export function getPersistentVisitorId(): string {
  if (typeof window === 'undefined') return 'server-visitor';
  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) return existing;
  const visitorId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `visitor-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
  return visitorId;
}

export async function recordShopUsageEvent(shopId: string, eventType: UsageEventType): Promise<UsageResult> {
  if (!shopId) throw new Error('SHOP_ID_REQUIRED');
  const visitorId = getPersistentVisitorId();
  const utcDate = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase.rpc('record_shop_usage_event', {
    p_shop_id: shopId,
    p_visitor_id: visitorId,
    p_event_type: eventType,
    p_utc_date: utcDate
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('USAGE_RPC_EMPTY_RESPONSE');

  return {
    counted: Boolean(row.counted),
    current_visits: Number(row.current_visits || 0),
    current_interests: Number(row.current_interests || 0),
    quota_exceeded: Boolean(row.quota_exceeded),
    reason: String(row.reason || '')
  };
}

export async function canContinueShopAction(shopId: string, eventType: UsageEventType): Promise<UsageResult> {
  return recordShopUsageEvent(shopId, eventType);
}
