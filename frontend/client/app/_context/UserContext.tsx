"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface User {
  id: string;
  _id: string;
  name: string;
  contact_info: {
    email?: string;
    phone?: string;
  };
  role?: 'user' | 'doctor';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  register: (userData: RegistrationData) => Promise<void>;
  login: (loginData: LoginData) => Promise<void>;
  clearError: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegistrationData {
  name: string;
  contact_info: {
    email?: string;
    phone?: string;
  };
  password: string;
}

interface LoginData {
  name?: string;
  contact_info: {
    email?: string;
    phone?: string;
  };
  password: string;
}

const UserContext = createContext<AuthContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize user from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
        }
      }
    }
  }, []);

  const clearError = () => setError(null);

  const register = async (userData: RegistrationData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required fields
      const { name, contact_info, password } = userData;
      const { email, phone } = contact_info;

      if (!name || (!email && !phone) || !password) {
        throw new Error('Please provide all required fields');
      }

      // Basic email validation
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('Please provide a valid email address');
        }
      }

      // Basic phone validation
      if (phone) {
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(phone)) {
          throw new Error('Please provide a valid phone number');
        }
      }

      const response = await axios.post('http://localhost:8000/api/v1/patients/register', userData);

      if (response.data.data) {
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        router.push('/kyc/user');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Registration failed');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (loginData: LoginData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { name, contact_info, password } = loginData;
      const { email } = contact_info;

      if ((!name && !email) || !password) {
        throw new Error('Please provide all required fields');
      }

      const response = await axios.post('http://localhost:8000/api/v1/patients/login', loginData, {
        withCredentials: true,
      });

      if (response.data.data.user) {
        const userData = response.data.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        router.push('/dashboard/user');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Login failed');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    router.push('/user/login');
  };

  return (
    <UserContext.Provider 
      value={{ 
        user,
        isLoading,
        error,
        register,
        login,
        clearError,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}