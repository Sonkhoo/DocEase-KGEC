"use client";

import type React from "react";
import Link from "next/link";
import { useState } from "react";
import { Stethoscope } from "lucide-react";
import { useDoctorAuth } from "@/app/_context/Doctorcontext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DoctorLogin() {
  const { loginDoctor } = useDoctorAuth();
  const [formData, setFormData] = useState({
    name: "",
    contact_info: {
      email: "",
    },
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'email') {
      setFormData({
        ...formData,
        contact_info: { ...formData.contact_info, email: e.target.value }
      });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      await loginDoctor(formData);
    } catch (error) {
      alert("Login failed! Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-semibold text-green-600"
        >
          <Stethoscope className="h-6 w-6" />
          MediConnect
        </Link>
        <Card className="mt-4 w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Doctor Login
            </CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google Sign In Button */}
            <div className="mb-6">
              <Button 
                type="button" 
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm flex items-center justify-center gap-2 py-5 relative overflow-hidden group"
                variant="outline"
                disabled={isLoading}
                onClick={() => window.location.href = 'http://localhost:8000/api/v1/doctors/auth/google'}
              >
                <div className="absolute inset-0 w-3 bg-gradient-to-r from-green-600 to-green-500 transition-all duration-[250ms] ease-out group-hover:w-full opacity-10" />
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Dr. John Doe"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="border-green-200 focus-visible:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="doctor@example.com"
                  required
                  value={formData.contact_info.email}
                  onChange={handleChange}
                  className="border-green-200 focus-visible:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="border-green-200 focus-visible:ring-green-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <div className="mt-4 space-y-2">
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-green-600 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/doctor/register"
                  className="text-green-600 hover:underline"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
