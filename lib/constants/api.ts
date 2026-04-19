export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
    MY_ACCOUNT: `${API_BASE_URL}/api/v1/auth/my-account`,
};
