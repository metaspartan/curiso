import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export function ThinkingBlock({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div
        className="text-muted-foreground text-xs flex items-center gap-2 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ChevronRight
          className={cn('h-3 w-3 transition-transform', isExpanded && 'transform rotate-90')}
        />
        <span>Thoughts</span>
      </div>
      <div
        className={cn(
          'border-muted border-t-2 border-b-2 pt-2 pb-2 mt-2 mb-2',
          'text-[hsl(var(--thinking-content))] text-xs',
          'thinking-content',
          !isExpanded && 'max-h-[50px] overflow-hidden relative'
        )}
      >
        {children}
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
    </>
  );
}
