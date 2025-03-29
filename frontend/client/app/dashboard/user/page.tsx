"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Doctor } from "@/components/doctor-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, FileText, Activity, Pill, Clock, ChevronRight, Upload, FileImage } from "lucide-react"
import { DoctorsList } from "@/components/doctor-list"
import { AppointmentModal } from "@/components/appointment-modal"
import { FloatingPaper } from "@/components/common/floating-paper"
import { PrescriptionCard } from "@/components/PrescriptionCard"
import PrescriptionViewer from "@/components/PrescriptionViewer"
import { useUser } from "@/app/_context/UserContext"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UserHealthDashboard() {
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const router = useRouter()
  const { user } = useUser()
  const [prescription, setPrescription] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const openAppointmentModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setIsAppointmentModalOpen(true)
  }

  const handleBookAppointment = (doctor: Doctor) => {
    router.push(`/appointment`)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPrescription(e.target.files[0])
      setAnalysisResult(null)
      setAnalysisError(null)
    }
  }

  const analyzePrescription = async () => {
    if (!prescription) return
  
    setIsAnalyzing(true)
    setAnalysisError(null)
  
    try {
      const formData = new FormData()
      formData.append("prescription", prescription)
  
      const response = await fetch("http://127.0.0.1:5000/analyze-prescription/", {
        method: "POST",
        headers: {
          "X-API-Key": "dev_key", // Include API key here
        },
        body: formData,
      })
  
      const data = await response.json()
  
      if (response.ok && data.success) {
        setAnalysisResult(data.corrected_text)
      } else {
        setAnalysisError("Failed to analyze prescription. Please try again.")
      }
    } catch (error) {
      setAnalysisError("An error occurred while analyzing the prescription. Please try again.")
      console.error("Error analyzing prescription:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <FloatingPaper count={8} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 mt-24">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, <span className="text-green-600">{user?.name || "User"}</span>
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

        {/* Prescription Analysis Section */}
        <div className="mb-8">
          <GlassCard className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl">Prescription Analysis</CardTitle>
              <FileImage className="h-6 w-6 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label htmlFor="prescription-upload" className="text-sm font-medium text-gray-700">
                      Upload Prescription Image
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("prescription-upload")?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Select Image
                      </Button>
                      <span className="text-sm text-gray-500">
                        {prescription ? prescription.name : "No file selected"}
                      </span>
                    </div>
                    <input
                      type="file"
                      id="prescription-upload"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <Button onClick={analyzePrescription} disabled={!prescription || isAnalyzing} className="w-full">
                    {isAnalyzing ? "Analyzing..." : "Analyze Prescription"}
                  </Button>

                  {analysisError && (
                    <Alert variant="destructive">
                      <AlertDescription>{analysisError}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="bg-white bg-opacity-50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Analysis Result</h3>
                  {analysisResult ? (
                    <div className="space-y-2">
                      <Textarea value={analysisResult} readOnly className="min-h-[150px] bg-white" />
                      <div className="flex flex-col space-y-2">
                        <h4 className="font-medium text-sm">Medications Identified:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {analysisResult
                            .split("\n")
                            .filter((line) => line.trim())
                            .map((line, index) => (
                              <li key={index} className="text-gray-700">
                                {line}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-gray-500 italic">
                      Upload and analyze a prescription to see results
                    </div>
                  )}
                </div>
              </div>
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
  )
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card
      className={`bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg border border-opacity-20 border-white shadow-xl ${className}`}
    >
      {children}
    </Card>
  )
}

