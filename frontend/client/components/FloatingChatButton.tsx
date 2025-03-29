"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, Loader2 } from "lucide-react"

interface Message {
  id: number
  text: string
  isBot: boolean
}

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const newMessage = {
      id: Date.now(),
      text: message,
      isBot: false,
    }
    setMessages((prev) => [...prev, newMessage])
    setMessage("")
    setIsTyping(true)

    try {
      const response = await fetch(`http://127.0.0.1:5000/chat/?query=${encodeURIComponent(message)}`)
      const data = await response.json()

      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: data.response,
            isBot: true,
          },
        ])
      }, 1000)
    } catch (error) {
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: "Sorry, I'm having trouble connecting to the assistant.",
            isBot: true,
          },
        ])
      }, 1000)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-green-300 to-green-400 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
          >
            <MessageSquare className="w-8 h-8" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden w-96 max-h-[80vh] flex flex-col"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
          >
            <motion.div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-green-300 to-green-400 text-white">
              <h2 className="text-lg font-semibold">Medical Assistant</h2>
              <motion.button onClick={() => setIsOpen(false)} className="text-white p-1">
                <X className="w-6 h-6" />
              </motion.button>
            </motion.div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <p className="text-center text-gray-500 py-8">Ask me any health-related questions!</p>
              )}
              {messages.map((msg) => (
                <motion.div key={msg.id} className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 ${msg.isBot ? "bg-white text-gray-800 border border-gray-200" : "bg-green-300 text-white"}`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div className="flex justify-start">
                  <div className="bg-white text-gray-800 rounded-2xl p-3 border border-gray-200">
                    <Loader2 className="w-4 h-4 animate-spin text-green-400" />
                    <p className="text-sm text-gray-500">Typing...</p>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <motion.form onSubmit={handleSubmit} className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your health question..."
                  className="flex-1 rounded-full border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-300 to-green-400 text-white p-3 rounded-full hover:shadow-md disabled:opacity-70"
                  disabled={!message.trim() || isTyping}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
