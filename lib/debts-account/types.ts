import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/lib/checking-account/types"
import type { DebtCategory } from "@/lib/debts-account/constants"

export type DebtsAccountSummary = {
  accountOpeningDate: string | null
  totalDebtsTakenThisMonth: number
  totalPaymentsMadeThisMonth: number
  currentDebtsAccountBalance: number
}

export type DebtsApiSuccessResponse<T> = ApiSuccessResponse<T> & {
  data?: T
}

export type DebtsApiErrorResponse = ApiErrorResponse

export type GetDebtFormValues = {
  date: string
  amount: string
  category: string
  description: string
}

export type GetDebtFormField = keyof GetDebtFormValues
export type GetDebtFormFieldErrors = Partial<Record<GetDebtFormField, string>>

export type CreateDebtsTransactionRequest = {
  transactionType: "DEBT"
  amount: number
  date: string
  category: DebtCategory
  description?: string
}

export type CreateDebtsTransactionResponseContent = {
  debtsTransactionId: number
  debtsAccountId: number
  transactionType: "DEBT" | "PAYMENT"
  amount: number
  date: string
  debtCategory?: DebtCategory
  description?: string | null
  debtsAccountBalance: number
  linkedCheckingTransactionId?: number
  checkingAccountBalance?: number
}
