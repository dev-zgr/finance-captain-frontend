import React from 'react';
import Link from 'next/link';

import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';

export default function HomePage() {
    return (
        <AppShell>
            <section className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Welcome to Finance Captain</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Manage your personal finances with a secure, modern dashboard.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button asChild>
                        <Link href="/dashboard">Go to dashboard</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                </div>
            </section>
        </AppShell>
    );
}
