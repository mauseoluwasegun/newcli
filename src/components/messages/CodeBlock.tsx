/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/** === React core === */
import type React from "react";
import { useState } from "react";

/**
 * === NEXT-THEMES ("next-themes") ===
 * - useTheme: Returns the current theme ("light" | "dark" | "system").
 *   Used here to switch between light and dark code highlighting styles.
 * World use cases: Any component that needs to adapt to the current theme.
 */
import { useTheme } from "next-themes";

/**
 * === REACT SYNTAX HIGHLIGHTER ("react-syntax-highlighter") ===
 * Highlights code blocks in 200+ programming languages using Prism.js grammar.
 * - materialDark/materialLight: Pre-built color themes for code highlighting.
 * Used here to render AI-generated code with proper syntax highlighting.
 * World use cases: Code editors, documentation sites, AI chat apps, developer tools.
 */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  materialDark,
  materialLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

/**
 * === LUCIDE REACT — Icons ===
 * Check: Shown after copying code | Copy: Copy button | Maximize2/Minimize2: Expand/collapse
 */
import { Check, Copy, Maximize2, Minimize2 } from "lucide-react";

/** === Local button component (built with Radix UI + CVA) === */
import { Button } from "../ui/button";

interface CodeBlockProps {
  className?: string;
  children: React.ReactNode;
  inline?: boolean;
  [key: string]: any;
}

const CodeBlock = ({ className = "", children, inline }: CodeBlockProps) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const match = /language-(\w+)/.exec(className);
  const lang = match?.[1] ?? "text";
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(String(children)).catch(console.error);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <pre className="bg-muted-foreground/10 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono w-fit inline text-foreground whitespace-pre-wrap">
        {children}
      </pre>
    );
  }

  return (
    <div className="my-4 w-full overflow-hidden rounded-xl border shadow-xs dark:shadow-none not-prose">
      <div className="flex items-center justify-between bg-muted/15 px-4 py-1 text-xs text-muted-foreground border-muted-foreground/10 rounded-t-md border-b">
        <span className="font-medium text-sm">{lang}</span>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <Minimize2 className="size-3.5 sm:size-4" />
            ) : (
              <Maximize2 className="size-3.5 sm:size-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onCopy}>
            {copied ? (
              <Check className="size-3.5 sm:size-4" />
            ) : (
              <Copy className="size-3.5 sm:size-4" />
            )}{" "}
          </Button>
        </div>
      </div>
      <div
        className="text-xs md:text-[13px] overflow-x-auto font-[--font-geist-mono] bg-muted/15 hide-scrollbar"
        style={{
          maxHeight: expanded ? "100%" : "300px",
        }}
      >
        <SyntaxHighlighter
          language={lang}
          style={isLight ? materialLight : materialDark}
          showLineNumbers={lang === "plaintext" ? false : true}
          customStyle={{
            margin: 0,
            whiteSpace: "pre",
            fontFamily: "var(--font-geist-mono), monospace",
            background: "transparent",
          }}
          codeTagProps={{
            style: {
              whiteSpace: "pre",
              fontFamily: "inherit",
            },
          }}
          wrapLines={false}
          wrapLongLines={false}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;
