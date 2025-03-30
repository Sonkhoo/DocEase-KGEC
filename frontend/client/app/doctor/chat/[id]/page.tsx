"use client"

import { useState, useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Video, Send, CheckCircle, Phone, Calendar, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { use } from "react"
import { useUser } from "@/app/_context/UserContext"
import axios from "axios"
import { toast } from "sonner"

// Socket.io server URL
const SOCKET_URL = 'http://localhost:8000'

// Message interface
interface Message {
  id: string
  text: string
  senderId: string
  timestamp: Date
}

interface Patient {
  _id: string;
  name: string;
  email: string;
  profileImage?: {
    url: string;
  };
}

const API_URL = 'http://localhost:8000/api/v1/doctors';

export default function DoctorChatInterface({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useUser();
  const [patient, setPatient] = useState<Patient | null>(null);
  
  // User and patient IDs from context and params
  const doctorId = user?._id;
  const patientId = resolvedParams.id;
  
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch patient data
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await axios.get(`${API_URL}/patient/${patientId}/profile`);
        setPatient(response.data.data.user);
      } catch (error) {
        console.error('Error fetching patient data:', error);
        toast.error('Failed to load patient information');
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  // Initialize socket connection
  useEffect(() => {
    if (!doctorId || !patientId) return;

    socketRef.current = io(SOCKET_URL, {
      query: { 
        userId: doctorId, 
        patientId,
        userType: 'doctor'
      }
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to socket server');
    });

    socketRef.current.on('private_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      setIsTyping(false);
    });

    socketRef.current.on('typing_status', (data: { userId: string, isTyping: boolean }) => {
      if (data.userId === patientId) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [doctorId, patientId]);

  // Handle typing indicator
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    
    if (message.trim()) {
      socketRef.current?.emit('typing', {
        recipientId: patientId,
        isTyping: true
      });

      typingTimeout = setTimeout(() => {
        socketRef.current?.emit('typing', {
          recipientId: patientId,
          isTyping: false
        });
      }, 1000);
    }

    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [message, patientId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (message.trim() && socketRef.current) {
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: message,
        senderId: doctorId!,
        timestamp: new Date()
      };

      // Add message to local state
      setMessages(prev => [...prev, newMessage]);
      
      // Send message via socket
      socketRef.current.emit('private_message', {
        recipientId: patientId,
        message: newMessage,
        senderType: 'doctor'
      });
      
      setMessage("");
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6"
      >
        {/* Connection Status */}
        {!isConnected && (
          <div className="lg:col-span-3 bg-red-100 text-red-700 p-2 rounded-lg text-center">
            Disconnected from chat server. Please check your connection.
          </div>
        )}

        {/* Chat Section */}
        <Card className="lg:col-span-2 bg-white shadow-md border-green-100">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl md:text-2xl">
                  Chat with {patient ? patient.name : 'Loading...'}
                </CardTitle>
                <CardDescription className="text-green-50">
                  Patient • {isConnected ? "Online" : "Offline"}
                </CardDescription>
              </div>
              <Avatar className="h-12 w-12 border-2 border-white">
                <AvatarImage 
                  src={patient?.profileImage?.url || "/placeholder.svg?height=100&width=100"} 
                  alt={patient?.name || "Patient"} 
                />
                <AvatarFallback className="bg-emerald-700 text-white">
                  {patient?.name ? patient.name.split(' ').map(n => n[0]).join('') : 'PT'}
                </AvatarFallback>
              </Avatar>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="h-[350px] md:h-[450px] overflow-y-auto space-y-4 p-2">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.senderId === doctorId ? "justify-end" : "justify-start"}`}
                  >
                    {msg.senderId === patientId && (
                      <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                          {patient?.name ? patient.name.split(' ').map(n => n[0]).join('') : 'PT'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] p-3 rounded-lg shadow-sm",
                        msg.senderId === doctorId
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-tr-none"
                          : "bg-green-50 text-green-800 border border-green-100 rounded-tl-none",
                      )}
                    >
                      <p>{msg.text}</p>
                      <span className="text-xs opacity-75">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                        {patient?.name ? patient.name.split(' ').map(n => n[0]).join('') : 'PT'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-green-50 text-green-800 p-3 rounded-lg border border-green-100 rounded-tl-none shadow-sm">
                      <div className="flex space-x-1">
                        <div
                          className="h-2 w-2 bg-green-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 bg-green-500 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 bg-green-500 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t border-green-100 bg-green-50/50">
            <form onSubmit={handleSendMessage} className="flex w-full gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-white border-green-200 focus-visible:ring-green-500"
                disabled={!isConnected}
              />
              <Button 
                type="submit"
                disabled={!isConnected} 
                className="bg-green-600 hover:bg-green-700 transition-colors"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>

        {/* Sidebar with Patient Info */}
        <div className="space-y-4">
          {/* Patient Profile Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-white shadow-md border-green-100">
              <CardHeader className="p-4 border-b border-green-100">
                <CardTitle className="text-lg text-green-800">Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {patient ? (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-green-100">
                        <AvatarImage 
                          src={patient.profileImage?.url || "/placeholder.svg?height=100&width=100"} 
                          alt={patient.name} 
                        />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-green-800 text-lg">{patient.name}</h3>
                        <p className="text-sm text-green-600">{patient.email}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="bg-green-50 p-2 rounded-md">
                        <p className="text-green-600 font-medium">Email</p>
                        <p className="text-green-800">{patient.email}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded-md">
                        <p className="text-green-600 font-medium">Status</p>
                        <p className="text-green-800">Active Patient</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-600" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
} 