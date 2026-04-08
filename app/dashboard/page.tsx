"use client";

import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';

import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import type { RootState } from '@/lib/store';

export default function DashboardPage() {
    const { isAuthenticated, content } = useSelector((state: RootState) => state.auth);

    return (
        <AppShell>
            <section className="space-y-4">
                {isAuthenticated ? (
                    <>
                        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            Welcome back
                            {content?.user?.firstName ? `, ${content.user.firstName}` : ''}!
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-xl font-semibold tracking-tight">Please login to continue</h1>
                        <p className="text-sm text-muted-foreground">
                            You need to be authenticated to view your dashboard.
                        </p>
                        <div className="mt-4">
                            <Button asChild>
                                <Link href="/login">Go to login</Link>
                            </Button>
                        </div>
                    </>
                )}
            </section>
        </AppShell>
    );
}
