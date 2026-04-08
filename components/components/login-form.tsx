import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import {Card, CardContent} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import {Input} from "@/components/ui/input"
import Link from "next/link"
import {RiInfoI} from "@remixicon/react";
import React from "react";

export interface LoginFormProps {
    email: string;
    password: string;
    onEmailChange: (v: string) => void;
    onPasswordChange: (v: string) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement> | React.FormEvent) => void;
    pending?: boolean;
    errors?: {
        email?: string;
        password?: string;
        general?: string;
    };
    success?: boolean;
    className?: string;
}

export function LoginForm({
                              email,
                              password,
                              onEmailChange,
                              onPasswordChange,
                              onSubmit,
                              pending = false,
                              errors = {},
                              success,
                              className,
                              ...props
                          }: LoginFormProps) {
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0 h-[500px]">
                <CardContent className="grid p-0 md:grid-cols-2 h-full">
                    <form className="flex flex-col h-full p-6 md:p-8" onSubmit={onSubmit} autoComplete="off">
                        <FieldGroup className="flex-1 flex flex-col">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Welcome back</h1>
                                <p className="text-balance text-muted-foreground">
                                    Login to your Finance Captain account
                                </p>
                            </div>
                            {errors.general && (
                                <div
                                    className="mb-2 rounded-md bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 text-sm flex items-center">
                                    <RiInfoI size={18}/>
                                    <i className="ri-information-line mr-2 text-blue-500 text-lg"
                                       aria-hidden="true"></i>
                                    {errors.general}
                                </div>
                            )}

                            {success && (
                                <div
                                    className="mb-2 rounded-md bg-green-100 border border-green-300 text-green-800 px-4 py-2 text-sm flex items-center">
                                    <RiInfoI size={18}/>
                                    <i className="ri-information-line mr-2 text-blue-500 text-lg"
                                       aria-hidden="true"></i>
                                    Login successful! Redirecting to dashboard...
                                </div>
                            )}

                            <Field data-invalid={!!errors.email}>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={e => onEmailChange(e.target.value)}
                                    aria-invalid={!!errors.email}
                                    disabled={pending}
                                />
                                {errors.email && <FieldError>{errors.email}</FieldError>}
                            </Field>
                            <Field data-invalid={!!errors.password}>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => onPasswordChange(e.target.value)}
                                    aria-invalid={!!errors.password}
                                    disabled={pending}
                                />
                                {errors.password && <FieldError>{errors.password}</FieldError>}
                            </Field>
                            <div className="mt-auto pt-4">
                                <Button size="lg" type="submit" disabled={pending} className="w-full">
                                    {pending && (
                                        <span className="mr-2 align-middle inline-block">
                      {/* Replace with a fallback spinner if Spinner is not available */}
                                            <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"
                                fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    </span>
                                    )}
                                    Login
                                </Button>
                            </div>
                        </FieldGroup>
                    </form>
                    <div className="relative hidden md:block h-full">
                        <img
                            src="/images/login_placeholder.jpg"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our <Link href="/terms-of-service">Terms of Service</Link>{" "}
                and <Link href="/privacy-policy">Privacy Policy</Link>.
            </FieldDescription>
        </div>
    )
}