"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDoctorAuth } from "@/app/_context/Doctorcontext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldAlert, Plus, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface Availability {
  day: string;
  start_time: string;
  end_time: string;
  recurring: boolean;
  date: string | null;
}

interface DoctorKYCData {
  name: string;
  contact_info: {
    email: string;
    phone: string;
  };
  specialty: string[];
  qualifications: string[];
  experience: number;
  availability: Availability[];
  hospital_affiliation: string;
  consultation_fee: number;
  registrationNumber: string;
  bio: string;
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  languages: string[];
  awards: string[];
  publications: string[];
}

const DoctorKYCForm = () => {
  const router = useRouter();
  const { doctor, access_token, user_id, isLoading: authLoading, isAuthenticated } = useDoctorAuth();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<DoctorKYCData>({
    name: "",
    contact_info: {
      email: "",
      phone: ""
    },
    specialty: [],
    qualifications: [],
    experience: 0,
    availability: [],
    hospital_affiliation: "",
    consultation_fee: 0,
    registrationNumber: "",
    bio: "",
    education: [],
    languages: [],
    awards: [],
    publications: []
  });

  useEffect(() => {
    // Check authentication status when component mounts
    if (!authLoading && !isAuthenticated) {
      toast.error("Please log in to access the KYC form");
      router.push("/doctor/login");
      return;
    }

    if (!authLoading && isAuthenticated && doctor) {
      // User is authenticated and doctor data is available
      setFormData({
        name: doctor.name || "",
        contact_info: {
          email: doctor.contact_info?.email || "",
          phone: doctor.contact_info?.phone || ""
        },
        specialty: doctor.specialty || [],
        qualifications: doctor.qualifications || [],
        experience: doctor.experience || 0,
        availability: doctor.availability || [],
        hospital_affiliation: doctor.hospital_affiliation || "",
        consultation_fee: doctor.consultation_fee || 0,
        registrationNumber: doctor.registrationNumber || "",
        bio: doctor.bio || "",
        education: doctor.education || [],
        languages: doctor.languages || [],
        awards: doctor.awards || [],
        publications: doctor.publications || []
      });
      setLoading(false);
    } else if (!authLoading && isAuthenticated && user_id && access_token) {
      // User is authenticated but doctor data needs to be fetched
      const fetchDoctorData = async () => {
        try {
          const response = await axios.get(`http://localhost:8000/api/v1/doctors/profile/${user_id}`, {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          
          if (response.data && response.data.data && response.data.data.user) {
            setFormData(response.data.data.user);
          } else {
            toast.warning("Could not load doctor profile data completely");
          }
        } catch (error) {
          console.error("Error fetching doctor data:", error);
          toast.error("Failed to fetch doctor data");
        } finally {
          setLoading(false);
        }
      };
      
      fetchDoctorData();
    }
  }, [doctor, user_id, access_token, router, authLoading, isAuthenticated]);

  // If still in authentication loading state, show loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2 text-green-800">Verifying your credentials...</span>
      </div>
    );
  }

  // If not authenticated after loading completes, show unauthorized message
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">You need to be logged in as a doctor to access the KYC form.</p>
          <Button 
            onClick={() => router.push("/doctor/login")}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!access_token || !user_id) {
      toast.error("Authentication required");
      router.push("/doctor/login");
      return;
    }

    // Basic validation
    if (!formData.name || !formData.contact_info.phone || !formData.registrationNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate and prepare availability slots for submission
    try {
      // Deep clone to avoid mutating the state directly
      const processedAvailability = formData.availability.map(slot => {
        // Validate required fields
        if (!slot.start_time || !slot.end_time) {
          throw new Error("All slots must have start and end times");
        }

        // Process based on slot type
        if (slot.recurring) {
          if (!slot.day) {
            throw new Error("Recurring slots must have a day of week selected");
          }
          return {
            ...slot,
            recurring: true,
            date: null, // Ensure date is null for recurring slots
            day: slot.day // Keep the day value
          };
        } else {
          if (!slot.date) {
            throw new Error("One-time slots must have a date selected");
          }
          
          // Ensure the date is a proper ISO string
          try {
            // Check if it's already a valid date string
            const dateValue = new Date(slot.date);
            
            // Check if valid date
            if (isNaN(dateValue.getTime())) {
              throw new Error("Invalid date format for one-time slot");
            }
            
            // Use the original ISO string if it's valid
            return {
              ...slot,
              recurring: false,
              day: "", // Ensure day is empty for one-time slots
              date: slot.date // Send the ISO string date
            };
          } catch (error) {
            console.error("Date processing error:", error);
            throw new Error("Invalid date for one-time slot. Please select a valid date.");
          }
        }
      });

      setLoading(true);
      console.log("Submitting KYC data with processed availability");

      // First, update the doctor profile data
      const response = await axios.put(
        `http://localhost:8000/api/v1/doctors/update/${user_id}`,
        {
          name: formData.name,
          contact_info: formData.contact_info,
          specialty: formData.specialty,
          qualifications: formData.qualifications,
          experience: formData.experience,
          hospital_affiliation: formData.hospital_affiliation,
          consultation_fee: formData.consultation_fee,
          registrationNumber: formData.registrationNumber,
          bio: formData.bio,
          education: formData.education,
          languages: formData.languages,
          awards: formData.awards,
          publications: formData.publications
        },
        { 
          headers: { 
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      // Then, update the availability separately 
      const availabilityResponse = await axios.patch(
        `http://localhost:8000/api/v1/doctors/availability/${user_id}`,
        {
          availability: processedAvailability
        },
        { 
          headers: { 
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data && availabilityResponse.data) {
        // Update localStorage with new doctor data
        if (doctor && typeof window !== 'undefined') {
          const updatedDoctor = {
            ...doctor,
            ...response.data.data,
            availability: processedAvailability
          };
          localStorage.setItem('doctor', JSON.stringify(updatedDoctor));
        }

        toast.success("KYC Information Updated Successfully!");
        setTimeout(() => {
          router.push("/dashboard/doctor");
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating KYC:", error);
      
      // Handle validation errors from our own checks
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      }
      // Handle API errors
      else if (axios.isAxiosError(error) && error.response) {
        toast.error(`Failed to update KYC: ${error.response.data?.message || error.message}`);
      } else {
        toast.error("Failed to update KYC information");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtyChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      specialty: [...prev.specialty, value]
    }));
  };

  const handleQualificationChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, value]
    }));
  };

  const handleLanguageChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, value]
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", year: "" }]
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addAvailabilitySlot = () => {
    setFormData(prev => ({
      ...prev,
      availability: [
        ...prev.availability, 
        { 
          day: "Monday", // Default to Monday for recurring slots
          start_time: "09:00", 
          end_time: "17:00", 
          recurring: true, 
          date: null 
        }
      ]
    }));
  };

  const updateAvailabilitySlot = (index: number, field: keyof Availability, value: any) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const removeAvailabilitySlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <Card className="w-full max-w-3xl mx-auto bg-white shadow-lg">
        <CardHeader className="bg-green-50 rounded-t-lg">
          <CardTitle className="text-green-800">Complete Your Doctor KYC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-2" />
              <p className="text-green-800">Loading your profile information...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-800">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Medical Registration Number *</Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-800">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.contact_info.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact_info: { ...formData.contact_info, email: e.target.value }
                      })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.contact_info.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact_info: { ...formData.contact_info, phone: e.target.value }
                      })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-800">Professional Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about your professional experience and expertise..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialties</Label>
                  <Select onValueChange={handleSpecialtyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardiology">Cardiology</SelectItem>
                      <SelectItem value="dermatology">Dermatology</SelectItem>
                      <SelectItem value="neurology">Neurology</SelectItem>
                      <SelectItem value="pediatrics">Pediatrics</SelectItem>
                      <SelectItem value="orthopedics">Orthopedics</SelectItem>
                      <SelectItem value="psychiatry">Psychiatry</SelectItem>
                      <SelectItem value="oncology">Oncology</SelectItem>
                      <SelectItem value="gynecology">Gynecology</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.specialty.map((spec, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                        {spec}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            specialty: prev.specialty.filter((_, i) => i !== index)
                          }))}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualifications">Qualifications</Label>
                  <Select onValueChange={handleQualificationChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select qualification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mbbs">MBBS</SelectItem>
                      <SelectItem value="md">MD</SelectItem>
                      <SelectItem value="ms">MS</SelectItem>
                      <SelectItem value="dm">DM</SelectItem>
                      <SelectItem value="mch">MCh</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.qualifications.map((qual, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                        {qual}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            qualifications: prev.qualifications.filter((_, i) => i !== index)
                          }))}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="languages">Languages</Label>
                  <Select onValueChange={handleLanguageChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">Hindi</SelectItem>
                      <SelectItem value="bengali">Bengali</SelectItem>
                      <SelectItem value="tamil">Tamil</SelectItem>
                      <SelectItem value="telugu">Telugu</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.languages.map((lang, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                        {lang}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            languages: prev.languages.filter((_, i) => i !== index)
                          }))}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Education Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-800">Education</h3>
                {formData.education.map((edu, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Degree</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, "degree", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, "institution", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        type="number"
                        value={edu.year}
                        onChange={(e) => updateEducation(index, "year", e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={addEducation}
                  variant="outline"
                  className="w-full"
                >
                  Add Education
                </Button>
              </div>

              {/* Practice Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-800">Practice Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hospital_affiliation">Hospital Affiliation</Label>
                    <Input
                      id="hospital_affiliation"
                      value={formData.hospital_affiliation}
                      onChange={(e) => setFormData({ ...formData, hospital_affiliation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultation_fee">Consultation Fee (₹)</Label>
                    <Input
                      id="consultation_fee"
                      type="number"
                      value={formData.consultation_fee}
                      onChange={(e) => setFormData({ ...formData, consultation_fee: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Availability Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-800">Availability</h3>
                
                {formData.availability.length === 0 ? (
                  <div className="p-4 border border-dashed rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">No availability slots added yet</p>
                  </div>
                ) : (
                  formData.availability.map((slot, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Slot #{index + 1}</h4>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeAvailabilitySlot(index)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select 
                            value={slot.recurring ? "recurring" : "oneTime"} 
                            onValueChange={(value) => {
                              const isRecurring = value === "recurring";
                              // Update all relevant fields in one go to maintain consistency
                              if (isRecurring) {
                                // Switching to recurring: set day to Monday if not set, clear date
                                setFormData(prev => ({
                                  ...prev,
                                  availability: prev.availability.map((s, i) => 
                                    i === index ? { 
                                      ...s, 
                                      recurring: true,
                                      day: s.day || "Monday", 
                                      date: null 
                                    } : s
                                  )
                                }));
                              } else {
                                // Switching to one-time: clear day, initialize date if not set
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                tomorrow.setHours(12, 0, 0, 0);
                                
                                setFormData(prev => ({
                                  ...prev,
                                  availability: prev.availability.map((s, i) => 
                                    i === index ? { 
                                      ...s, 
                                      recurring: false,
                                      day: "", 
                                      date: s.date || tomorrow.toISOString()
                                    } : s
                                  )
                                }));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="recurring">Weekly Recurring</SelectItem>
                              <SelectItem value="oneTime">One-time Slot</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {slot.recurring ? (
                          <div className="space-y-2">
                            <Label>Day of Week</Label>
                            <Select 
                              value={slot.day} 
                              onValueChange={(value) => updateAvailabilitySlot(index, "day", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Monday">Monday</SelectItem>
                                <SelectItem value="Tuesday">Tuesday</SelectItem>
                                <SelectItem value="Wednesday">Wednesday</SelectItem>
                                <SelectItem value="Thursday">Thursday</SelectItem>
                                <SelectItem value="Friday">Friday</SelectItem>
                                <SelectItem value="Saturday">Saturday</SelectItem>
                                <SelectItem value="Sunday">Sunday</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={slot.date ? new Date(slot.date).toISOString().split('T')[0] : ''}
                              onChange={(e) => {
                                // Only set a date value if the input has a value
                                let date = null;
                                if (e.target.value) {
                                  try {
                                    // Create a date at noon to avoid timezone issues
                                    const selectedDate = new Date(e.target.value + 'T12:00:00');
                                    // Make sure it's a valid date
                                    if (!isNaN(selectedDate.getTime())) {
                                      date = selectedDate.toISOString();
                                      console.log("Date set:", date);
                                    } else {
                                      console.error("Invalid date selected");
                                    }
                                  } catch (error) {
                                    console.error("Error creating date:", error);
                                  }
                                }
                                updateAvailabilitySlot(index, "date", date);
                              }}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <Input
                              type="time"
                              value={slot.start_time}
                              onChange={(e) => updateAvailabilitySlot(index, "start_time", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>End Time</Label>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <Input
                              type="time"
                              value={slot.end_time}
                              onChange={(e) => updateAvailabilitySlot(index, "end_time", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                <Button
                  type="button"
                  onClick={addAvailabilitySlot}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Availability Slot
                </Button>
              </div>

              {/* Achievements Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-800">Achievements</h3>
                <div className="space-y-2">
                  <Label>Awards & Recognition</Label>
                  <Textarea
                    value={formData.awards.join('\n')}
                    onChange={(e) => setFormData({ ...formData, awards: e.target.value.split('\n').filter(award => award.trim()) })}
                    placeholder="Enter each award on a new line..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Publications</Label>
                  <Textarea
                    value={formData.publications.join('\n')}
                    onChange={(e) => setFormData({ ...formData, publications: e.target.value.split('\n').filter(pub => pub.trim()) })}
                    placeholder="Enter each publication on a new line..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 text-white" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit KYC Information"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorKYCForm;