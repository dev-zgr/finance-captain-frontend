import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Address {
    firstLine: string;
    secondLine: string | null;
    state: string;
    city: string;
    zipCode: string;
}

export interface AuthUser {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    address: Address | null;
}

export interface AuthContent {
    token: string;
    expiresIn: number;
    user: AuthUser;
}

export interface AuthState {
    isAuthenticated: boolean;
    content: AuthContent | null;
}

const initialState: AuthState = {
    isAuthenticated: false,
    content: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login(state, action: PayloadAction<AuthContent>) {
            state.isAuthenticated = true;
            state.content = action.payload;
        },
        logout(state) {
            state.isAuthenticated = false;
            state.content = null;
        },
        setAuthFromStorage(state, action: PayloadAction<AuthContent | null>) {
            if (action.payload) {
                state.isAuthenticated = true;
                state.content = action.payload;
            } else {
                state.isAuthenticated = false;
                state.content = null;
            }
        },
    },
});

export const { login, logout, setAuthFromStorage } = authSlice.actions;
export default authSlice.reducer;
