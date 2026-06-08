import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mapError(error: any): string {
  if (!error) return 'An unknown error occurred';
  
  const message = error.message || String(error);
  const lowerMessage = message.toLowerCase();
  
  if (
    lowerMessage.includes('failed to fetch') || 
    lowerMessage.includes('fetch') || 
    lowerMessage.includes('network') ||
    lowerMessage.includes('load failed')
  ) {
    return 'Connection error. Please check your internet or retry.';
  }
  
  if (lowerMessage.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }

  if (
    lowerMessage.includes('invalid api key') || 
    lowerMessage.includes('api key') || 
    lowerMessage.includes('apikey')
  ) {
    return 'Invalid Supabase API Key. Please make sure you have configured the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables in your Vercel (or hosting) project dashboard, then redeployed.';
  }

  if (lowerMessage.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }

  if (lowerMessage.includes('too many requests')) {
    return 'Too many attempts. Please try again later.';
  }

  if (lowerMessage.includes('already registered') || lowerMessage.includes('user already exists')) {
    return 'An account with this email already exists. Try signing in.';
  }

  if (message.includes('PGRST116')) {
    return 'The requested item was not found.';
  }

  if (message.includes('JWT') || message.includes('token')) {
    return 'Your session has expired. Please sign in again.';
  }

  return message;
}

export function isShopOpen(hoursJson: any): { isOpen: boolean; text: string } {
  if (!hoursJson) return { isOpen: false, text: 'Hours not set' };

  const daysArr = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const dayName = daysArr[now.getDay()];
  const h = hoursJson[dayName];

  if (!h || !h.open) {
    return { isOpen: false, text: 'Closed Today' };
  }

  const parseTime = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  try {
    const openTime = parseTime(h.openTime);
    const closeTime = parseTime(h.closeTime);
    
    if (now >= openTime && now <= closeTime) {
      return { isOpen: true, text: `Open • Closes at ${h.closeTime}` };
    } else if (now < openTime) {
      return { isOpen: false, text: `Opens at ${h.openTime}` };
    } else {
      return { isOpen: false, text: 'Closed Now' };
    }
  } catch (e) {
    return { isOpen: false, text: 'Closed' };
  }
}
