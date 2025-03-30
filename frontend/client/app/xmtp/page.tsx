"use client"

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Client, Conversation as XMTPConversation } from '@xmtp/xmtp-js';
import { ethers } from 'ethers';
import { FiSend, FiMessageCircle, FiRefreshCw, FiX, FiCheck, FiCopy, FiUsers, FiSettings } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useUser } from '../_context/UserContext';

// Dynamically import Three.js related components to avoid SSR issues
// const ThreeComponents = dynamic(() => import('./ThreeComponents'), { ssr: false });

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

// User interface from context
interface User {
  name?: string;
  // Add other user properties as needed
}

// Simple Layout component for consistent styling
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
};

// 3D Message Visualization
const MessagesVisualization: React.FC<{
  messages: Message[];
  userAddress: string;
}> = ({ messages, userAddress }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-30">
      {/* 3D visualization placeholder */}
      <p className="sr-only">3D message visualization</p>
    </div>
  );
};

const XMTPChat: React.FC = () => {
  const { user } = useUser() as { user: User | null };
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [recipientInput, setRecipientInput] = useState<string>('');
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState<boolean>(false);
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [isClientInitializing, setIsClientInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Connect wallet
  const connectWallet = async (): Promise<ethers.Signer | null> => {
    try {
      setError(null);
      
      if (!window.ethereum) {
        setError('Please install MetaMask or another Web3 wallet');
        return null;
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const walletSigner = provider.getSigner();
      const address = await walletSigner.getAddress();
      
      setSigner(walletSigner);
      setWalletAddress(address);
      setIsWalletConnected(true);
      
      return walletSigner;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet');
      return null;
    }
  };

  // Initialize XMTP client
  const initializeClient = async (): Promise<Client | null> => {
    try {
      setError(null);
      setIsClientInitializing(true);
      
      const walletSigner = signer || await connectWallet();
      if (!walletSigner) return null;
      
      const xmtp = await Client.create(walletSigner, { env: 'production' });
      setClient(xmtp);
      
      const convos = await xmtp.conversations.list();
      setConversations(convos as unknown as Conversation[]);
      
      return xmtp;
    } catch (err) {
      console.error('Error initializing XMTP client:', err);
      setError('Failed to initialize XMTP');
      return null;
    } finally {
      setIsClientInitializing(false);
    }
  };

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

    // No cleanup function needed as we're not returning anything
  }, [selectedConversation]);

  // Start a new conversation
  const startNewConversation = async (): Promise<void> => {
    if (!recipientInput.trim() || !client) return;
    
    try {
      setError(null);
      
      if (!ethers.utils.isAddress(recipientInput)) {
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

  // Format time
  const formatTime = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Shorten address for display
  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddressToClipboard = (): void => {
    navigator.clipboard.writeText(walletAddress);
  };

  // Wallet connection screen
  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
        <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8 mt-10">
          <div className="text-center">
            <FiMessageCircle className="mx-auto text-blue-500 h-16 w-16 mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Connect your Ethereum wallet to start secure, decentralized messaging.
              {user?.name && <span> Logged in as {user.name}.</span>}
            </p>
            
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            <button 
              onClick={connectWallet}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors w-full"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  // XMTP client initialization screen
  if (isWalletConnected && !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
        <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-8 mt-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <p className="text-green-600 font-medium">Wallet Connected</p>
            </div>
            
            <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between mb-6">
              <span className="text-gray-700 font-mono">{shortenAddress(walletAddress)}</span>
              <button 
                onClick={copyAddressToClipboard} 
                className="text-gray-500 hover:text-blue-500"
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
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors w-full flex items-center justify-center"
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

  // Main chat interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">XMTP Messaging</h1>
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            {shortenAddress(walletAddress)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations list */}
          <div className="md:col-span-1 bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">Conversations</h2>
              <button 
                onClick={() => setIsNewConversationModalOpen(true)}
                className="bg-blue-500 text-white p-2 rounded-full"
                title="Start new conversation"
              >
                <FiMessageCircle size={20} />
              </button>
            </div>
            
            <div className="divide-y max-h-[70vh] overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FiMessageCircle className="mx-auto mb-2 text-gray-400" size={40} />
                  <p>No conversations yet</p>
                  <button
                    onClick={() => setIsNewConversationModalOpen(true)}
                    className="mt-4 text-blue-500 hover:underline"
                  >
                    Start a new conversation
                  </button>
                </div>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.peerAddress}
                    onClick={() => setSelectedConversation(convo)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedConversation?.peerAddress === convo.peerAddress
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                        {convo.peerAddress.slice(2, 4).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium truncate">
                          {shortenAddress(convo.peerAddress)}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          Click to view conversation
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          
          {/* Messages area */}
          <div className="md:col-span-2 bg-white shadow rounded-lg overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b bg-blue-500 text-white">
                  <h2 className="font-bold">Chat with {shortenAddress(selectedConversation.peerAddress)}</h2>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto max-h-[60vh]">
                  {isLoadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
                          className={`flex ${message.senderAddress === walletAddress ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.senderAddress === walletAddress
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p className="mb-1">{message.content}</p>
                            <p className={`text-xs ${message.senderAddress === walletAddress ? 'text-blue-100' : 'text-gray-500'}`}>
                              {formatTime(message.sent)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                <form onSubmit={sendMessage} className="p-4 border-t mt-auto">
                  {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 border border-gray-300 rounded-l-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="bg-blue-500 text-white rounded-r-lg p-3 hover:bg-blue-600 focus:outline-none"
                      disabled={!messageInput.trim()}
                    >
                      <FiSend size={20} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                <FiMessageCircle className="mb-4 text-gray-400" size={60} />
                <h3 className="text-xl font-medium mb-2">Select a Conversation</h3>
                <p className="mb-4">Choose an existing conversation or start a new one</p>
                <button
                  onClick={() => setIsNewConversationModalOpen(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Start New Conversation
                </button>
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
              <h3 className="text-xl font-semibold">New Conversation</h3>
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
                className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                disabled={!recipientInput.trim()}
              >
                Start Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom type definitions for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default XMTPChat;