/**
 * Explanation Popover Component
 *
 * A reusable popover component that displays explanatory content for help icons.
 * Supports markdown content and can be triggered by clicking an info icon.
 */

import React, { useState, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { fetchExplanation } from '../../services/config';

interface ExplanationPopoverProps {
  /**
   * Explanation key to load content (e.g., 'diet_water_footprint')
   */
  explanationKey: string;

  /**
   * Language for content ('en' or 'cn')
   */
  lang?: string;

  /**
   * Icon size (default: 16)
   */
  iconSize?: number;

  /**
   * Custom trigger element (optional)
   */
  trigger?: React.ReactNode;

  /**
   * Popover position (default: 'right')
   */
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Simple markdown-like renderer for basic formatting.
 * Supports: headers (##), bold (**text**), lists (- item), code blocks (```).
 */
function renderMarkdown(text: string): JSX.Element {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let key = 0;

  lines.forEach((line, idx) => {
    // Code block delimiters
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <pre key={`code-${key++}`} className="bg-muted p-2 rounded text-xs overflow-x-auto my-2">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
      }
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Headers (##)
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${idx}`} className="text-base font-semibold text-foreground mt-3 mb-2">
          {line.substring(3)}
        </h3>
      );
      return;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h4-${idx}`} className="text-sm font-semibold text-foreground mt-2 mb-1">
          {line.substring(4)}
        </h4>
      );
      return;
    }

    // Lists (-)
    if (line.trim().startsWith('- ')) {
      elements.push(
        <li key={`li-${idx}`} className="ml-4 text-sm text-muted-foreground mb-1">
          {processInlineFormatting(line.substring(line.indexOf('-') + 1).trim())}
        </li>
      );
      return;
    }

    // LaTeX-like math ($$...$$)
    if (line.includes('$$')) {
      const parts = line.split('$$');
      elements.push(
        <div key={`math-${idx}`} className="my-2 p-2 bg-muted rounded text-center font-mono text-sm">
          {parts[1] || parts[0]}
        </div>
      );
      return;
    }

    // Empty lines
    if (line.trim() === '') {
      elements.push(<div key={`br-${idx}`} className="h-2" />);
      return;
    }

    // Regular paragraphs
    elements.push(
      <p key={`p-${idx}`} className="text-sm text-muted-foreground mb-2 leading-relaxed">
        {processInlineFormatting(line)}
      </p>
    );
  });

  return <>{elements}</>;
}

/**
 * Process inline formatting: **bold**
 */
function processInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export default function ExplanationPopover({
  explanationKey,
  lang = 'en',
  iconSize = 16,
  trigger,
  side = 'right'
}: ExplanationPopoverProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load explanation content when opened
  useEffect(() => {
    if (open && !content) {
      setLoading(true);
      setError(null);

      fetchExplanation(explanationKey, lang)
        .then(data => {
          if (data) {
            setContent(data);
          } else {
            setError('Explanation not found');
          }
        })
        .catch(err => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, explanationKey, lang, content]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {trigger || (
          <button
            className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Show explanation"
          >
            <HelpCircle size={iconSize} />
          </button>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side={side}
          sideOffset={8}
          className="z-[10000] w-96 max-h-[80vh] overflow-y-auto bg-card border border-border rounded-lg shadow-xl animate-in fade-in-0 zoom-in-95"
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3 pb-3 border-b border-border">
              <h2 className="text-lg font-bold text-foreground pr-4">
                {content?.title || 'Loading...'}
              </h2>
              <Popover.Close asChild>
                <button
                  className="inline-flex items-center justify-center p-1 rounded hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </Popover.Close>
            </div>

            {/* Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-sm">
                  {error}
                </div>
              )}

              {content && !loading && !error && (
                <div>
                  {renderMarkdown(content.content)}
                </div>
              )}
            </div>
          </div>

          <Popover.Arrow className="fill-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
