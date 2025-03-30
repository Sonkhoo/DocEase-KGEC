"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, FileText, Activity, Pill, Clock, ChevronRight, Upload, FileImage, AlertCircle, Check, X } from "lucide-react"
import { DoctorsList } from "@/components/doctor-list"
import { AppointmentModal } from "@/components/appointment-modal"
import { FloatingPaper } from "@/components/common/floating-paper"
import { PrescriptionCard } from "@/components/PrescriptionCard"
import PrescriptionViewer from "@/components/PrescriptionViewer"
import { useUser } from "@/app/_context/UserContext"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Define Doctor interface to fix type errors
interface Doctor {
  _id: string;
  name: string;
  specialty: string[];
  experience: number;
  hospital_affiliation?: string;
  consultation_fee?: number;
  rating?: number;
  profileImage?: {
    url: string;
  };
}

// Define interfaces for the structured medication data
interface Medication {
  name: string;
  dosage: string;
  instructions: string;
}

interface PrescriptionAnalysisResult {
  success: boolean;
  raw_text: string;
  corrected_text: string;
  medications: Medication[];
  parsed_data: {
    doctor_name?: string;
    patient_name?: string;
    date?: string;
    hospital?: string;
    notes?: string;
  };
  processing_time_ms: number;
  error?: string;
}

// Function to decode medical abbreviations
const decodeMedicalAbbreviation = (abbr: string): string => {
  const abbreviations: Record<string, string> = {
    "QD": "once daily",
    "BID": "twice daily",
    "TID": "three times daily",
    "QID": "four times daily",
    "AC": "before meals",
    "PC": "after meals",
    "PRN": "as needed",
    "PO": "by mouth",
    "SL": "sublingual (under the tongue)",
    "IM": "intramuscular",
    "IV": "intravenous",
    "SC": "subcutaneous"
  };
  
  return abbreviations[abbr.toUpperCase()] || abbr;
};

export default function UserHealthDashboard() {
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const router = useRouter()
  const { user } = useUser()
  const [prescription, setPrescription] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<PrescriptionAnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [showSavedSuccess, setShowSavedSuccess] = useState(false)

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
      setShowSavedSuccess(false)
    }
  }

  const analyzePrescription = async () => {
    if (!prescription) return
  
    setIsAnalyzing(true)
    setAnalysisError(null)
    setShowSavedSuccess(false)
  
    try {
      const formData = new FormData()
      formData.append("prescription", prescription)
  
      const response = await fetch("http://127.0.0.1:59978/api/v1/analyze-prescription/", {
        method: "POST",
        headers: {
          "X-API-Key": "dev_key", // Include API key here
        },
        body: formData,
      })
  
      const data = await response.json()
  
      if (response.ok && data.success) {
        setAnalysisResult(data)
      } else {
        setAnalysisError(data.error || "Failed to analyze prescription. Please try again.")
      }
    } catch (error) {
      setAnalysisError("An error occurred while analyzing the prescription. Please try again.")
      console.error("Error analyzing prescription:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const savePrescriptionToMedicationReminders = () => {
    // In a real app, this would save to a database or state management
    setShowSavedSuccess(true)
    
    // Reset after 3 seconds
    setTimeout(() => {
      setShowSavedSuccess(false)
    }, 3000)
  }

  // Process instructions to display with decoded abbreviations
  const processInstructions = (instruction: string): string => {
    // Check for common medical abbreviations
    let processed = instruction;
    const abbrs = ["QD", "BID", "TID", "QID", "AC", "PC", "PRN", "PO", "SL", "IM", "IV", "SC"];
    
    for (const abbr of abbrs) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      if (regex.test(processed)) {
        const decoded = decodeMedicalAbbreviation(abbr);
        processed = processed.replace(regex, `${abbr} (${decoded})`);
      }
    }
    
    return processed;
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
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{analysisError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {showSavedSuccess && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertDescription>Medications saved to your reminders!</AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Sample prescription for testing */}
                  <div className="border border-dashed border-gray-300 rounded-lg p-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Test with sample prescription:</h4>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded overflow-auto max-h-[100px]">
                      DEA GB 05455616 LIC 976269 . MEDICAL CENTRE 824 14 Street New York, NY 10043, USA name Joba Smith, age 34 address_62 Example St Mt. patient 09-01-12 Betamethasone 100mg - 1 tab BID Darzalex 10 mg - 1 tab QD Cimetidine 500 mg - 2 tabs TID Omeprazole 20 mg - 1 tab QD Int 5 Dr. Steve Jacobson signature
                    </pre>
                  </div>
                </div>

                <div className="bg-white bg-opacity-50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Analysis Result</h3>
                  {analysisResult ? (
                    <div className="space-y-4">
                      {/* Prescription Info */}
                      {analysisResult.parsed_data && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <h4 className="font-medium text-sm mb-2 text-green-700">Prescription Information</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {analysisResult.parsed_data.doctor_name && (
                              <div>
                                <span className="font-medium">Doctor:</span> {analysisResult.parsed_data.doctor_name}
                              </div>
                            )}
                            {analysisResult.parsed_data.patient_name && (
                              <div>
                                <span className="font-medium">Patient:</span> {analysisResult.parsed_data.patient_name}
                              </div>
                            )}
                            {analysisResult.parsed_data.date && (
                              <div>
                                <span className="font-medium">Date:</span> {analysisResult.parsed_data.date}
                              </div>
                            )}
                            {analysisResult.parsed_data.hospital && (
                              <div>
                                <span className="font-medium">Hospital:</span> {analysisResult.parsed_data.hospital}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Medications Table */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-sm text-green-700">Medications</h4>
                          {analysisResult.medications && analysisResult.medications.length > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs" 
                              onClick={savePrescriptionToMedicationReminders}
                            >
                              <Pill className="h-3 w-3 mr-1" /> Save to Reminders
                            </Button>
                          )}
                        </div>
                        
                        {analysisResult.medications && analysisResult.medications.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Dosage</TableHead>
                                <TableHead>Instructions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {analysisResult.medications.map((med, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">
                                    {med.name}
                                    <Badge variant="outline" className="ml-2 text-xs">Rx</Badge>
                                  </TableCell>
                                  <TableCell>{med.dosage}</TableCell>
                                  <TableCell>{processInstructions(med.instructions)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No medications identified</p>
                        )}
                      </div>
                      
                      {/* Additional Notes */}
                      {analysisResult.parsed_data.notes && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-green-700">Notes</h4>
                          <p className="text-sm bg-white p-3 rounded-lg shadow-sm">{analysisResult.parsed_data.notes}</p>
                        </div>
                      )}
                      
                      {/* Raw Text (Collapsible) */}
                      <details className="mt-4">
                        <summary className="text-sm font-medium text-green-700 cursor-pointer">
                          View Raw Text
                        </summary>
                        <Textarea
                          value={analysisResult.corrected_text}
                          readOnly
                          className="mt-2 min-h-[150px] bg-white text-sm"
                        />
                      </details>
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

