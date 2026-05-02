"use client"

import React from "react"
import Link from "next/link"
import { useDispatch, useSelector } from "react-redux"
import { usePathname, useRouter } from "next/navigation"
import {
    ArrowLeftRight,
    ArrowRightLeft,
    Briefcase,
    Building2,
    ChevronRight,
    Landmark,
    LayoutDashboard,
    LineChart,
    Newspaper,
    Wallet,
    type LucideIcon,
} from "lucide-react"


import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NavUser } from "@/components/components/layoutComponents/nav-user";
import { logout } from "@/lib/slices/authSlice";
import type { RootState } from "@/lib/store";
import { clearPersistedAuth } from "@/lib/auth/session";
import { LogoutModal } from "@/components/ui/logout-modal";

const accountItems = [
    {
        title: "Checking Account",
        icon: Wallet,
        overviewHref: "/checking-account",
        transactionsHref: "/checking-account/transactions",
    },
    {
        title: "Debts Account",
        icon: Landmark,
        overviewHref: "/debt-account",
        transactionsHref: "/debt-account/transactions",
    },
    {
        title: "Investment Account",
        icon: LineChart,
        items: [
            {
                title: "Overview",
                href: "/investment-account/overview",
                icon: LayoutDashboard,
            },
            {
                title: "Portfolio",
                href: "/investment-account/portfolio",
                icon: Briefcase,
            },
            {
                title: "News",
                href: "/investment-account/news",
                icon: Newspaper,
            },
            {
                title: "Trade",
                href: "/investment-account/trade",
                icon: LineChart,
            },
            {
                title: "Transactions",
                href: "/investment-account/transactions",
                icon: ArrowRightLeft,
            },
        ],
    },
] satisfies {
    title: string
    icon: LucideIcon
    overviewHref?: string
    transactionsHref?: string
    items?: {
        title: string
        href: string
        icon: LucideIcon
    }[]
}[]

function isRouteActive(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const dispatch = useDispatch()
    const router = useRouter()
    const pathname = usePathname()
    const { content } = useSelector((state: RootState) => state.auth)
    const [isLoggingOut, setIsLoggingOut] = React.useState(false)

    const firstName = content?.user?.firstName ?? "Guest"
    const lastName = content?.user?.lastName ?? "User"
    const email = content?.user?.email ?? "unknown@example.com"

    const handleLogout = () => {
        setIsLoggingOut(true)
        window.setTimeout(() => {
            clearPersistedAuth()
            dispatch(logout())
            router.push("/login")
        }, 700)
    }

    return (
        <>
            <Sidebar collapsible="icon" variant="sidebar" {...props}>
                <SidebarHeader>
                    <div className="flex items-center gap-2 overflow-hidden rounded-lg border bg-card px-3 py-2 text-sm font-semibold text-card-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
                        <Building2 className="size-4" />
                        <span className="truncate group-data-[collapsible=icon]:hidden">Finance Captain</span>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={isRouteActive(pathname, "/dashboard")}>
                                        <Link href="/dashboard">
                                            <LayoutDashboard />
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
                                {accountItems.map(({ title, icon: Icon, overviewHref, transactionsHref, items }) => {
                                    const subItems =
                                        items ??
                                        [
                                            {
                                                title: "Overview",
                                                href: overviewHref ?? "#",
                                            },
                                            {
                                                title: "Transactions",
                                                href: transactionsHref ?? "#",
                                            },
                                        ]
                                    const isAccountActive = subItems.some((item) => isRouteActive(pathname, item.href))

                                    return (
                                        <Collapsible
                                            key={title}
                                            className="group/collapsible"
                                            defaultOpen={isAccountActive}
                                            asChild
                                        >
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton isActive={isAccountActive}>
                                                        <Icon />
                                                        <span>{title}</span>
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {subItems.map((item) => (
                                                            <SidebarMenuSubItem key={item.title}>
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    isActive={isRouteActive(pathname, item.href)}
                                                                >
                                                                    <Link href={item.href}>
                                                                        {"icon" in item && item.icon ? <item.icon /> : null}
                                                                        <span>{item.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    )
                                })}
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="#">
                                            <ArrowLeftRight />
                                            <span>Transfer Money</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <NavUser
                        user={{
                            name: `${firstName} ${lastName}`,
                            email,
                        }}
                        onLogout={handleLogout}
                    />
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>
            <LogoutModal open={isLoggingOut} />
        </>
    )
}
