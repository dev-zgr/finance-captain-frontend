"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AlertTriangle, KeyRound, Mail, MapPinned, Phone, RefreshCw, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout";
import { AccountRow } from "@/components/components/account/account-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clearPersistedAuth } from "@/lib/auth/session";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { logout } from "@/lib/slices/authSlice";
import type { RootState } from "@/lib/store";

type RawRecord = Record<string, unknown>;

type MyAccountAddress = {
  firstLine: string;
  secondLine: string;
  state: string;
  city: string;
  zipCode: string;
};

type MyAccountUser = {
  id: number;
  firstName: string;
  phoneNumber: string;
  email: string;
  password: string;
  address: MyAccountAddress | null;
};

type PageStatus = "idle" | "loading" | "success" | "server-error" | "error" | "unauthorized";

function asRecord(value: unknown): RawRecord | null {
  return value && typeof value === "object" ? (value as RawRecord) : null;
}

function readString(source: RawRecord | null, ...keys: string[]): string {
  if (!source) {
    return "";
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") {
      return value;
    }
  }

  return "";
}

function readNumber(source: RawRecord | null, ...keys: string[]): number | null {
  if (!source) {
    return null;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function normalizeUser(rawUser: unknown): MyAccountUser | null {
  const user = asRecord(rawUser);
  const id = readNumber(user, "id");
  if (id === null) {
    return null;
  }

  const rawAddress = asRecord(user?.address);
  const firstLine = readString(rawAddress, "firstLine", "firstline");
  const secondLine = readString(rawAddress, "secondLine", "secondline");
  const state = readString(rawAddress, "state");
  const city = readString(rawAddress, "city");
  const zipCode = readString(rawAddress, "zipCode", "zipcode");

  return {
    id,
    firstName: readString(user, "firstName", "first name", "firstname"),
    phoneNumber: readString(user, "phoneNumber", "phonenumber"),
    email: readString(user, "email"),
    password: readString(user, "password"),
    address:
      rawAddress && (firstLine || secondLine || state || city || zipCode)
        ? {
            firstLine,
            secondLine,
            state,
            city,
            zipCode,
          }
        : null,
  };
}

function ServerErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-red-500" />
          Internal Server Error
        </CardTitle>
        <CardDescription>We could not load your account right now.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{message || "An unexpected server error occurred."}</p>
        <Button type="button" onClick={onRetry} className="inline-flex items-center gap-2">
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MyAccountPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isHydrated, content } = useSelector((state: RootState) => state.auth);

  const token = content?.token ?? "";
  const [status, setStatus] = useState<PageStatus>("idle");
  const [user, setUser] = useState<MyAccountUser | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const maskedPassword = user?.password ? "•".repeat(Math.max(8, user.password.length)) : "Not available";

  const fetchMyAccount = useCallback(async () => {
    if (!isHydrated || !isAuthenticated || !token) {
      setStatus("unauthorized");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await axios.get(API_ENDPOINTS.MY_ACCOUNT, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        validateStatus: () => true,
      });

      if (response.status === 200) {
        const normalizedUser = normalizeUser(response.data?.content?.user);
        if (!normalizedUser) {
          setStatus("error");
          setErrorMessage("Unexpected response format from server.");
          return;
        }
        setUser(normalizedUser);
        setStatus("success");
        return;
      }

      if (response.status === 401) {
        clearPersistedAuth();
        dispatch(logout());
        setStatus("unauthorized");
        router.replace("/login");
        return;
      }

      if (response.status === 500) {
        setStatus("server-error");
        setErrorMessage(response.data?.message || "An unexpected server error occurred.");
        return;
      }

      setStatus("error");
      setErrorMessage(response.data?.message || "Unexpected error occurred while loading your account.");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }, [dispatch, isAuthenticated, isHydrated, router, token]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void fetchMyAccount();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [fetchMyAccount, isAuthenticated, isHydrated]);

  return (
    <AuthenticatedDashboardLayout>
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">My Account</h1>

        {status === "loading" || status === "idle" ? (
          <Card>
            <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <RefreshCw className="size-4 animate-spin" />
              Loading your account details...
            </CardContent>
          </Card>
        ) : null}

        {status === "server-error" ? (
          <ServerErrorView message={errorMessage} onRetry={() => void fetchMyAccount()} />
        ) : null}

        {status === "error" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-orange-500" />
                Unable to load account
              </CardTitle>
              <CardDescription>{errorMessage || "Please try again."}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={() => void fetchMyAccount()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {status === "success" && user ? (
          <div className="mt-2 grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="size-5 text-sky-600" />
                  Profile
                </CardTitle>
                <CardDescription>Account Details</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <AccountRow label="First Name" value={user.firstName} icon={<UserRound className="size-3.5" />} />
                <AccountRow label="Email" value={user.email} icon={<Mail className="size-3.5" />} />
                <AccountRow
                  label="Phone Number"
                  value={user.phoneNumber}
                  icon={<Phone className="size-3.5" />}
                />
                <AccountRow label="Password" value={maskedPassword} icon={<KeyRound className="size-3.5" />} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinned className="size-5 text-violet-600" />
                  Address
                </CardTitle>
                <CardDescription>Address Details </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <AccountRow
                  label="Address line 1"
                  value={user.address?.firstLine ?? ""}
                  icon={<MapPinned className="size-3.5" />}
                />
                <AccountRow
                  label="Address line 2"
                  value={user.address?.secondLine ?? ""}
                  icon={<MapPinned className="size-3.5" />}
                />
                <AccountRow label="State" value={user.address?.state ?? ""} />
                <AccountRow label="City" value={user.address?.city ?? ""} />
                <AccountRow label="Zip code" value={user.address?.zipCode ?? ""} />
              </CardContent>
            </Card>
          </div>
        ) : null}
      </section>
    </AuthenticatedDashboardLayout>
  );
}
