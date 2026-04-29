"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  RiArrowDownSLine,
  RiExchangeFundsLine,
  RiLayoutGridLine,
  RiLogoutBoxRLine,
  RiSecurePaymentLine,
  RiStockLine,
  RiWallet3Line,
} from "@remixicon/react";

import { logout } from "@/lib/slices/authSlice";
import type { RootState } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clearPersistedAuth } from "@/lib/auth/session";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { LogoutModal } from "@/components/ui/logout-modal";

const accountGroups = [
  {
    title: "Checking Account",
    icon: RiWallet3Line,
    overviewHref: "/checking-account",
    transactionsHref: "/checking-account/transactions",
  },
  {
    title: "Debts Account",
    icon: RiSecurePaymentLine,
    overviewHref: "/debt-account",
    transactionsHref: "/debt-account/transactions",
  },
  {
    title: "Investment Account",
    icon: RiStockLine,
    overviewHref: "#",
    transactionsHref: "#",
  },
];

export function DashboardSidebar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { content } = useSelector((state: RootState) => state.auth);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const firstName = content?.user?.firstName ?? "Guest";
  const lastName = content?.user?.lastName ?? "User";
  const email = content?.user?.email ?? "unknown@example.com";
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  const handleLogout = () => {
    setIsLoggingOut(true);
    window.setTimeout(() => {
      clearPersistedAuth();
      dispatch(logout());
      router.push("/login");
    }, 700);
  };

  return (
    <>
    <Sidebar collapsible="offcanvas" className="z-20">
      <SidebarHeader className="sticky top-0 z-10 border-b bg-sidebar px-3 py-4">
        <h2 className="text-base font-semibold tracking-tight">Finance Captain</h2>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive>
                  <Link href="/dashboard">
                    <RiLayoutGridLine />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountGroups.map(({ title, icon: Icon, overviewHref, transactionsHref }) => (
                <Collapsible key={title} className="group/collapsible" asChild>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Icon />
                        <span>{title}</span>
                        <RiArrowDownSLine className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link href={overviewHref}>Overview</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild>
                            <Link href={transactionsHref}>Transactions</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="#">
                    <RiExchangeFundsLine />
                    <span>Transfer Money</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <Collapsible className="rounded-xl bg-zinc-100 p-2 dark:bg-zinc-900">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
            >
              <Avatar size="sm">
                <AvatarFallback>{initials || "FC"}</AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-medium">
                {firstName} {lastName}
              </span>
              <RiArrowDownSLine className="ml-auto" />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-2 px-2 pb-2">
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">First Name:</span> {firstName}
              </p>
              <p>
                <span className="font-medium text-foreground">Last Name:</span> {lastName}
              </p>
              <p className="truncate">
                <span className="font-medium text-foreground">Email:</span> {email}
              </p>
            </div>

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="#">Account details</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <RiLogoutBoxRLine />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </CollapsibleContent>
        </Collapsible>
      </SidebarFooter>
    </Sidebar>
    <LogoutModal open={isLoggingOut} />
    </>
  );
}
