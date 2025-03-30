"use client"

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Client, Conversation as XMTPConversation } from '@xmtp/xmtp-js';
import { 
  FiSend, FiMessageCircle, FiRefreshCw, FiX, FiCopy, FiUsers, 
  FiSettings, FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhone,
  FiFileText, FiCalendar, FiClock, FiCheckCircle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useUser } from '../_context/UserContext';
import { useAccount, useConnect, useDisconnect, useSignMessage, useWalletClient } from 'wagmi';

// Types
interface Message {
  id: string;
  content: string;
  senderAddress: string;
  sent: Date;
}

interface Conversation {
  peerAddress: string;
  messages: () => Promise<Message[]>;
  send: (message: string) => Promise<void>;
  streamMessages: () => AsyncIterable<Message>;
}

interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  issueDate: Date;
  expiryDate: Date;
  physicianAddress: string;
  patientAddress: string;
  instructions: string;
  status: 'active' | 'pending' | 'completed' | 'expired';
}

// User interface from context
interface User {
  name?: string;
  // Add other user properties as needed
}

const XMTPBentoGrid: React.FC = () => {
  const { user } = useUser() as { user: User | null };
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { signMessageAsync } = useSignMessage();
  
  // XMTP client state
  const [client, setClient] = useState<Client | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [recipientInput, setRecipientInput] = useState<string>('');
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState<boolean>(false);
  const [isClientInitializing, setIsClientInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  // Video call state
  const [isInCall, setIsInCall] = useState<boolean>(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [callRecipient, setCallRecipient] = useState<string>('');
  
  // Prescription state
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    {
      id: "rx-1",
      medicationName: "Amoxicillin",
      dosage: "500mg",
      frequency: "3 times daily",
      issueDate: new Date(2025, 2, 25),
      expiryDate: new Date(2025, 5, 25),
      physicianAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      patientAddress: "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
      instructions: "Take with food. Complete full course of antibiotics.",
      status: 'active'
    },
    {
      id: "rx-2",
      medicationName: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      issueDate: new Date(2025, 1, 15),
      expiryDate: new Date(2025, 7, 15),
      physicianAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      patientAddress: "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
      instructions: "Take in the morning with water.",
      status: 'active'
    },
    {
      id: "rx-3",
      medicationName: "Advil",
      dosage: "200mg",
      frequency: "As needed for pain",
      issueDate: new Date(2025, 0, 5),
      expiryDate: new Date(2025, 3, 5),
      physicianAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      patientAddress: "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
      instructions: "Do not exceed 6 tablets in 24 hours.",
      status: 'expired'
    }
  ]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState<boolean>(false);

  // Initialize XMTP client using wagmi wallet
  const initializeClient = async (): Promise<Client | null> => {
    try {
      setError(null);
      setIsClientInitializing(true);
      
      // Create a signer adapter for XMTP
      const signer = {
        getAddress: async () => {
          if (!address) throw new Error('No wallet address found');
          return address;
        },
        signMessage: async (message: string) => {
          return signMessageAsync({ message });
        }
      };
      // Create XMTP client
      const xmtp = await Client.create(signer, { 
        env: 'production' 
      });
      
      setClient(xmtp);
      
      const convos = await xmtp.conversations.list();
      setConversations(convos as unknown as Conversation[]);
      
      return xmtp;
    } catch (err) {
      console.error('Error initializing XMTP client:', err);
      setError('Failed to initialize XMTP client. Please try again.');
      return null;
    } finally {
      setIsClientInitializing(false);
    }
  };

  // Initialize client when wallet is connected
  useEffect(() => {
    if (isConnected && address && !client) {
      initializeClient();
    }
  }, [isConnected, address]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for new messages in the selected conversation
  useEffect(() => {
    if (!selectedConversation) return;
    
    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const messageList = await selectedConversation.messages();
        setMessages(messageList);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    fetchMessages();
    
    // Stream new messages
    const streamMessages = async () => {
      const stream = await selectedConversation.streamMessages();
      for await (const message of stream) {
        setMessages(prevMessages => [...prevMessages, message]);
      }
    };
    
    streamMessages();
  }, [selectedConversation]);

  // Start a new conversation
  const startNewConversation = async (): Promise<void> => {
    if (!recipientInput.trim() || !client) return;
    
    try {
      setError(null);
      
      // Basic Ethereum address validation
      if (!/^0x[a-fA-F0-9]{40}$/.test(recipientInput)) {
        setError('Invalid Ethereum address');
        return;
      }
      
      const canMessage = await client.canMessage(recipientInput);
      if (!canMessage) {
        setError('This address has not enabled XMTP messaging');
        return;
      }
      
      const conversation = await client.conversations.newConversation(recipientInput) as unknown as Conversation;
      
      setConversations(prev => {
        if (!prev.find(c => c.peerAddress === conversation.peerAddress)) {
          return [...prev, conversation];
        }
        return prev;
      });
      
      setSelectedConversation(conversation);
      setIsNewConversationModalOpen(false);
      setRecipientInput('');
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError('Failed to start conversation');
    }
  };

  // Send a message
  const sendMessage = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!messageInput.trim() || !selectedConversation) return;
    
    try {
      setError(null);
      await selectedConversation.send(messageInput);
      setMessageInput('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  // Start a video call
  const startVideoCall = (recipient: string): void => {
    setCallRecipient(recipient);
    setIsInCall(true);
  };

  // End a video call
  const endVideoCall = (): void => {
    setIsInCall(false);
    setCallRecipient('');
  };

  // Toggle video
  const toggleVideo = (): void => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  // Toggle audio
  const toggleAudio = (): void => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  // View prescription details
  const viewPrescriptionDetails = (prescription: Prescription): void => {
    setSelectedPrescription(prescription);
    setIsPrescriptionModalOpen(true);
  };

  // Format time
  const formatTime = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Shorten address for display
  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddressToClipboard = (): void => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  // Client initialization screen
  if (isConnected && !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <p className="text-green-600 font-medium">Wallet Connected</p>
            </div>
            
            <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between mb-6">
              <span className="text-gray-700 font-mono">{address ? shortenAddress(address) : ''}</span>
              <button 
                onClick={copyAddressToClipboard} 
                className="text-gray-500 hover:text-green-500"
              >
                <FiCopy size={18} />
              </button>
            </div>
            
            <h2 className="text-2xl font-semibold mb-4">Initialize XMTP Client</h2>
            <p className="text-gray-600 mb-6">
              Initialize the XMTP client to start secure, decentralized messaging.
            </p>
            
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            <button 
              onClick={initializeClient}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors w-full flex items-center justify-center"
              disabled={isClientInitializing}
            >
              {isClientInitializing ? (
                <>
                  <FiRefreshCw className="animate-spin mr-2" /> 
                  Initializing...
                </>
              ) : (
                'Initialize XMTP Client'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Bento Grid Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-800">Health Connect</h1>
          {address && (
            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{shortenAddress(address)}</span>
              <button 
                onClick={copyAddressToClipboard} 
                className="text-green-600 hover:text-green-800 ml-1"
              >
                <FiCopy size={16} />
              </button>
            </div>
          )}
        </div>
        
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List - Tall card */}
          <div className="md:row-span-2 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b bg-green-100 flex justify-between items-center">
              <h2 className="font-bold text-lg text-green-800">
                <FiMessageCircle className="inline mr-2" />
                Conversations
              </h2>
              <button 
                onClick={() => setIsNewConversationModalOpen(true)}
                className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
                title="Start new conversation"
              >
                <FiMessageCircle size={18} />
              </button>
            </div>
            
            <div className="divide-y max-h-[70vh] overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FiMessageCircle className="mx-auto mb-2 text-gray-400" size={40} />
                  <p>No conversations yet</p>
                  <button
                    onClick={() => setIsNewConversationModalOpen(true)}
                    className="mt-4 text-green-500 hover:underline"
                  >
                    Start a new conversation
                  </button>
                </div>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.peerAddress}
                    onClick={() => setSelectedConversation(convo)}
                    className={`w-full text-left p-4 hover:bg-green-50 transition-colors ${
                      selectedConversation?.peerAddress === convo.peerAddress
                        ? 'bg-green-50 border-l-4 border-green-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">
                        {convo.peerAddress.slice(2, 4).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium truncate">
                          {shortenAddress(convo.peerAddress)}
                        </h3>
                        <div className="flex gap-2 mt-1">
                          <button 
                            className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full hover:bg-green-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              startVideoCall(convo.peerAddress);
                            }}
                          >
                            <FiVideo className="inline mr-1" size={12} />
                            Call
                          </button>
                          <span className="text-xs text-gray-500">
                            Message
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          
          {/* Messages Area - Wide card */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-[50vh]">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b bg-green-100 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold mr-2">
                      {selectedConversation.peerAddress.slice(2, 4).toUpperCase()}
                    </div>
                    <h2 className="font-bold text-green-800">
                      {shortenAddress(selectedConversation.peerAddress)}
                    </h2>
                  </div>
                  <button
                    onClick={() => startVideoCall(selectedConversation.peerAddress)}
                    className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
                    title="Start video call"
                  >
                    <FiVideo size={18} />
                  </button>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto bg-green-50">
                  {isLoadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderAddress === address ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.senderAddress === address
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-gray-800 border border-green-100'
                            }`}
                          >
                            <p className="mb-1">{message.content}</p>
                            <p className={`text-xs ${message.senderAddress === address ? 'text-green-100' : 'text-gray-500'}`}>
                              {formatTime(message.sent)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                <form onSubmit={sendMessage} className="p-4 border-t bg-white">
                  {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 border border-green-200 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="bg-green-500 text-white rounded-r-lg p-3 hover:bg-green-600 focus:outline-none"
                      disabled={!messageInput.trim()}
                    >
                      <FiSend size={20} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                <FiMessageCircle className="mb-4 text-green-400" size={60} />
                <h3 className="text-xl font-medium mb-2 text-green-800">Select a Conversation</h3>
                <p className="mb-4">Choose an existing conversation or start a new one</p>
                <button
                  onClick={() => setIsNewConversationModalOpen(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Start New Conversation
                </button>
              </div>
            )}
          </div>
          
          {/* Digital Prescriptions - Squared card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b bg-green-100">
              <h2 className="font-bold text-lg text-green-800">
                <FiFileText className="inline mr-2" />
                Digital Prescriptions
              </h2>
            </div>
            
            <div className="max-h-[30vh] overflow-y-auto divide-y">
              {prescriptions.map((prescription) => (
                <div 
                  key={prescription.id}
                  className="p-4 hover:bg-green-50 cursor-pointer"
                  onClick={() => viewPrescriptionDetails(prescription)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{prescription.medicationName}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      prescription.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : prescription.status === 'expired'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{prescription.dosage} - {prescription.frequency}</p>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span><FiCalendar className="inline mr-1" /> Expires: {formatDate(prescription.expiryDate)}</span>
                  </div>
                </div>
              ))}
              
              {prescriptions.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <FiFileText className="mx-auto mb-2 text-gray-400" size={40} />
                  <p>No active prescriptions</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Video Call - Squared card */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b bg-green-100">
              <h2 className="font-bold text-lg text-green-800">
                <FiVideo className="inline mr-2" />
                Video Consultation
              </h2>
            </div>
            
            {isInCall ? (
              <div className="p-4 bg-gray-900 h-[30vh] relative">
                {/* Video call interface */}
                <div className="bg-green-700 h-full rounded-lg flex items-center justify-center text-white text-lg font-medium">
                  {isVideoEnabled ? (
                    <div className="w-full h-full flex items-center justify-center">
                      {/* Placeholder for video stream */}
                      <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-4xl mb-4">
                        {callRecipient.slice(2, 4).toUpperCase()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-4xl mb-4">
                        {callRecipient.slice(2, 4).toUpperCase()}
                      </div>
                      <p>Video Off</p>
                    </div>
                  )}
                  
                  {/* Self video preview */}
                  <div className="absolute bottom-12 right-6 w-32 h-24 bg-gray-800 rounded-lg border-2 border-green-500">
                    <div className="w-full h-full flex items-center justify-center text-sm">
                      {isVideoEnabled ? 'Your camera' : 'Camera off'}
                    </div>
                  </div>
                  
                  {/* Call controls */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                    <button 
                      onClick={toggleVideo}
                      className={`p-3 rounded-full ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-500'}`}
                    >
                      {isVideoEnabled ? <FiVideo size={20} /> : <FiVideoOff size={20} />}
                    </button>
                    <button 
                      onClick={toggleAudio}
                      className={`p-3 rounded-full ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-500'}`}
                    >
                      {isAudioEnabled ? <FiMic size={20} /> : <FiMicOff size={20} />}
                    </button>
                    <button 
                      onClick={endVideoCall}
                      className="p-3 rounded-full bg-red-500"
                    >
                      <FiPhone size={20} />
                    </button>
                  </div>
                  
                  {/* Call information */}
                  <div className="absolute top-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-lg text-sm">
                    <FiClock className="inline mr-1" /> 00:05:23
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[30vh] p-8 text-center text-gray-500">
                <FiVideo className="mb-4 text-green-400" size={60} />
                <h3 className="text-xl font-medium mb-2 text-green-800">Start a Video Consultation</h3>
                <p className="mb-4">Connect with your healthcare provider securely</p>
                {selectedConversation ? (
                  <button
                    onClick={() => startVideoCall(selectedConversation.peerAddress)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <FiVideo className="inline mr-2" />
                    Call {shortenAddress(selectedConversation.peerAddress)}
                  </button>
                ) : (
                  <p className="text-sm">Select a conversation to start a call</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* New Conversation Modal */}
      {isNewConversationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-green-800">New Conversation</h3>
              <button
                onClick={() => setIsNewConversationModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="recipient" className="block text-gray-700 mb-2">
                Recipient's Ethereum Address
              </label>
              <input
                type="text"
                id="recipient"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="0x..."
                className="w-full border border-green-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the full Ethereum address of the recipient.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setIsNewConversationModalOpen(false)}
                className="mr-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={startNewConversation}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                disabled={!recipientInput.trim()}
              >
                Start Conversation
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Prescription Details Modal */}
      {isPrescriptionModalOpen && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-green-800">{selectedPrescription.medicationName}</h3>
              <button
                onClick={() => setIsPrescriptionModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Status</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedPrescription.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : selectedPrescription.status === 'expired'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedPrescription.status.charAt(0).toUpperCase() + selectedPrescription.status.slice(1)}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dosage</span>
                  <span className="font-medium">{selectedPrescription.dosage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frequency</span>
                  <span className="font-medium">{selectedPrescription.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Issue Date</span>
                  <span className="font-medium">{formatDate(selectedPrescription.issueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expiry Date</span>
                  <span className="font-medium">{formatDate(selectedPrescription.expiryDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Physician</span>
                  <span className="font-medium">{shortenAddress(selectedPrescription.physicianAddress)}</span>
                </div>
              </div>
              
              <div className="mt-4 bg-gray-50 p-3 rounded">
                <h4 className="text-gray-700 font-medium mb-2">Instructions</h4>
                <p className="text-gray-600">{selectedPrescription.instructions}</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setIsPrescriptionModalOpen(false)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default XMTPBentoGrid;