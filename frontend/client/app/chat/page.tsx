"use client"

import { useState, useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Video, Send, CheckCircle, Phone, Calendar, FileText } from "lucide-react"
import { PrescriptionCard } from "@/components/PrescriptionCard"
import MyPrescriptions from "@/components/PrescriptionViewerMine"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Socket.io server URL
const SOCKET_URL = 'http://localhost:8001'

// Message interface
interface Message {
  id: string
  text: string
  senderId: string
  timestamp: Date
}

export default function DoctorChatInterface() {
  // User and doctor IDs (these would typically come from authentication)
  const userId = "user123"
  const doctorId = "doctor456"
  
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isMinting, setIsMinting] = useState(false)
  const [isMinted, setIsMinted] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      query: { userId }
    })

    socketRef.current.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to socket server')
    })

    socketRef.current.on('private_message', (message: Message) => {
      setMessages(prev => [...prev, message])
      setIsTyping(false)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [userId])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (message.trim() && socketRef.current) {
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: message,
        senderId: userId,
        timestamp: new Date()
      }

      // Add message to local state
      setMessages(prev => [...prev, newMessage])
      
      // Send message via socket
      socketRef.current.emit('private_message', {
        recipientId: doctorId,
        message: newMessage
      })
      
      setMessage("")

      // Show typing indicator for doctor's response
      setIsTyping(true)
    }
  }

  const handleMintNFT = async () => {
    setIsMinting(true)
    // Simulate NFT minting process
    setTimeout(() => {
      setIsMinting(false)
      setIsMinted(true)

      // Add confirmation message to chat
      const confirmationMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: "Your prescription has been successfully minted as an NFT and securely stored on the blockchain.",
        senderId: doctorId,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, confirmationMessage])

      // Reset minted state after 5 seconds
      setTimeout(() => setIsMinted(false), 5000)
    }, 2000)
  }

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
                <CardTitle className="text-xl md:text-2xl">Chat with Dr. Richard James</CardTitle>
                <CardDescription className="text-green-50">
                  General Physician • {isConnected ? "Online" : "Offline"}
                </CardDescription>
              </div>
              <Avatar className="h-12 w-12 border-2 border-white">
                <AvatarImage src="/placeholder.svg?height=100&width=100" alt="Dr. Richard James" />
                <AvatarFallback className="bg-emerald-700 text-white">RJ</AvatarFallback>
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
                    className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}
                  >
                    {msg.senderId === doctorId && (
                      <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">DR</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] p-3 rounded-lg shadow-sm",
                        msg.senderId === userId
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
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">DR</AvatarFallback>
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

        {/* Sidebar with Video Call and Mint NFT */}
        <div className="space-y-4">
          {/* Video Call Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-white shadow-md border-green-100 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
                <CardTitle className="text-lg flex items-center">
                  <Video className="mr-2 h-5 w-5" />
                  Video Consultation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-green-700 mb-4 text-sm">
                  Connect face-to-face with Dr. Richard James for a more detailed consultation.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="border-green-200 hover:bg-green-50 text-green-700">
                    <a href="/schedule">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule
                    </a>
                  </Button>
                  <Button asChild className="bg-green-600 hover:bg-green-700 transition-colors">
                    <a href="/create-room">
                      <Phone className="mr-2 h-4 w-4" />
                      Join Now
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Prescription NFT Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-white shadow-md border-green-100 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Digital Prescription
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <MyPrescriptions/>
               
              </CardContent>
            </Card>
          </motion.div>

          {/* Doctor Profile Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-white shadow-md border-green-100">
              <CardHeader className="p-4 border-b border-green-100">
                <CardTitle className="text-lg text-green-800">Doctor Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-green-100">
                    <AvatarImage src="/placeholder.svg?height=100&width=100" alt="Dr. Richard James" />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">RJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-green-800 text-lg">Dr. Richard James</h3>
                    <p className="text-sm text-green-600">General Physician</p>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                        </svg>
                      ))}
                      <span className="text-xs text-green-600 ml-1">(120 reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-green-50 p-2 rounded-md">
                    <p className="text-green-600 font-medium">Experience</p>
                    <p className="text-green-800">15+ years</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded-md">
                    <p className="text-green-600 font-medium">Languages</p>
                    <p className="text-green-800">English, Spanish</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}