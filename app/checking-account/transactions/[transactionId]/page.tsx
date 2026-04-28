"use client";

import { useParams } from "next/navigation";

import { TransactionDetailCard } from "@/components/components/checking-account/transaction-detail-card";
import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout";

export default function CheckingTransactionDetailPage() {
  const { transactionId } = useParams<{ transactionId: string }>();

  return (
    <AuthenticatedDashboardLayout>
      <section>
        <TransactionDetailCard transactionId={transactionId} />
      </section>
    </AuthenticatedDashboardLayout>
  );
}
