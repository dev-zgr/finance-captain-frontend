import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { getTransactionTypeFromCategory } from "@/lib/checking-account/transaction-presentation";
import { Badge } from "@/components/ui/badge";

type TransactionTypeBadgeProps = {
  category: string;
};

export function TransactionTypeBadge({ category }: TransactionTypeBadgeProps) {
  const type = getTransactionTypeFromCategory(category);

  return type === "INCOME" ? (
    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
      Income
      <ArrowUpRight data-icon="inline-end" />
    </Badge>
  ) : (
    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/10">
      Expense
      <ArrowDownRight data-icon="inline-end" />
    </Badge>
  );
}
