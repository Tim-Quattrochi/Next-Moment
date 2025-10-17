import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownMessageProps {
  content: string
  className?: string
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Headings
        h1: ({ children, ...props }) => (
          <h1 className="text-2xl font-bold text-foreground mb-4 mt-6" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 className="text-xl font-semibold text-foreground mb-3 mt-5" {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 className="text-lg font-semibold text-foreground mb-2 mt-4" {...props}>
            {children}
          </h3>
        ),
        h4: ({ children, ...props }) => (
          <h4 className="text-base font-semibold text-foreground mb-2 mt-3" {...props}>
            {children}
          </h4>
        ),

        // Paragraphs
        p: ({ children, ...props }) => (
          <p className="text-foreground leading-relaxed mb-3" {...props}>
            {children}
          </p>
        ),

        // Lists
        ul: ({ children, ...props }) => (
          <ul className="list-disc list-inside space-y-2 mb-4 text-foreground" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="list-decimal list-inside space-y-2 mb-4 text-foreground" {...props}>
            {children}
          </ol>
        ),
        li: ({ children, ...props }) => (
          <li className="text-foreground leading-relaxed ml-2" {...props}>
            {children}
          </li>
        ),

        // Links
        a: ({ children, href, ...props }) => (
          <a
            href={href}
            className="text-[#3B82F6] hover:text-[#2563EB] underline underline-offset-2 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        ),

        // Code
        code: ({ children, className, ...props }) => {
          const isInline = !className
          return isInline ? (
            <code
              className="bg-muted/50 text-foreground px-1.5 py-0.5 rounded text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          ) : (
            <code
              className="block bg-muted/50 text-foreground px-4 py-3 rounded-lg text-sm font-mono overflow-x-auto mb-4"
              {...props}
            >
              {children}
            </code>
          )
        },

        // Pre (code blocks)
        pre: ({ children, ...props }) => (
          <pre className="bg-muted/50 rounded-lg overflow-hidden mb-4" {...props}>
            {children}
          </pre>
        ),

        // Blockquotes
        blockquote: ({ children, ...props }) => (
          <blockquote
            className="border-l-4 border-[#3B82F6] pl-4 py-2 my-4 text-muted-foreground italic bg-muted/30 rounded-r"
            {...props}
          >
            {children}
          </blockquote>
        ),

        // Strong/Bold
        strong: ({ children, ...props }) => (
          <strong className="font-semibold text-foreground" {...props}>
            {children}
          </strong>
        ),

        // Emphasis/Italic
        em: ({ children, ...props }) => (
          <em className="italic text-foreground" {...props}>
            {children}
          </em>
        ),

        // Horizontal Rule
        hr: ({ ...props }) => (
          <hr className="my-6 border-border/50" {...props} />
        ),

        // Tables
        table: ({ children, ...props }) => (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse border border-border/50 rounded-lg" {...props}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children, ...props }) => (
          <thead className="bg-muted/30" {...props}>
            {children}
          </thead>
        ),
        tbody: ({ children, ...props }) => (
          <tbody {...props}>
            {children}
          </tbody>
        ),
        tr: ({ children, ...props }) => (
          <tr className="border-b border-border/50" {...props}>
            {children}
          </tr>
        ),
        th: ({ children, ...props }) => (
          <th className="px-4 py-2 text-left font-semibold text-foreground border border-border/50" {...props}>
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td className="px-4 py-2 text-foreground border border-border/50" {...props}>
            {children}
          </td>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
