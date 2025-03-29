"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { contractaddress2 } from "@/contract/contractABI2";
import { contractABI2 } from "@/contract/contractABI2";
import { useUser } from "@/app/_context/UserContext";
import { toast } from 'sonner';
import axios from 'axios';
import { use } from 'react';

interface Doctor {
  _id: string;
  name: string;
  specialty: string[];
  experience: number;
  hospital_affiliation: string;
  consultation_fee: number;
  availability: {
    day: string;
    start_time: string;
    end_time: string;
    recurring: boolean;
  }[];
  profileImage: {
    url: string;
  };
}

export default function AppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useUser();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string>();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string>("");

  // Fetch doctor data
  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/v1/doctors/profile/${resolvedParams.id}`);
        console.log('Doctor data received:', response.data.data.user);
        setDoctor(response.data.data.user);
      } catch (error) {
        console.error('Error fetching doctor data:', error);
        toast.error('Failed to load doctor information');
      }
    };

    fetchDoctorData();
  }, [resolvedParams.id]);

  // Add console log for doctor state
  useEffect(() => {
    console.log('Current doctor state:', doctor);
  }, [doctor]);

  // Get available dates based on doctor's availability
  const getAvailableDates = () => {
    if (!doctor) return [];
    
    const dates = [];
    const today = new Date();
    
    // Get next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Check if doctor has availability for this day
      const hasAvailability = doctor.availability.some(a => a.day === dayOfWeek);
      
      if (hasAvailability) {
        dates.push(date);
      }
    }
    
    return dates;
  };

  // Get available time slots based on selected date
  const getAvailableTimeSlots = () => {
    if (!doctor || !date) return [];
    
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const doctorAvailability = doctor.availability.find(a => a.day === dayOfWeek);
    
    if (!doctorAvailability) return [];

    const slots = [];
    const startTime = new Date(`1970-01-01T${doctorAvailability.start_time}`);
    const endTime = new Date(`1970-01-01T${doctorAvailability.end_time}`);
    
    while (startTime < endTime) {
      slots.push(startTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }));
      startTime.setMinutes(startTime.getMinutes() + 30);
    }
    
    return slots;
  };

  // Token contract details
  const tokenAddress = contractaddress2; // Replace with your token contract address
  const tokenABI = contractABI2;
  // console.log(params.doctorId);
  const handlePayment = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask to make a payment");
      return;
    }
  
    setIsLoading(true);
    setPaymentStatus("loading");
    setError("");
  
    try {
      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Connect to the token contract
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);

      // Define the payment amount in tokens (e.g., 100 tokens)
      const amount = ethers.parseUnits("10", 18); // Adjust decimals if needed

      // Check user's token balance
      const balance = await tokenContract.balanceOf(userAddress);

      // Compare balance with amount using BigInt
      if (balance < amount) {
        throw new Error("Insufficient token balance");
      }

      // Send tokens to the recipient
      const tx = await tokenContract.transfer("0xB32acD0dBF357bf2Cb57316b6e4294aFb2c3e205", amount);
    const receipt = await tx.wait();
    
    // Verify transaction was successful
    if (receipt.status === 1) {
      // Only call bookAppointment after confirmed payment
      await bookAppointment();
      setPaymentStatus("success");
      console.log("Payment and booking successful:", tx.hash);
    } else {
      throw new Error("Transaction failed");
    }
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : "Payment failed");
    setPaymentStatus("error");
  } finally {
    setIsLoading(false);
  }
};

// Update bookAppointment to throw errors
const bookAppointment = async () => {
  if (!user?._id || !date || !time) {
    console.log(user?._id, date, time);
    console.error("ebaba");
  }

  if (!user) {
    throw new Error("User must be logged in to book an appointment");
  }

  const response = await fetch("http://localhost:8000/api/v1/patients/book/appointment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: user.id,
      docId: resolvedParams.id,
      slotDate: date ? date.toISOString().split("T")[0] : '',
      slotTime: time,
      amount: 100
    }),
  });

  // First read the response data
  const data = await response.json();

  // Then check response status
  if (!response.ok) {
    throw new Error(data.message || "Failed to book appointment");
  }

  // Show success toast with message
  toast.success(data.message);
};

  const availableTimes = ["09:00 AM", "10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "04:30 PM"];

  const relatedDoctors = [
    {
      name: "Dr. Sarah Miller",
      specialty: "General Physician",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      name: "Dr. James Wilson",
      specialty: "General Physician",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      name: "Dr. Emily Parker",
      specialty: "General Physician",
      image: "/placeholder.svg?height=100&width=100",
    },
  ];

  // Format the date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-green-50">
      <div className="container mx-auto py-8 px-4">
        {doctor ? (
          <Card className="mb-8">
            <CardContent className="p-6 mt-[6.9rem]">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/4">
                  <Image
                    src={doctor.profileImage?.url || "/placeholder.svg?height=200&width=200"}
                    alt={`${doctor.name}'s profile`}
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold">Dr. {doctor?.name || 'Loading...'}</h2>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {doctor?.specialty?.join(', ') || 'No specialties listed'} • {doctor?.experience || 0} years exp
                  </p>
                  <p className="text-gray-600 mb-4">
                    {doctor?.hospital_affiliation || 'No hospital affiliation listed'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Appointment Fee:</span>
                    <span className="text-green-700">{doctor?.consultation_fee || 0} DocTokens</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-8">Loading doctor information...</div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
              <CardDescription>Choose your preferred appointment slot</CardDescription>
            </CardHeader>
            <CardContent className="p-6 mt-3">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="font-medium">Select Date</label>
                  <div className="grid grid-cols-7 gap-2">
                    {getAvailableDates().map((dateObj, index) => (
                      <button
                        key={index}
                        onClick={() => setDate(dateObj)}
                        className={`p-2 rounded-lg text-center ${
                          date?.toDateString() === dateObj.toDateString()
                            ? "bg-green-600 text-white"
                            : "bg-green-100 hover:bg-green-200"
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {dateObj.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div className="text-lg font-bold">
                          {dateObj.toLocaleDateString("en-US", { day: "numeric" })}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-medium">Available Time Slots</label>
                  <Select onValueChange={setTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTimeSlots().map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!date || !time || !doctor}
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  Book Appointment
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Related Doctors</CardTitle>
              <CardDescription>Similar specialists you might be interested in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {relatedDoctors.map((doctor, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <Image src={doctor.image || "/placeholder.svg"} alt={doctor.name} width={48} height={48} />
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{doctor.name}</h3>
                      <p className="text-sm text-gray-600">{doctor.specialty}</p>
                    </div>
                    <Button variant="outline" className="ml-auto">
                      View Profile
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Appointment</DialogTitle>
              <DialogDescription>
                Please confirm your appointment with Dr. {doctor?.name}
                <div className="mt-4 space-y-2">
                  <p>Date: {date ? formatDate(date) : ""}</p>
                  <p>Time: {time}</p>
                  <p className="font-semibold">Amount: {doctor?.consultation_fee || 0} DocTokens</p>
                </div>
              </DialogDescription>
            </DialogHeader>

            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}

            {paymentStatus === "success" && (
              <div className="text-green-600 text-sm mt-2">
                Payment successful! Your appointment has been booked.
              </div>
            )}

            <DialogFooter className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isLoading || paymentStatus === "success"}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  "Confirm & Pay"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}