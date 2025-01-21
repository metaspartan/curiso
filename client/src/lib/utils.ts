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

export function processThinkingContent(content: string) {
  const blocks = [];
  let currentIndex = 0;
  // @ts-ignore
  const regex = /<think>(.*?)<\/think>/gs;
  let match;
  let processedContent = content;

  while ((match = regex.exec(content)) !== null) {
    // Add any content before the thinking block
    if (match.index > currentIndex) {
      blocks.push({
        type: 'normal',
        content: content.slice(currentIndex, match.index),
        key: `normal-${currentIndex}`
      });
    }

    // Add the thinking block
    blocks.push({
      type: 'thinking',
      content: match[1].trim(),
      key: `think-${match.index}`
    });

    currentIndex = match.index + match[0].length;
    
    // Remove the thinking block from the original content
    processedContent = processedContent.replace(match[0], '');
  }

  if (currentIndex < content.length) {
    blocks.push({
      type: 'normal',
      content: processedContent.slice(currentIndex),
      key: `normal-${currentIndex}`
    });
  }

  return {
    blocks: blocks.filter(block => block.content),
    processedContent: processedContent.trim()
  };
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