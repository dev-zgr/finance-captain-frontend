import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { AccountSummary, TransactionDTO } from "@/lib/checking-account/types"

type CheckingAccountState = {
  summary: AccountSummary | null
  transactions: TransactionDTO[]
}

const initialState: CheckingAccountState = {
  summary: null,
  transactions: [],
}

const checkingAccountSlice = createSlice({
  name: "checkingAccount",
  initialState,
  reducers: {
    setCheckingSummary(state, action: PayloadAction<AccountSummary | null>) {
      state.summary = action.payload
    },
    setCheckingBalance(state, action: PayloadAction<number>) {
      if (state.summary) {
        state.summary.accountBalance = action.payload
      } else {
        state.summary = {
          accountBalance: action.payload,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          accountOpeningDate: null,
        }
      }
    },
    addCheckingTransaction(state, action: PayloadAction<TransactionDTO>) {
      state.transactions = [
        action.payload,
        ...state.transactions.filter(
          (transaction) =>
            transaction.transactionId !== action.payload.transactionId
        ),
      ]
    },
  },
})

export const {
  addCheckingTransaction,
  setCheckingBalance,
  setCheckingSummary,
} = checkingAccountSlice.actions
export type { CheckingAccountState }
export default checkingAccountSlice.reducer
