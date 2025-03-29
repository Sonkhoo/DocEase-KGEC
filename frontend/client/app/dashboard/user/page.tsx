"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Doctor } from "@/components/doctor-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, Activity, Pill, Clock, User, ChevronRight } from "lucide-react";
import { DoctorsList } from "@/components/doctor-list";
import { AppointmentModal } from "@/components/appointment-modal";
import { FloatingPaper } from "@/components/common/floating-paper";
import Navbar2 from "@/components/common/navbar2";
import { PrescriptionCard } from "@/components/PrescriptionCard";
import PrescriptionViewer from "@/components/PrescriptionViewer";
import { useUser } from "@/app/_context/UserContext";

export default function UserHealthDashboard() {
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const router = useRouter();
  const { user } = useUser();

  const openAppointmentModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsAppointmentModalOpen(true);
  };

  const handleBookAppointment = (doctor: Doctor) => {
    router.push(`/appointment`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
     
      <FloatingPaper count={8} />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 mt-24">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, <span className="text-green-600">{user?.name || 'User'}</span>
          </h1>
          <p className="text-gray-600 mt-2">Here's an overview of your health status</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Upcoming Appointments</CardTitle>
              <Calendar className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">3</div>
              <div className="flex items-center mt-2">
                <p className="text-sm text-green-600">Next: Dr. BASU on 18th May</p>
                <ChevronRight className="h-4 w-4 ml-2 text-green-600" />
              </div>
            </CardContent>
          </GlassCard>

          <GlassCard className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Active Prescriptions</CardTitle>
              <FileText className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">2</div>
              <p className="text-sm text-green-600">Last updated: 2 days ago</p>
            </CardContent>
          </GlassCard>

          <GlassCard className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Health Score</CardTitle>
              <Activity className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">85/100</div>
              <p className="text-sm text-green-600">Improved by 5 points</p>
            </CardContent>
          </GlassCard>

          <GlassCard className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Next Check-up</CardTitle>
              <Clock className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">3 weeks</div>
              <p className="text-sm text-green-600">Annual physical</p>
            </CardContent>
          </GlassCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Prescription NFT Section */}
            <GlassCard className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl">Prescription NFT</CardTitle>
                <FileText className="h-6 w-6 text-green-600" />
              </CardHeader>
              <CardContent>
                <PrescriptionCard />
              </CardContent>
            </GlassCard>

            {/* Book Appointment Section */}
            <GlassCard className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl">Book an Appointment</CardTitle>
                <Calendar className="h-6 w-6 text-green-600" />
              </CardHeader>
              <CardContent>
                <DoctorsList />
              </CardContent>
            </GlassCard>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Prescription NFTs List */}
            <GlassCard className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl">Prescription NFTs</CardTitle>
                <FileText className="h-6 w-6 text-green-600" />
              </CardHeader>
              <CardContent>
                <PrescriptionViewer />
              </CardContent>
            </GlassCard>

            {/* Medication Reminder */}
            <GlassCard className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl">Medication Reminder</CardTitle>
                <Pill className="h-6 w-6 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <Pill className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium">Vitamin D</p>
                        <p className="text-sm text-gray-600">1 tablet daily</p>
                      </div>
                    </div>
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <Pill className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium">Blood Pressure</p>
                        <p className="text-sm text-gray-600">2 tablets daily</p>
                      </div>
                    </div>
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </div>
      </div>

      {selectedDoctor && (
        <AppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          doctor={selectedDoctor}
        />
      )}
    </div>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card
      className={`bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg border border-opacity-20 border-white shadow-xl ${className}`}
    >
      {children}
    </Card>
  );
}