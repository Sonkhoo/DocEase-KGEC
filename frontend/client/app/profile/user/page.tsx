"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  User, Phone, FileText, Edit2, Save, X, Loader2, CheckCircle, 
  Heart, Activity, Calendar, Clock
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion" // Note: You'll need to install framer-motion

// Mock data hook
const usePatientAuth = () => {
  return {
    patient: {
      name: "Jane Smith",
      contact: "+1 (555) 987-6543",
      dateOfBirth: "1985-04-15",
      bloodType: "O+",
      allergies: ["Penicillin", "Peanuts"],
      chronicConditions: ["Asthma"],
      emergencyContact: "John Smith - +1 (555) 123-4567",
      avatar: "/placeholder.svg?height=200&width=200",
      lastVisit: "2025-02-15",
      upcomingAppointments: ["Apr 5, 2025 - 10:00 AM - Dr. Johnson"],
      medicalRecordNumber: "P12345678",
      insuranceInfo: "BlueCross #BC987654321",
    },
    isLoading: false,
    access_token: "mock-token",
    user_id: "user456"
  }
}

interface PatientFormData {
  name: string
  contact: string
  emergencyContact: string
  allergies: string[]
  chronicConditions: string[]
  medicalRecordNumber: string
  insuranceInfo: string
}

