import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebtAccountsPage() {
  return (
    <AuthenticatedDashboardLayout>
      <section className="flex flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-[13fr_7fr]">
          <Card className="h-full min-h-[260px]">
            <CardHeader>
              <CardTitle>Chart</CardTitle>
            </CardHeader>
            <CardContent>Chart</CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="min-h-[122px]">
              <CardHeader>
                <CardTitle>Top Right</CardTitle>
              </CardHeader>
              <CardContent>Card 1</CardContent>
            </Card>

            <Card className="min-h-[122px]">
              <CardHeader>
                <CardTitle>Bottom Right</CardTitle>
              </CardHeader>
              <CardContent>Card 2</CardContent>
            </Card>
          </div>
        </div>

        <Card className="min-h-[180px]">
          <CardHeader>
            <CardTitle>Bottom Full Width</CardTitle>
          </CardHeader>
          <CardContent>Card 3</CardContent>
        </Card>
      </section>
    </AuthenticatedDashboardLayout>
  );
}
