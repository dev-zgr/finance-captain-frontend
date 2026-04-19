"use client";

import React from "react";
import { useSelector } from 'react-redux';

import type { RootState } from '@/lib/store';
import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout";

export default function DashboardPage() {
    const { content } = useSelector((state: RootState) => state.auth);
    const firstName = content?.user?.firstName ?? "Captain";

    return (
        <AuthenticatedDashboardLayout>
            <section className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
                <p className="text-sm text-muted-foreground">
                    Your dashboard sidebar is now the primary layout.
                </p>
            </section>
        </AuthenticatedDashboardLayout>
    );
}