const PatientProfilePage = () => {
  const router = useRouter()
  const { patient, isLoading: authLoading, access_token } = usePatientAuth()
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<PatientFormData>({
    name: "",
    contact: "",
    emergencyContact: "",
    allergies: [],
    chronicConditions: [],
    medicalRecordNumber: "",
    insuranceInfo: ""
  })

  useEffect(() => {
    if (!access_token) {
      router.push("/patient/login")
      return
    }

    if (patient) {
      setFormData({
        name: patient.name || "",
        contact: patient.contact || "",
        emergencyContact: patient.emergencyContact || "",
        allergies: patient.allergies || [],
        chronicConditions: patient.chronicConditions || [],
        medicalRecordNumber: patient.medicalRecordNumber || "",
        insuranceInfo: patient.insuranceInfo || ""
      })
      
      // Simulate loading
      setTimeout(() => setLoading(false), 800)
    }
  }, [patient, access_token, router])

  const handleEditClick = () => {
    setIsEditing(true)
    setError(null)
    setSuccess(null)
  }

  const handleCancelClick = () => {
    setIsEditing(false)
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.contact) {
      setError("Please fill in all required fields.")
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess("Profile updated successfully!")
      setIsEditing(false)
    } catch (error) {
      setError("Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600" />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-green-800"
          >
            Loading your profile...
          </motion.p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white shadow-xl border-none mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-28 relative">
              {/* Animated dot pattern */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(20)].map((_, i) => (
                  <motion.div 
                    key={i}
                    className="absolute w-3 h-3 rounded-full bg-white"
                    style={{ 
                      left: `${Math.random() * 100}%`, 
                      top: `${Math.random() * 100}%` 
                    }}
                    animate={{
                      opacity: [0.2, 0.8, 0.2],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      ease: "easeInOut",
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                  />
                ))}
              </div>
              <div className="absolute -bottom-16 left-8">
                <motion.div 
                  className="rounded-full bg-white p-2 shadow-lg"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <div className="h-28 w-28 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={patient.avatar}
                      alt={patient.name}
                      className="h-full w-full object-cover rounded-full"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
            <CardContent className="pt-20 pb-6 px-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <motion.h1 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl font-bold text-gray-800"
                  >
                    {patient.name}
                  </motion.h1>
                  <motion.p 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-gray-500"
                  >
                    Patient ID: {patient.medicalRecordNumber}
                  </motion.p>
                </div>
                {!isEditing && (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Button 
                      onClick={handleEditClick} 
                      className="bg-green-600 hover:bg-green-700 text-white self-start transition-all duration-300 hover:shadow-lg"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-2 flex space-x-2 mb-6 overflow-x-auto"
        >
          <Button
            variant={activeTab === "profile" ? "default" : "ghost"}
            className={`transition-all duration-300 ${activeTab === "profile" ? "bg-green-600 text-white" : "hover:bg-green-100"}`}
            onClick={() => setActiveTab("profile")}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center"
            >
              <User className="w-4 h-4 mr-2" /> Profile
            </motion.div>
          </Button>
          <Button
            variant={activeTab === "appointments" ? "default" : "ghost"}
            className={`transition-all duration-300 ${activeTab === "appointments" ? "bg-green-600 text-white" : "hover:bg-green-100"}`}
            onClick={() => setActiveTab("appointments")}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" /> Appointments
            </motion.div>
          </Button>
        </motion.div>

        {/* Notifications */}
        {(error || success) && (
          <motion.div 
            className="mb-6"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <motion.div
                  initial={{ rotate: -90 }}
                  animate={{ rotate: 0 }}
                  className="flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{success}</AlertDescription>
                </motion.div>
              </Alert>
            )}
          </motion.div>
        )}

        {activeTab === "profile" && (
          <>
            {isEditing ? (
              /* Edit Mode */
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
              >
                <Card className="shadow-lg border-none">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="text-green-800 flex items-center">
                      <Edit2 className="w-5 h-5 mr-2" /> Edit Your Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={itemVariants} className="space-y-2">
                          <Label htmlFor="name" className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-green-600" /> Full Name *
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                          />
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-2">
                          <Label htmlFor="contact" className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-green-600" /> Contact Number *
                          </Label>
                          <Input
                            id="contact"
                            value={formData.contact}
                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                            required
                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                          />
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-2">
                          <Label htmlFor="emergencyContact" className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-green-600" /> Emergency Contact
                          </Label>
                          <Input
                            id="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                          />
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-2">
                          <Label htmlFor="allergies" className="flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-green-600" /> Allergies
                          </Label>
                          <Input
                            id="allergies"
                            value={formData.allergies.join(", ")}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                allergies: e.target.value
                                  .split(", ")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="E.g. Penicillin, Peanuts"
                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                          />
                          <p className="text-xs text-gray-500">Separate with commas</p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-2">
                          <Label htmlFor="chronicConditions" className="flex items-center">
                            <Heart className="w-4 h-4 mr-2 text-green-600" /> Chronic Conditions
                          </Label>
                          <Input
                            id="chronicConditions"
                            value={formData.chronicConditions.join(", ")}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                chronicConditions: e.target.value
                                  .split(", ")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="E.g. Asthma, Diabetes"
                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                          />
                          <p className="text-xs text-gray-500">Separate with commas</p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-2">
                          <Label htmlFor="insuranceInfo" className="flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-green-600" /> Insurance Information
                          </Label>
                          <Input
                            id="insuranceInfo"
                            value={formData.insuranceInfo}
                            onChange={(e) => setFormData({ ...formData, insuranceInfo: e.target.value })}
                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                          />
                        </motion.div>
                      </div>

                      <motion.div 
                        variants={itemVariants}
                        className="flex gap-4 pt-4"
                      >
                        <Button
                          type="submit"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white transition-all duration-300 hover:shadow-lg"
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {loading ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          type="button"
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 transition-all duration-300"
                          onClick={handleCancelClick}
                        >
                          <X className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                      </motion.div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              /* View Mode */
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Personal Info Card */}
                <motion.div variants={itemVariants}>
                  <Card className="shadow-lg border-none h-full transition-all duration-300 hover:shadow-xl">
                    <CardHeader className="bg-green-50">
                      <CardTitle className="text-green-800 flex items-center">
                        <User className="w-5 h-5 mr-2" /> Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <motion.div 
                            className="space-y-1"
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <p className="text-sm font-medium text-gray-500">Full Name</p>
                            <p className="text-gray-800 font-medium">{patient.name}</p>
                          </motion.div>

                          <motion.div 
                            className="space-y-1"
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <p className="text-sm font-medium text-gray-500">Contact Number</p>
                            <p className="text-gray-800 font-medium">{patient.contact}</p>
                          </motion.div>

                          <motion.div 
                            className="space-y-1"
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                            <p className="text-gray-800 font-medium">{patient.dateOfBirth}</p>
                          </motion.div>

                          <motion.div 
                            className="space-y-1"
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <p className="text-sm font-medium text-gray-500">Blood Type</p>
                            <p className="text-gray-800 font-medium">{patient.bloodType}</p>
                          </motion.div>
                        </div>

                        <Separator className="bg-green-100" />

                        <motion.div 
                          className="space-y-1"
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <p className="text-sm font-medium text-gray-500">Emergency Contact</p>
                          <p className="text-gray-800 font-medium">{patient.emergencyContact}</p>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Medical Info Card */}
                <motion.div variants={itemVariants}>
                  <Card className="shadow-lg border-none h-full transition-all duration-300 hover:shadow-xl">
                    <CardHeader className="bg-green-50">
                      <CardTitle className="text-green-800 flex items-center">
                        <Activity className="w-5 h-5 mr-2" /> Medical Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-500">Allergies</p>
                          <div className="flex flex-wrap gap-2">
                            {patient.allergies?.length ? (
                              patient.allergies.map((item, i) => (
                                <motion.div
                                  key={i}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Badge className="bg-red-100 text-red-800">
                                    {item}
                                  </Badge>
                                </motion.div>
                              ))
                            ) : (
                              <p className="text-gray-500 text-sm italic">No allergies listed</p>
                            )}
                          </div>
                        </div>

                        <Separator className="bg-green-100" />

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-500">Chronic Conditions</p>
                          <div className="flex flex-wrap gap-2">
                            {patient.chronicConditions?.length ? (
                              patient.chronicConditions.map((item, i) => (
                                <motion.div
                                  key={i}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Badge className="bg-green-100 text-green-800">
                                    {item}
                                  </Badge>
                                </motion.div>
                              ))
                            ) : (
                              <p className="text-gray-500 text-sm italic">No chronic conditions listed</p>
                            )}
                          </div>
                        </div>

                        <Separator className="bg-green-100" />

                        <motion.div 
                          className="space-y-1"
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <p className="text-sm font-medium text-gray-500">Insurance Information</p>
                          <p className="text-gray-800">{patient.insuranceInfo}</p>
                        </motion.div>

                        <motion.div 
                          className="space-y-1"
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <p className="text-sm font-medium text-gray-500">Medical Record Number</p>
                          <p className="text-gray-800">{patient.medicalRecordNumber}</p>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </>
        )}

        {activeTab === "appointments" && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Card className="shadow-lg border-none transition-all duration-300 hover:shadow-xl">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" /> Appointments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <motion.div variants={itemVariants}>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-green-600" /> Upcoming Appointments
                    </h3>
                    {patient.upcomingAppointments?.length ? (
                      <div className="space-y-3">
                        {patient.upcomingAppointments.map((appt, idx) => (
                          <motion.div 
                            key={idx} 
                            className="bg-green-50 p-4 rounded-md border-l-4 border-green-400"
                            whileHover={{ 
                              x: 5,
                              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                            }}
                          >
                            <p className="text-green-800">{appt}</p>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No upcoming appointments</p>
                    )}
                  </motion.div>

                  <Separator className="bg-green-100" />

                  <motion.div variants={itemVariants}>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-green-600" /> Last Visit
                    </h3>
                    <motion.div
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <p className="text-gray-800">{patient.lastVisit}</p>
                    </motion.div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default PatientProfilePage