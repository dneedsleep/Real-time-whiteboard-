import React, { createContext, useContext, useState, useEffect } from "react";

type User = {
    id: string;
    email: string;
};

type AuthContextType = {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    signup:(email:string , password:string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (email: string, password: string) => {
        const res = await fetch('http://localhost:8081/auth/login', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials:"include",
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            throw new Error("Login failed")
        } else {
            const data = await res.json();
            //const temp = await data.cookie.token;
            setToken(data?.token);
            setUser(data?.user);
            localStorage.setItem('token', data.token);
        }
    };

    const signup = async (email: string, password: string) => {
        const res = await fetch('http://localhost:8081/auth/signup', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials:"include",
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            console.log(res);
            throw new Error("SignUp failed")
        } else {
            const data = await res.json();
            //const temp = await data.cookie.token;
            setToken(data?.token);
            setUser(data?.user);
            localStorage.setItem('token', data.token);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                isAuthenticated:!!token,
                signup,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
};
