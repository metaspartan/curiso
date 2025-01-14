import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeChatMessage(message: any) {
  return {
    role: message.role,
    content: message.content,
    ...(message.name ? { name: message.name } : {})
  };
}

export function sanitizeChatMessages(messages: any[]) {
  return messages.map(sanitizeChatMessage);
}

export function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && 
           a.every((val, idx) => isEqual(val, b[idx]));
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    if (a === null || b === null) return a === b;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return keysA.length === keysB.length && 
           keysA.every(key => isEqual(a[key], b[key]));
  }
  
  return false;
}