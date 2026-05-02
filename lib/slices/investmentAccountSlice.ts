import { createSlice } from "@reduxjs/toolkit"

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
  reducers: {},
})

export type { InvestmentAccountState }
export default investmentAccountSlice.reducer
