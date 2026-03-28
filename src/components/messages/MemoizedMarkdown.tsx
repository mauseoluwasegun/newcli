/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

/**
 * === REACT MARKDOWN ("react-markdown") ===
 * Renders markdown strings as React components.
 * Takes raw markdown text (from AI responses) and converts it into proper HTML
 * with custom component renderers for code blocks, links, tables, images, etc.
 * World use cases: Blogs, documentation, chat apps, any app displaying formatted text.
 */
import ReactMarkdown, { type Components } from "react-markdown";

/**
 * === REMARK GFM ("remark-gfm") ===
 * GitHub Flavored Markdown plugin for react-markdown.
 * Adds support for: tables, strikethrough (~~text~~), task lists, and autolinks.
 * Without this, tables and advanced markdown features won't render.
 * World use cases: Any markdown renderer needing GitHub-style features.
 */
import remarkGfm from "remark-gfm";

/**
 * === REMARK MATH ("remark-math") ===
 * Parses LaTeX math expressions in markdown.
 * Inline math: $E = mc^2$ | Block math: $$\int_0^1 x^2 dx$$
 * Works with rehype-katex below to render the math beautifully.
 * World use cases: Academic platforms, math tutoring, scientific documentation.
 */
import remarkMath from "remark-math";

/**
 * === REHYPE KATEX ("rehype-katex") + KATEX CSS ===
 * Renders LaTeX math expressions parsed by remark-math into beautiful typography.
 * KaTeX is ~10x faster than MathJax for rendering math in the browser.
 * The CSS import provides the styles needed for proper math rendering.
 * World use cases: Math education platforms, research papers, scientific apps.
 */
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * === NEXT.JS LINK ("next/link") ===
 * Client-side navigation component — handles prefetching and SPA-style transitions.
 * Used here to make links in AI responses navigable without full page reloads.
 */
import Link, { LinkProps } from "next/link";

/** === React core === */
import React, { memo, useMemo } from "react";

/**
 * === MARKED ("marked") ===
 * Fast markdown parser that converts markdown to tokens/HTML.
 * Used here specifically for marked.lexer() — splits markdown into blocks/tokens
 * so each block can be memoized independently (prevents re-rendering the entire
 * response when only the last block is being streamed).
 * World use cases: Server-side markdown conversion, content processing.
 */
import { marked } from "marked";

/** === Local code highlighting component === */
import CodeBlock from "./CodeBlock";

/** === Local className utility === */
import { cn } from "@/lib/utils";

/**
 * === UNIST-UTIL-VISIT ("unist-util-visit") + HAST types ===
 * AST (Abstract Syntax Tree) processing utilities for HTML.
 * - visit: Walks through every node in the HTML AST.
 * - Root (from hast): TypeScript type for the HTML AST root node.
 * Used here to create a custom rehype plugin that marks <code> elements
 * as inline or block — so inline code and code blocks render differently.
 * World use cases: Custom markdown/HTML transformations, content pipelines.
 */
import { visit } from "unist-util-visit";
import type { Root } from "hast";

export default function rehypeInlineCodeProperty() {
  return function (tree: Root) {
    visit(tree, "element", function (node, index, parent) {
      if (node.tagName === "code") {
        const parentElement = parent as Element | undefined;

        node.properties ||= {};
        node.properties.inline = parentElement?.tagName !== "pre";
      }
    });
  };
}

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens
    .map((token) => token.raw ?? "")
    .filter((block) => block.trim().length > 0);
}

const components: Partial<Components> = {
  code: ({ node, className, children, ...rest }) => {
    const isInline = node?.properties?.inline === true;

    return (
      <CodeBlock className={className || ""} inline={isInline} {...rest}>
        {children}
      </CodeBlock>
    );
  },
  pre: ({ children }) => <>{children}</>,
  p: ({ children }) => {
    const isOnlyText = React.Children.toArray(children).every(
      (child) => typeof child === "string" || typeof child === "number"
    );

    return isOnlyText ? <p>{children}</p> : <>{children}</>;
  },
  a: ({ node, children, ...props }) => {
    return (
      <Link target="_blank" rel="noreferrer" {...(props as LinkProps)}>
        {children}
      </Link>
    );
  },
  table: ({ node, children, ...props }) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full" {...props}>
          {children}
        </table>
      </div>
    );
  },
  img: ({ src, alt, ...props }) => {
    // Don't render images with empty or invalid src
    if (
      !src ||
      (typeof src === "string" &&
        (src.trim() === "" || src === "null" || src === "undefined"))
    ) {
      return null;
    }
    // Don't render images at all to prevent any image-related issues
    return null;
  },
};

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeInlineCodeProperty]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  }
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
  ({
    content,
    id,
    className,
  }: {
    content: string;
    id: string;
    className?: string;
  }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return blocks.map((block, index) => (
      <div
        className={cn("content-styles", className)}
        key={`${id}-block_${index}`}
      >
        <MemoizedMarkdownBlock content={block} />
      </div>
    ));
  }
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
