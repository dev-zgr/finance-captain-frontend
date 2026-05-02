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

type TradeStatus = "idle" | "submitting" | "success" | "error"

type InvestmentStatusState = {
  summary: InvestmentAccountStatus
  positions: InvestmentAccountStatus
  transactions: InvestmentAccountStatus
  news: InvestmentAccountStatus
  stock: InvestmentAccountStatus
  trade: TradeStatus
}

type InvestmentErrorState = {
  summary: string | null
  positions: string | null
  transactions: string | null
  news: string | null
  stock: string | null
  trade: string | null
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
  trade: "idle",
}

const initialError: InvestmentErrorState = {
  summary: null,
  positions: null,
  transactions: null,
  news: null,
  stock: null,
  trade: null,
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
        state.summary.cashBalance = action.payload
        state.summary.accountValue = action.payload + state.summary.marketValue
      } else {
        state.summary = {
          hasAccount: true,
          openingDate: new Date().toISOString(),
          cashBalance: action.payload,
          marketValue: 0,
          accountValue: action.payload,
          totalCostBasis: 0,
          unrealizedPnl: 0,
          unrealizedPnlPercent: 0,
          thisMonthNetPnl: 0,
          previousMonthNetPnl: 0,
          portfolioGrowthRatePercent: null,
          priceDataPartial: false,
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
        status: InvestmentAccountStatus | TradeStatus
      }>
    ) {
      if (action.payload.key === "trade") {
        state.status.trade = action.payload.status as TradeStatus
      } else {
        state.status[action.payload.key as Exclude<keyof InvestmentStatusState, "trade">] =
          action.payload.status as InvestmentAccountStatus
      }
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
        if (action.payload.key === "trade") {
          state.status.trade = "error"
        } else {
          state.status[action.payload.key as Exclude<keyof InvestmentStatusState, "trade">] = "failed"
        }
      }
    },
    setSelectedStock(state, action: PayloadAction<StockDetailsDTO | null>) {
      state.selectedStock = action.payload
    },
    setTradeStatus(state, action: PayloadAction<TradeStatus>) {
      state.status.trade = action.payload
    },
    clearTradeError(state) {
      state.error.trade = null
      if (state.status.trade === "error") {
        state.status.trade = "idle"
      }
    },
  },
})

export const {
  addInvestmentTransaction,
  clearTradeError,
  setInvestmentBalance,
  setInvestmentError,
  setInvestmentStatus,
  setInvestmentSummary,
  setInvestmentTransactions,
  setSelectedStock,
  setTradeStatus,
} = investmentAccountSlice.actions
export type { InvestmentAccountState }
export default investmentAccountSlice.reducer
