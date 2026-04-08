'use client';

import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';

import { store } from '@/lib/store';
import { setAuthFromStorage, type AuthContent } from '@/lib/slices/authSlice';

function AuthInitializer({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const raw = window.localStorage.getItem('auth');
            if (!raw) return;

            const parsed = JSON.parse(raw) as AuthContent;
            dispatch(setAuthFromStorage(parsed));
        } catch (error) {
            console.error('Failed to restore auth state from localStorage', error);
            window.localStorage.removeItem('auth');
            dispatch(setAuthFromStorage(null));
        }
    }, [dispatch]);

    return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <AuthInitializer>{children}</AuthInitializer>
        </Provider>
    );
}
