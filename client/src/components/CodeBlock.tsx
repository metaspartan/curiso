import { memo, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { CodeProps } from 'react-markdown/lib/ast-to-react';

export const CodeBlock = memo(({ 
  inline, 
  className, 
  children,
  ...props 
}: CodeProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!children) return;
    
    const code = String(children).replace(/\n$/, '');
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }, [children]);

  if (!inline && match) {
    return (
      <div className="relative group" onMouseDown={e => e.stopPropagation()}>
        {/* <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/50"
          onMouseDown={handleCopy}
        >
          {isCopied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button> */}
        <SyntaxHighlighter
          {...props}
          style={oneDark}
          language={match[1]}
          PreTag="div"
          wrapLongLines={true}
          customStyle={{
            margin: 0,
            borderRadius: '6px',
          }}
        >
          {String(children)}
        </SyntaxHighlighter>
      </div>
    );
  }

  return <code className={className} {...props}>{children}</code>;
});

CodeBlock.displayName = 'CodeBlock';