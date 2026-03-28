"use client";

/**
 * === CMDK ("cmdk") ===
 * Command palette component (Ctrl+K / Cmd+K style).
 * Provides a fast, accessible, filterable command menu.
 * - CommandDialog: The modal wrapper
 * - CommandInput: Searchable input field
 * - CommandItem: Individual selectable items
 * - CommandList: Scrollable list container
 * - CommandEmpty: Shown when no results match the search
 * World use cases: Notion, Linear, Vercel, Raycast — any app with a keyboard command palette.
 */
import {
  CommandDialog,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";

/** === NEXT.JS LINK — navigates to the selected chat === */
import Link from "next/link";

/** === React hooks === */
import { useState, useEffect } from "react";

/** === Local infinite scroll component for paginated loading === */
import InfiniteScroll from "@/components/InfiniteScroll";

/** === Local debounce hook — waits 200ms after typing stops before searching === */
import { useDebounce } from "@/hooks/use-debounce";

/** === Local loading skeleton component === */
import { Skeleton } from "@/components/ui/skeleton";

/**
 * === CONVEX REACT ("convex/react") ===
 * - usePaginatedQuery: Fetches paginated data from Convex with cursor-based pagination.
 *   Returns { results, status, loadMore } for infinite scrolling.
 */
import { usePaginatedQuery } from "convex/react";

/** === Auto-generated Convex API references === */
import { api } from "@convex/_generated/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchChatListSkeleton = () => {
  return (
    <div className="flex flex-col gap-2 px-2 pb-4">
      {[...new Array(5)].fill(0).map((_, index) => (
        <Skeleton className="h-4 rounded-lg" key={index} />
      ))}
    </div>
  );
};

const SearchCommand = ({ open, onOpenChange }: Props) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 200);

  const { results, status, loadMore } = usePaginatedQuery(
    api.chats.search,
    { query: debouncedQuery },
    { initialNumItems: 10 }
  );

  const isLoading = status === "LoadingMore" || status === "LoadingFirstPage";

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search your chats..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="px-2 py-4">
        <CommandEmpty>No chats found.</CommandEmpty>

        {isLoading && <SearchChatListSkeleton />}

        {!isLoading &&
          results.map((chat) => (
            <CommandItem
              key={chat._id}
              value={chat.title}
              title={chat.title}
              asChild
              className="cursor-pointer rounded-lg h-8 mt-2 first:mt-0"
            >
              <Link
                href={`/chat/${chat.id}`}
                onClick={() => onOpenChange(false)}
              >
                {chat.title}
              </Link>
            </CommandItem>
          ))}
        <InfiniteScroll
          hasNextPage={!isLoading && !!loadMore}
          isFetchingNextPage={status === "LoadingMore"}
          fetchNextPage={loadMore}
        />
      </CommandList>
    </CommandDialog>
  );
};

export default SearchCommand;
