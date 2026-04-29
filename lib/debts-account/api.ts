import axios from "axios";

import { API_ENDPOINTS } from "@/lib/constants/api";
import type {
  DebtsAccountSummary,
  DebtsApiErrorResponse,
  DebtsApiSuccessResponse,
} from "@/lib/debts-account/types";

export async function getDebtsAccountSummary(token: string) {
  return axios.get<DebtsApiSuccessResponse<DebtsAccountSummary> | DebtsApiErrorResponse>(
    API_ENDPOINTS.DEBTS_SUMMARY,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
    },
  );
}
