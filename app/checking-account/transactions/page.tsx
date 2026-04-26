import React from "react";

import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckingAccountTransactionsPage() {
  return (
    <AuthenticatedDashboardLayout>
      <section className="h-full min-h-[75vh]">
        <Card className="h-full w-full">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Full-size transactions placeholder card.</CardDescription>
          </CardHeader>
          <CardContent className="h-full min-h-[60vh]" />
        </Card>
      </section>
    </AuthenticatedDashboardLayout>
  );
}
