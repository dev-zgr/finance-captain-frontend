import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebtAccountOverviewPage() {
  return (
    <AuthenticatedDashboardLayout>
      <section className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Debts Account Overview</CardTitle>
          </CardHeader>
          <CardContent>Boilerplate</CardContent>
        </Card>
      </section>
    </AuthenticatedDashboardLayout>
  );
}
