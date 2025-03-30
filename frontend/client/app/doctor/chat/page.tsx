"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MessageCircle } from "lucide-react"
import { useUser } from "@/app/_context/UserContext"
import axios from "axios"
import { toast } from "sonner"
import Link from "next/link"

interface Patient {
  _id: string;
  name: string;
  email: string;
  profileImage?: {
    url: string;
  };
  lastMessage?: {
    text: string;
    timestamp: Date;
  };
}

const API_URL = 'http://localhost:8000/api/v1/doctors';

export default function DoctorChatList() {
  const { user } = useUser();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get(`${API_URL}/${user?._id}/patients`);
        setPatients(response.data.data.patients);
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast.error('Failed to load patients');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?._id) {
      fetchPatients();
    }
  }, [user?._id]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-md border-green-100">
          <CardHeader className="border-b border-green-100">
            <CardTitle className="text-2xl text-green-800">Patient Chats</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-green-50 border-green-200 focus-visible:ring-green-500"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No patients found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <Link 
                    key={patient._id} 
                    href={`/doctor/chat/${patient._id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg hover:bg-green-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 border-2 border-green-100">
                          <AvatarImage 
                            src={patient.profileImage?.url || "/placeholder.svg?height=100&width=100"} 
                            alt={patient.name} 
                          />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {patient.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-green-800">{patient.name}</h3>
                          <p className="text-sm text-gray-600">{patient.email}</p>
                          {patient.lastMessage && (
                            <p className="text-sm text-gray-500 mt-1">
                              {patient.lastMessage.text}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700">
                        <MessageCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 