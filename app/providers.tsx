'use client';

import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from "@/components/ui/sonner";

import { store } from '@/lib/store';
import { setAuthFromStorage } from '@/lib/slices/authSlice';
import { restoreAuthFromStorage } from '@/lib/auth/session';

function AuthInitializer({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const restoredAuth = restoreAuthFromStorage();
        dispatch(setAuthFromStorage(restoredAuth));
    }, [dispatch]);

    return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <TooltipProvider>
                <AuthInitializer>{children}</AuthInitializer>
                <Toaster />
            </TooltipProvider>
        </Provider>
    );
}
