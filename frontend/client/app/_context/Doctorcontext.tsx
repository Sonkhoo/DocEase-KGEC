"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface DoctorAuthContextType {
  doctor: Doctor | null;
  isLoading: boolean;
  error: string | null;
  access_token: string | null;
  user_id: string | null;
  isAuthenticated: boolean;
  registerDoctor: (doctorData: DoctorRegistrationData) => Promise<void>;
  loginDoctor: (loginData: DoctorLoginData) => Promise<void>;
  clearError: () => void;
  logoutDoctor: () => void;
}

interface Doctor {
  experience: number;
  specialty: string[];
  qualifications: string[];
  availability: never[];
  hospital_affiliation: string;
  consultation_fee: number;
  registrationNumber: string;
  _id: string;
  name: string;
  specialization: string;
  contact_info: {
    email?: string;
    phone?: string;
  };
  bio?: string;
  education?: {
    degree: string;
    institution: string;
    year: string;
  }[];
  languages?: string[];
  awards?: string[];
  publications?: string[];
}

interface DoctorRegistrationData {
  name: string;
  speciality: string;
  contact_info: {
    email?: string;
    phone?: string;
  };
  password: string;
}

interface DoctorLoginData {
  contact_info: {
    email?: string;
    phone?: string;
  };
  password: string;
}

const DoctorAuthContext = createContext<DoctorAuthContextType | undefined>(undefined);

export function DoctorAuthProvider({ children }: { children: ReactNode }) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [access_token, setAccessToken] = useState<string | null>(null);
  const [user_id, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initial loading state
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Compute isAuthenticated based on whether access_token and user_id exist
  const isAuthenticated = !!access_token && !!user_id && !!doctor;

  // Initialize from localStorage and cookies on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        // First try localStorage
        if (typeof window !== 'undefined') {
          const storedDoctor = localStorage.getItem('doctor');
          const storedToken = localStorage.getItem('doctorAccessToken');
          const storedUserId = localStorage.getItem('doctorUserId');
          
          // Log what we found in localStorage
          console.log("Auth data in localStorage:", {
            doctor: !!storedDoctor,
            token: !!storedToken,
            userId: !!storedUserId
          });
          
          if (storedDoctor && storedToken && storedUserId) {
            try {
              setDoctor(JSON.parse(storedDoctor));
              setAccessToken(storedToken);
              setUserId(storedUserId);
              setIsLoading(false);
              return; // Successfully loaded from localStorage
            } catch (error) {
              console.error('Error parsing stored doctor data:', error);
              // Clear invalid localStorage data
              localStorage.removeItem('doctor');
              localStorage.removeItem('doctorAccessToken');
              localStorage.removeItem('doctorUserId');
            }
          }
        }
        
        // Fallback to cookies if localStorage fails
        const cookieToken = Cookies.get("accessToken");
        const cookieUserId = Cookies.get("userId");
        
        console.log("Auth data in cookies:", {
          token: !!cookieToken,
          userId: cookieUserId
        });
        
        if (cookieToken && cookieUserId) {
          setAccessToken(cookieToken);
          setUserId(cookieUserId);
          // Fetch doctor data
          fetchDoctorData(cookieToken, cookieUserId);
        } else {
          setIsLoading(false); // No auth data found
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Fetch doctor data if access_token and user_id are present
  const fetchDoctorData = async (token: string, userId: string) => {
    try {
      console.log("Fetching doctor data for userId:", userId);
      
      const response = await axios.get(`http://localhost:8000/api/v1/doctors/profile/${userId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log("Doctor data response status:", response.status);
      
      if (response.data && response.data.data && response.data.data.user) {
        const doctorData = response.data.data.user;
        
        // Update state
        setDoctor(doctorData);
        
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('doctor', JSON.stringify(doctorData));
          localStorage.setItem('doctorAccessToken', token);
          localStorage.setItem('doctorUserId', userId);
        }
        
        console.log("Doctor data loaded and saved successfully");
      } else {
        console.warn("Doctor data structure unexpected:", response.data);
        throw new Error("Invalid doctor data structure");
      }
    } catch (error) {
      console.error("Error fetching doctor data:", error);
      
      // Check specific error conditions
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          console.log("Authentication failed, clearing session");
          logoutDoctor();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const registerDoctor = async (doctorData: DoctorRegistrationData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { name, contact_info, password } = doctorData;
      const { email, phone } = contact_info;

      if (!name || (!email && !phone) || !password) {
        throw new Error("Please provide all required fields");
      }

      console.log("Attempting doctor registration");
      const response = await axios.post("http://localhost:8000/api/v1/doctors/register", doctorData);
      console.log("Registration response:", response.status);

      if (response.data.data) {
        const { user, accessToken } = response.data.data;
        console.log("Doctor registration successful");
        
        // Update state
        setDoctor(user);
        setAccessToken(accessToken);
        setUserId(user._id);
        
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('doctor', JSON.stringify(user));
          localStorage.setItem('doctorAccessToken', accessToken);
          localStorage.setItem('doctorUserId', user._id);
        }
        
        // Also set cookies as backup
        Cookies.set("accessToken", accessToken, { 
          expires: 30,
          path: '/',
          sameSite: "lax"
        });
        Cookies.set("userId", user._id, { 
          expires: 30,
          path: '/',
          sameSite: "lax"
        });

        // Route to KYC page after registration
        router.push("/kyc/doctor");
      }
    } catch (err) {
      console.error("Registration error:", err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Registration failed");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginDoctor = async (loginData: DoctorLoginData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { contact_info, password } = loginData;
      const { email, phone } = contact_info;

      if ((!email && !phone) || !password) {
        throw new Error("Please provide email/phone and password");
      }

      console.log("Attempting doctor login");
      
      const response = await axios.post("http://localhost:8000/api/v1/doctors/login", loginData, {
        withCredentials: true,
      });

      console.log("Login response status:", response.status);

      if (response.data.data.user) {
        const user = response.data.data.user;
        const token = response.data.data.accessToken;

        console.log("Doctor login successful");
        
        // Update state
        setDoctor(user);
        setAccessToken(token);
        setUserId(user._id);
        
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('doctor', JSON.stringify(user));
          localStorage.setItem('doctorAccessToken', token);
          localStorage.setItem('doctorUserId', user._id);
        }
        
        // Also set cookies as backup
        Cookies.set("accessToken", token, { 
          expires: 30,
          path: '/',
          sameSite: "lax"
        });
        Cookies.set("userId", user._id, { 
          expires: 30,
          path: '/',
          sameSite: "lax" 
        });

        // Route to dashboard after login
        router.push("/dashboard/doctor");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Login failed");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logoutDoctor = () => {
    console.log("Logging out doctor");
    
    // Clear React state
    setDoctor(null);
    setAccessToken(null);
    setUserId(null);

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('doctor');
      localStorage.removeItem('doctorAccessToken');
      localStorage.removeItem('doctorUserId');
    }

    // Clear cookies
    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("userId", { path: "/" });
    
    // Alternative cookie clearing approach
    document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Navigate back to login
    router.push("/doctor/login");
  };

  const value = {
    doctor,
    isLoading,
    error,
    access_token,
    user_id,
    isAuthenticated,
    registerDoctor,
    loginDoctor,
    clearError,
    logoutDoctor,
  };

  return <DoctorAuthContext.Provider value={value}>{children}</DoctorAuthContext.Provider>;
}

export function useDoctorAuth() {
  const context = useContext(DoctorAuthContext);
  if (context === undefined) {
    throw new Error("useDoctorAuth must be used within a DoctorAuthProvider");
  }
  return context;
}