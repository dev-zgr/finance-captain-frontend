import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type {
  InvestmentAccountStatus,
  InvestmentNewsResponse,
  InvestmentPagedResponse,
  InvestmentSummary,
  InvestmentTransactionDTO,
  PositionDTO,
  StockDetailsDTO,
} from "@/lib/investment-account/types"

type InvestmentStatusState = {
  summary: InvestmentAccountStatus
  positions: InvestmentAccountStatus
  transactions: InvestmentAccountStatus
  news: InvestmentAccountStatus
  stock: InvestmentAccountStatus
}

type InvestmentErrorState = {
  summary: string | null
  positions: string | null
  transactions: string | null
  news: string | null
  stock: string | null
}

interface InvestmentAccountState {
  summary: InvestmentSummary | null
  positions: InvestmentPagedResponse<PositionDTO> | null
  transactions: InvestmentPagedResponse<InvestmentTransactionDTO> | null
  news: InvestmentNewsResponse | null
  selectedStock: StockDetailsDTO | null
  status: InvestmentStatusState
  error: InvestmentErrorState
}

const initialStatus: InvestmentStatusState = {
  summary: "idle",
  positions: "idle",
  transactions: "idle",
  news: "idle",
  stock: "idle",
}

const initialError: InvestmentErrorState = {
  summary: null,
  positions: null,
  transactions: null,
  news: null,
  stock: null,
}

const initialState: InvestmentAccountState = {
  summary: null,
  positions: null,
  transactions: null,
  news: null,
  selectedStock: null,
  status: initialStatus,
  error: initialError,
}

const investmentAccountSlice = createSlice({
  name: "investmentAccount",
  initialState,
  reducers: {
    setInvestmentSummary(state, action: PayloadAction<InvestmentSummary | null>) {
      state.summary = action.payload
      state.status.summary = "succeeded"
      state.error.summary = null
    },
    setInvestmentBalance(state, action: PayloadAction<number>) {
      if (state.summary) {
        state.summary.accountBalance = action.payload
        state.summary.cashBalance = action.payload
      } else {
        state.summary = {
          accountBalance: action.payload,
          totalPortfolioValue: 0,
          totalGainLoss: 0,
          totalGainLossPercentage: 0,
          cashBalance: action.payload,
          investedAmount: 0,
          accountOpeningDate: null,
        }
      }
    },
    setInvestmentTransactions(
      state,
      action: PayloadAction<InvestmentPagedResponse<InvestmentTransactionDTO> | null>
    ) {
      state.transactions = action.payload
      state.status.transactions = "succeeded"
      state.error.transactions = null
    },
    addInvestmentTransaction(
      state,
      action: PayloadAction<InvestmentTransactionDTO>
    ) {
      if (!state.transactions) {
        state.transactions = {
          items: [action.payload],
          page: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1,
        }
        return
      }

      const existingItems = state.transactions.items.filter(
        (transaction) =>
          transaction.transactionId !== action.payload.transactionId
      )
      state.transactions.items = [action.payload, ...existingItems]
      state.transactions.totalElements +=
        existingItems.length === state.transactions.items.length - 1 ? 1 : 0
    },
    setInvestmentStatus(
      state,
      action: PayloadAction<{
        key: keyof InvestmentStatusState
        status: InvestmentAccountStatus
      }>
    ) {
      state.status[action.payload.key] = action.payload.status
    },
    setInvestmentError(
      state,
      action: PayloadAction<{
        key: keyof InvestmentErrorState
        error: string | null
      }>
    ) {
      state.error[action.payload.key] = action.payload.error
      if (action.payload.error) {
        state.status[action.payload.key] = "failed"
      }
    },
  },
})

export const {
  addInvestmentTransaction,
  setInvestmentBalance,
  setInvestmentError,
  setInvestmentStatus,
  setInvestmentSummary,
  setInvestmentTransactions,
} = investmentAccountSlice.actions
export type { InvestmentAccountState }
export default investmentAccountSlice.reducer
