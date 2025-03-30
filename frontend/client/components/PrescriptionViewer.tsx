'use client'

declare global {
  interface Window {
    ethereum?: any;
  }
}

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { contractabi } from '@/contract/contractABI'
import { ethers } from 'ethers'
import { Loader2, Plus } from 'lucide-react'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS1 

interface MedicationItem {
  name: string;
  dosage: string;
}

interface PrescriptionMetadata {
  tokenId: string;
  patientName: string;
  doctorName: string;
  medications: MedicationItem[];
  image: string;
}

interface ListedPrescription {
  tokenId: bigint;
  price: bigint;
}

interface PrescriptionWithPrice extends PrescriptionMetadata {
  price: string;
}

// Utility function to convert IPFS URL to HTTP URL
const convertIpfsToHttp = (url: string) => {
  if (!url) return ''
  return url.startsWith("ipfs://")
    ? url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
    : url
}

export default function PrescriptionViewer() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithPrice | null>(null)
  const [sellingPrescription, setSellingPrescription] = useState<PrescriptionWithPrice | null>(null)
  const [sellPrice, setSellPrice] = useState('')
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [expandedMedications, setExpandedMedications] = useState<boolean>(false)

  // Initialize provider, signer, and contract
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractabi, signer)
        setProvider(provider)
        setSigner(signer)
        setContract(contract)
      }
    }
    init()
  }, [])

  // Get listed prescriptions
  useEffect(() => {
    const fetchListedPrescriptions = async () => {
      if (!contract) return

      try {
        setLoading(true)
        setError(null)

        const listedPrescriptions = await contract.getAllListedNFTs()
        const prescriptionsData = await Promise.all(
          listedPrescriptions.map(async (prescription: ListedPrescription) => {
            const tokenURI = await contract.tokenURI(prescription.tokenId)
            if (!tokenURI) throw new Error(`No URI found for token ${prescription.tokenId}`)

            const metadata = await fetchPrescriptionMetadata(prescription.tokenId, tokenURI)
            return {
              ...metadata,
              price: ethers.formatEther(prescription.price) + ' ETH',
            }
          })
        )

        setPrescriptions(prescriptionsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching prescriptions')
        console.error('Error fetching prescription details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchListedPrescriptions()
  }, [contract])

  // Fetch metadata for a prescription
  const fetchPrescriptionMetadata = async (tokenId: bigint, tokenURI: string) => {
    const httpUrl = convertIpfsToHttp(tokenURI);
    console.log("Fetching metadata from:", httpUrl);

    try {
      const response = await fetch(httpUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      let metadata;
      if (contentType?.includes("application/json")) {
        metadata = await response.json();
        console.log("Metadata:", metadata);
      } else {
        throw new Error(`Unexpected content type: ${contentType}`);
      }

      const imageUrl = convertIpfsToHttp(metadata.prescriptionImage);
      console.log("Image URL:", imageUrl);

      // Handle medications array or backward compatibility for older format
      const medications = metadata.medications || [{ 
        name: metadata.medication || '', 
        dosage: metadata.dosage || '' 
      }];

      return {
        tokenId: tokenId.toString(),
        patientName: metadata.patientName || `Prescription ${tokenId}`,
        doctorName: metadata.doctorName || 'Unknown Doctor',
        medications: medications,
        image: imageUrl,
      };
    } catch (error) {
      console.error(`Error fetching metadata for token ${tokenId}:`, error);
      throw error;
    }
  };

  // Handle selling a prescription
  const handleSell = async () => {
    if (!sellingPrescription || !sellPrice || !contract) return

    try {
      const tx = await contract.executeSale(
        BigInt(sellingPrescription.tokenId),
        { value: ethers.parseEther(sellPrice) }
      )
      await tx.wait()
      setSellingPrescription(null)
      setSellPrice('')
    } catch (error) {
      console.error("Error executing sale:", error)
      setError("Failed to execute sale. Please try again.")
    }
  }

  // Get primary medication for card display
  const getPrimaryMedication = (medications: MedicationItem[]) => {
    if (!medications || medications.length === 0) return { name: 'No medication', dosage: '' };
    return medications[0];
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-16 h-16 text-green-400 animate-spin" />
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-green-700">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
          Prescription Gallery
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 p-4">
          {prescriptions.map((prescription) => {
            const primaryMedication = getPrimaryMedication(prescription.medications);
            const medicationCount = prescription.medications.length;
            
            return (
              <motion.div
                key={prescription.tokenId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full"
              >
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-500/[0.2] hover:shadow-2xl hover:shadow-green-500/[0.1] transition-all duration-300 h-full flex flex-col">
                  <div className="flex flex-col gap-4">
                    <div 
                      className="w-full cursor-pointer"
                      onClick={() => setSelectedPrescription(prescription)}
                    >
                      <div className="aspect-[4/3] w-full relative overflow-hidden rounded-xl">
                        <img
                          src={prescription.image}
                          className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-300 hover:scale-110"
                          alt={prescription.patientName}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 line-clamp-2">
                        {prescription.patientName}
                      </h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-green-500 font-medium">Doctor:</span>
                          <span className="text-green-600 line-clamp-1">{prescription.doctorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500 font-medium">Medication:</span>
                          <span className="text-green-600 line-clamp-1">
                            {primaryMedication.name}
                            {medicationCount > 1 && ` +${medicationCount - 1} more`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-500 font-medium">Dosage:</span>
                          <span className="text-green-600 line-clamp-1">{primaryMedication.dosage}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-auto pt-4">
                    <Button
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-medium transition-colors duration-300"
                      onClick={() => setSelectedPrescription(prescription)}
                    >
                      View Details
                    </Button>
                    <Button
                      className="flex-1 bg-white text-green-700 text-sm font-medium transition-colors duration-300 hover:bg-green-50 border border-green-200"
                      onClick={() => {
                        setSellingPrescription(prescription)
                        setSellPrice('')
                      }}
                    >
                      Sell
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dialog for Prescription Details */}
        <AnimatePresence>
          {selectedPrescription && (
            <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
              <DialogContent className="sm:max-w-[525px] bg-gradient-to-br from-green-50 to-green-100 text-green-700 border border-green-500/20">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                    {selectedPrescription.patientName}
                  </DialogTitle>
                  <DialogDescription className="text-green-600">
                    Prescription Details
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <img 
                    src={selectedPrescription.image} 
                    alt={selectedPrescription.patientName} 
                    className="w-full h-64 object-cover rounded-lg mb-4 shadow-lg shadow-green-500/20" 
                  />
                  <div className="mb-4">
                    <h3 className="text-green-700 font-semibold mb-1">Doctor:</h3>
                    <p className="text-green-600">{selectedPrescription.doctorName}</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-green-700 font-semibold mb-1">Medications:</h3>
                    <div className="space-y-3 mt-2 max-h-48 overflow-y-auto pr-2">
                      {selectedPrescription.medications.map((med, index) => (
                        <div 
                          key={index} 
                          className="bg-white rounded-lg p-3 shadow-sm border border-green-200"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-green-700">{med.name}</p>
                              <p className="text-green-600 text-sm">{med.dosage}</p>
                            </div>
                            <div className="bg-green-100 text-green-700 rounded-full h-6 w-6 flex items-center justify-center font-medium text-xs">
                              {index + 1}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-green-500 font-semibold">Price: {selectedPrescription.price}</p>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={() => setSelectedPrescription(null)} 
                    variant="secondary" 
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  >
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Dialog for Selling Prescription */}
        <AnimatePresence>
          {sellingPrescription && (
            <Dialog open={!!sellingPrescription} onOpenChange={() => setSellingPrescription(null)}>
              <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-green-50 to-green-100 text-green-700 border border-green-500/20">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                    Sell Prescription
                  </DialogTitle>
                  <DialogDescription className="text-green-600">
                    Set your prescription price
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <img 
                    src={sellingPrescription.image} 
                    alt={sellingPrescription.patientName} 
                    className="w-full h-64 object-cover rounded-lg mb-4 shadow-lg shadow-green-500/20" 
                  />
                  
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <Button 
                    onClick={() => setSellingPrescription(null)} 
                    variant="secondary" 
                    className="bg-green-100 hover:bg-green-200 text-green-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSell}
                    disabled={!sellPrice}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  >
                    List for Sale
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}