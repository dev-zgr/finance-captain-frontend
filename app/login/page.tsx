"use client";


import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { AppShell } from '@/components/layout/AppShell';
import { login as loginAction } from '@/lib/slices/authSlice';
import { LoginForm } from '@/components/components/login-form';
import {API_ENDPOINTS} from "@/lib/constants/api";
import axios from "axios";


interface FieldErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);


    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors({});
        setPending(true);
        setSuccess(false);
        try {
            console.log(API_ENDPOINTS.LOGIN)
            const response = await axios.post(API_ENDPOINTS.LOGIN, { email, password }, {
                headers: { 'Content-Type': 'application/json' },
                validateStatus: () => true,
            });
            if (response.status === 200 && response.data?.content) {
                // Save token/session if needed
                dispatch(loginAction(response.data.content));
                window.localStorage.setItem('auth', JSON.stringify(response.data.content));
                setSuccess(true);
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1200);
            } else if (response.status === 400) {
                setErrors({
                    general: response.data?.message || 'Validation error occurred.',
                    ...response.data?.fieldErrors,
                });
            } else if (response.status === 401) {
                setErrors({ general: response.data?.message || 'Invalid email or password.' });
            } else if (response.status === 500) {
                setErrors({ general: response.data?.message || 'Internal server error.' });
            } else {
                setErrors({ general: 'Unexpected error occurred.' });
            }
        } catch (err) {
            setErrors({ general: 'Network error. Please try again.' });
        } finally {
            setPending(false);
        }
    };

  // @ts-ignore
    return (
    <AppShell>
      <div className="flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl">
          <LoginForm
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
            pending={pending}
            errors={errors}
            success={success}
          />
        </div>
      </div>
    </AppShell>
  );
}
