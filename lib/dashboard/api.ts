import axios from "axios";

import { API_ENDPOINTS } from "@/lib/constants/api";
import type {
  GetDashboardTransactionsParams,
  GetDashboardTransactionsResponse,
} from "@/lib/dashboard/types";

export async function getDashboardTransactions(
  token: string,
  params: GetDashboardTransactionsParams = {},
  signal?: AbortSignal,
) {
  return axios.get<GetDashboardTransactionsResponse>(
    API_ENDPOINTS.DASHBOARD_TRANSACTIONS,
    {
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
      validateStatus: () => true,
    },
  );
}
