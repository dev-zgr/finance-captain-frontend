import React from "react";

import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout";
import { CheckingTransactionsTable } from "@/components/components/checking-account/checking-transactions-table";

export default function CheckingAccountTransactionsPage() {
  return (
    <AuthenticatedDashboardLayout>
      <section className="h-full min-h-[75vh]">
        <CheckingTransactionsTable />
      </section>
    </AuthenticatedDashboardLayout>
  );
}
