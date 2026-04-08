"use client";

import React from "react";
import Link from "next/link";
import {useDispatch, useSelector} from "react-redux";
import {useRouter} from "next/navigation";
import {RiHome2Line, RiLock2Line, RiLogoutBoxRLine} from "@remixicon/react";

import {Button} from "@/components/ui/button";
import {RootState} from "@/lib/store";
import {logout} from "@/lib/slices/authSlice";

export function Header() {
    const dispatch = useDispatch();
    const router = useRouter();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    const handleLogout = () => {
        dispatch(logout());
        if (typeof window !== "undefined") {
            window.localStorage.removeItem("auth");
        }
        router.push("/");
    };

    return (
        <header className="flex justify-between items-center border-b px-4 py-3 w-full">
            <div className="flex items-center">
                {!isAuthenticated ? (
                    <Button
                    variant={"outline"}
                    >
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
                        >
                            <RiHome2Line className="h-5 w-5"/>
                            <span>Home</span>
                        </Link>
                    </Button>

                ) : (
                    <Button variant="ghost" size="lg" onClick={handleLogout}>
                        <RiLogoutBoxRLine className="mr-2 h-4 w-4"/>
                        Logout
                    </Button>
                )}
            </div>
            <div className="flex items-center">
                {!isAuthenticated ? (
                    <Button
                        onClick={() => router.push("/login")}
                    >
                        <RiLock2Line className="mr-2 h-4 w-4"/>
                        Login
                    </Button>
                ) : (
                    <span className="text-sm text-muted-foreground">Dashboard</span>
                )}
            </div>
        </header>
    );
}
