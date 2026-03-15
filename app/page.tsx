'use client';

import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '@/lib/store';
import {login, logout} from '@/lib/slices/authSlice';

export default function Home() {
    const dispatch = useDispatch();
    const {isAuthenticated, user} = useSelector((state: RootState) => state.auth);


    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <div>
                <h2>Auth Demo</h2>
                <p>Status: {isAuthenticated ? 'Logged in' : 'Logged out'}</p>
                {isAuthenticated && <p>User: {user}</p>}
                <button onClick={() => dispatch(login('demoUser'))}>Login</button>
                <button onClick={() => dispatch(logout())}>Logout</button>
            </div>
        </div>
    );
}
