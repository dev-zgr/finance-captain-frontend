import React from "react";

import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckingPage() {
  return (
    <AuthenticatedDashboardLayout>
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Checking Account</h1>

        <div className="grid gap-4 lg:grid-cols-[13fr_7fr]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Chart</CardTitle>
              <CardDescription>Primary checking account visualization area.</CardDescription>
            </CardHeader>
            <CardContent className="min-h-56" />
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Card 1</CardTitle>
                <CardDescription>Top right placeholder.</CardDescription>
              </CardHeader>
              <CardContent className="min-h-24" />
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card 2</CardTitle>
                <CardDescription>Bottom right placeholder.</CardDescription>
              </CardHeader>
              <CardContent className="min-h-24" />
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bottom Full Width</CardTitle>
            <CardDescription>Bottom section placeholder.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-40" />
        </Card>
      </section>
    </AuthenticatedDashboardLayout>
  );
}
