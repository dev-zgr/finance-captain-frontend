export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
  MY_ACCOUNT: `${API_BASE_URL}/api/v1/auth/my-account`,
  CHECKING_TRANSACTIONS: `${API_BASE_URL}/api/v1/checking/transactions`,
  CHECKING_TRANSACTION_BY_ID: `${API_BASE_URL}/api/v1/checking/transactions`,
  TIME_SERIES: `${API_BASE_URL}/api/v1/checking/transactions/time-series`,
  CATEGORY_SUGGESTION: `${API_BASE_URL}/api/v1/ai/llm/category`,
  CATEGORIZE: `${API_BASE_URL}/api/v1/ai/categorize`,
  VLM_EXTRACTION: `${API_BASE_URL}/api/v1/ai/vlm`,
  CHECKING_SUMMARY: `${API_BASE_URL}/api/v1/checking/summary`,
  DEBTS_SUMMARY: `${API_BASE_URL}/api/v1/debts/summary`,
  DEBTS_TRANSACTIONS: `${API_BASE_URL}/api/v1/debts/transactions`,
  DEBTS_TIME_SERIES: `${API_BASE_URL}/api/v1/debts/transactions/time-series`,
}

export const INVESTMENT_API = {
  SUMMARY: `${API_BASE_URL}/api/v1/investment/summary`,
  POSITIONS: `${API_BASE_URL}/api/v1/investment/positions`,
  POSITION_BY_ID: (id: string) =>
    `${API_BASE_URL}/api/v1/investment/positions/${id}`,
  TRANSACTIONS: `${API_BASE_URL}/api/v1/investment/transactions`,
  TRANSACTION_BY_ID: (id: number) =>
    `${API_BASE_URL}/api/v1/investment/transactions/${id}`,
  DEPOSIT: `${API_BASE_URL}/api/v1/investment/transactions/deposit`,
  WITHDRAW: `${API_BASE_URL}/api/v1/investment/transactions/withdraw`,
  BUY: `${API_BASE_URL}/api/v1/investment/transactions/buy`,
  SELL: `${API_BASE_URL}/api/v1/investment/transactions/sell`,
  STOCK_DETAILS: (ticker: string) =>
    `${API_BASE_URL}/api/v1/investment/stocks/${ticker}`,
  NEWS: `${API_BASE_URL}/api/v1/investment/news`,
  NEWS_REFRESH: `${API_BASE_URL}/api/v1/investment/news/refresh`,
} as const
