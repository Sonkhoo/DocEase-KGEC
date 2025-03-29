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
import { Loader2, Plus, AlertCircle } from 'lucide-react'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS1 as `0x${string}`

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

interface NFTListing {
  tokenId: bigint;
  price: bigint;
  seller: string;
  owner: string;
  listed: boolean;
}

interface PrescriptionWithDetails extends PrescriptionMetadata {
  price: string;
  isListed: boolean;
  seller: string;
  owner: string;
}

// Utility function to convert IPFS URL to HTTP URL
const convertIpfsToHttp = (url: string) => {
  if (!url) return ''
  return url.startsWith("ipfs://")
    ? url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
    : url
}

export default function MyPrescriptions() {
  const [myPrescriptions, setMyPrescriptions] = useState<PrescriptionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithDetails | null>(null)
  const [listingPrescription, setListingPrescription] = useState<PrescriptionWithDetails | null>(null)
  const [listPrice, setListPrice] = useState('')
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [userAddress, setUserAddress] = useState<string>('')
  const [transactionPending, setTransactionPending] = useState(false)

  // Initialize provider, signer, and contract
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const signer = await provider.getSigner()
          const address = await signer.getAddress()
          const contract = new ethers.Contract(CONTRACT_ADDRESS, contractabi, signer)
          
          setProvider(provider)
          setSigner(signer)
          setContract(contract)
          setUserAddress(address)
        } catch (error) {
          console.error("Error initializing web3:", error)
          setError("Failed to connect to your wallet. Please make sure MetaMask is installed and unlocked.")
        }
      } else {
        setError("Web3 provider not found. Please install MetaMask to use this application.")
      }
    }
    init()
  }, [])

  // Get user's prescriptions
  useEffect(() => {
    const fetchMyPrescriptions = async () => {
      if (!contract || !userAddress) return

      try {
        setLoading(true)
        setError(null)

        const myNFTs = await contract.getMyNFTs()
        const prescriptionsData = await Promise.all(
          myNFTs.map(async (nft: NFTListing) => {
            const tokenURI = await contract.tokenURI(nft.tokenId)
            if (!tokenURI) throw new Error(`No URI found for token ${nft.tokenId}`)

            const metadata = await fetchPrescriptionMetadata(nft.tokenId, tokenURI)
            return {
              ...metadata,
              price: ethers.formatEther(nft.price) + ' ETH',
              isListed: nft.listed,
              seller: nft.seller,
              owner: nft.owner
            }
          })
        )

        setMyPrescriptions(prescriptionsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching your prescriptions')
        console.error('Error fetching prescription details:', err)
      } finally {
        setLoading(false)
      }
    }

    if (contract && userAddress) {
      fetchMyPrescriptions()
    }
  }, [contract, userAddress, transactionPending])

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

  // Handle listing a prescription for sale
  const handleListForSale = async () => {
    if (!listingPrescription || !listPrice || !contract) return

    try {
      setTransactionPending(true)
      const priceInWei = ethers.parseEther(listPrice)
      const tx = await contract.listNFT(
        BigInt(listingPrescription.tokenId),
        priceInWei
      )
      await tx.wait()
      setListingPrescription(null)
      setListPrice('')
    } catch (error) {
      console.error("Error listing prescription:", error)
      setError("Failed to list prescription. Please try again.")
    } finally {
      setTransactionPending(false)
    }
  }

  // Handle removing a prescription from sale
  const handleRemoveFromSale = async (tokenId: string) => {
    if (!contract) return

    try {
      setTransactionPending(true)
      const tx = await contract.cancelListing(BigInt(tokenId))
      await tx.wait()
    } catch (error) {
      console.error("Error removing prescription from sale:", error)
      setError("Failed to remove prescription from sale. Please try again.")
    } finally {
      setTransactionPending(false)
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
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // Render empty state
  if (myPrescriptions.length === 0) {
    return (
      <div className="min-h-screen bg-white text-green-700">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-5xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
            My Prescriptions
          </h1>
          <div className="flex flex-col items-center justify-center p-12 bg-green-50 rounded-xl border border-green-500/20">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <Plus className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold text-green-600 mb-2">No prescriptions found</h2>
            <p className="text-green-500 text-center max-w-md mb-6">
              You don't have any prescriptions in your collection yet. They'll appear here once you acquire them.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-green-700">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
          My Prescriptions
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-1 gap-6 p-4">
  {myPrescriptions.map((prescription) => {
    const primaryMedication = getPrimaryMedication(prescription.medications);
    const medicationCount = prescription.medications.length;
    
    return (
      <motion.div
        key={prescription.tokenId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
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
                {prescription.isListed && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                    Listed
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 min-h-[120px]">
              <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 truncate">
                {prescription.patientName}
              </h3>
              <div className="space-y-2 mt-1">
                <div className="flex flex-col">
                  <span className="text-green-500 text-sm font-medium">Doctor:</span>
                  <span className="text-green-600 truncate">{prescription.doctorName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-green-500 text-sm font-medium">Medication:</span>
                  <span className="text-green-600 truncate">
                    {primaryMedication.name}
                    {medicationCount > 1 && ` +${medicationCount - 1} more`}
                  </span>
                </div>
                {prescription.isListed && (
                  <div className="flex flex-col">
                    <span className="text-green-500 text-sm font-medium">Price:</span>
                    <span className="text-green-600 truncate">{prescription.price}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-auto pt-4">
            <Button
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs sm:text-sm font-medium transition-colors duration-300"
              onClick={() => setSelectedPrescription(prescription)}
            >
              View Details
            </Button>
            {prescription.isListed ? (
              <Button
                className="flex-1 bg-white text-red-500 text-xs sm:text-sm font-medium transition-colors duration-300 hover:bg-red-50 border border-red-200"
                onClick={() => handleRemoveFromSale(prescription.tokenId)}
                disabled={transactionPending}
              >
                {transactionPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    <span className="hidden sm:inline">Processing</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Remove</span>
                    <span className="sm:hidden">Remove</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="flex-1 bg-white text-green-700 text-xs sm:text-sm font-medium transition-colors duration-300 hover:bg-green-50 border border-green-200"
                onClick={() => {
                  setListingPrescription(prescription)
                  setListPrice('')
                }}
              >
                List for Sale
              </Button>
            )}
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
                  {selectedPrescription.isListed && (
                    <div className="mb-4">
                      <h3 className="text-green-700 font-semibold mb-1">Listing Status:</h3>
                      <div className="bg-green-100 text-green-700 rounded-lg p-3 shadow-sm border border-green-200">
                        <p className="font-medium">Listed for {selectedPrescription.price}</p>
                      </div>
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="text-green-700 font-semibold mb-1">Token ID:</h3>
                    <p className="text-green-600">{selectedPrescription.tokenId}</p>
                  </div>
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

        {/* Dialog for Listing Prescription */}
        <AnimatePresence>
          {listingPrescription && (
            <Dialog open={!!listingPrescription} onOpenChange={() => setListingPrescription(null)}>
              <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-green-50 to-green-100 text-green-700 border border-green-500/20">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                    List Prescription for Sale
                  </DialogTitle>
                  <DialogDescription className="text-green-600">
                    Set your listing price in ETH
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <img 
                    src={listingPrescription.image} 
                    alt={listingPrescription.patientName} 
                    className="w-full h-64 object-cover rounded-lg mb-4 shadow-lg shadow-green-500/20" 
                  />
                  <div className="mb-6">
                    <Label htmlFor="price" className="text-green-700 font-semibold">Price (ETH)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.001"
                      min="0"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      className="mt-1 bg-white border-green-200 focus:border-green-400 focus:ring-green-400"
                      placeholder="0.01"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <Button 
                    onClick={() => setListingPrescription(null)} 
                    variant="secondary" 
                    className="bg-green-100 hover:bg-green-200 text-green-700"
                    disabled={transactionPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleListForSale}
                    disabled={!listPrice || transactionPending}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  >
                    {transactionPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing
                      </>
                    ) : (
                      'List for Sale'
                    )}
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