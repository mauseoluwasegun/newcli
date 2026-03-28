"use client";

/** === React core === */
import * as React from "react";

/** === Local components === */
import UserInfo from "./UserInfo";

/**
 * === SHADCN/UI SIDEBAR (local wrapper around Radix UI primitives) ===
 * A collapsible sidebar component system.
 * - Sidebar: The main container (collapsible="offcanvas" means it slides off-screen on mobile).
 * - SidebarHeader/Content/Footer: Layout sections.
 * - SidebarMenu/MenuItem: Navigable menu items.
 * - SidebarSeparator: Visual divider between sections.
 */
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

/** === NEXT.JS LINK — for the logo/home navigation === */
import Link from "next/link";

/** === LUCIDE REACT — WandSparkles: The app's brand icon === */
import { WandSparkles } from "lucide-react";

/** === Local sidebar components === */
import SidebarUtils from "./SidebarUtils";
import ChatList from "./ChatList";
import LoginButton from "./LoginButton";

/** === Local skeleton loading component === */
import { Skeleton } from "@/components/ui/skeleton";

/**
 * === CONVEX HELPERS ("convex-helpers") ===
 * - useQuery (from cache/hooks): Cached version of Convex's useQuery.
 *   Prevents redundant re-fetches across components subscribing to the same data.
 */
import { useQuery } from "convex-helpers/react/cache/hooks";

/** === Auto-generated Convex API references === */
import { api } from "@convex/_generated/api";

/**
 * === CONVEX REACT ("convex/react") ===
 * - useMutation: Calls Convex mutations (write operations) from React components.
 *   Used here to reset the user's daily message quota.
 */
import { useMutation } from "convex/react";

const ChatSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const userData = useQuery(api.auth.getCurrentUser);
  const resetQuota = useMutation(api.auth.resetUserQuota);

  const hasResetRef = React.useRef(false);

  React.useEffect(() => {
    if (userData && !hasResetRef.current) {
      void resetQuota({});
      hasResetRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const isLoading = userData === undefined;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="py-3.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" className="p-1.5 flex gap-2 items-center">
              <WandSparkles className="size-5" />
              <span className="text-base font-semibold">Ai Chat</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarUtils />

        <SidebarSeparator />
        <ChatList />
      </SidebarContent>
      <SidebarFooter>
        {isLoading ? (
          <Skeleton className="h-5 rounded-md" />
        ) : userData && userData.name === "Anonymous" ? (
          <LoginButton />
        ) : (
          <UserInfo
            name={userData?.name ?? "John Doe"}
            image={userData?.image ?? "https://avatar.vercel.sh/jack"}
            email={userData?.email ?? "johndoe@example.com"}
            messageCount={userData?.messageCount ?? 0}
            lastReset={userData?.lastReset ?? null}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default ChatSidebar;
