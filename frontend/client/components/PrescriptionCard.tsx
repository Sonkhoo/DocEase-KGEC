"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import axios from "axios"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { contractabi } from "@/contract/contractABI"
import { Trash2 } from "lucide-react"

interface MedicationItem {
  name: string;
  dosage: string;
}

interface PrescriptionCardProps {
  onSubmit?: (data: { 
    patientName: string; 
    doctorName: string;
    medications: MedicationItem[];
    prescriptionImage: File | null 
  }) => void
  className?: string
}

export function PrescriptionCard({ onSubmit, className }: PrescriptionCardProps) {
  const { address, isConnected } = useAccount()
  const [form, setForm] = useState({
    patientName: "",
    doctorName: "",
    medications: [{ name: "", dosage: "" }] as MedicationItem[],
    prescriptionImage: null as File | null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target
    if (files) {
      setForm({
        ...form,
        prescriptionImage: files[0],
      })
    } else {
      setForm({
        ...form,
        [name]: value,
      })
    }
  }

  const handleMedicationChange = (index: number, field: keyof MedicationItem, value: string) => {
    const updatedMedications = [...form.medications]
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    }
    setForm({
      ...form,
      medications: updatedMedications
    })
  }

  const addMedication = () => {
    setForm({
      ...form,
      medications: [...form.medications, { name: "", dosage: "" }]
    })
  }

  const removeMedication = (index: number) => {
    if (form.medications.length > 1) {
      const updatedMedications = form.medications.filter((_, i) => i !== index)
      setForm({
        ...form,
        medications: updatedMedications
      })
    }
  }

  const uploadImageToPinata = async () => {
    const formData = new FormData()
    if (form.prescriptionImage) {
      formData.append("file", form.prescriptionImage)
    } else {
      throw new Error("No prescription image file selected")
    }
    try {
      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          "pinata_api_key": process.env.NEXT_PUBLIC_PINATA_API_KEY,
          "pinata_secret_api_key": process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
          "Content-Type": "multipart/form-data",
        },
      })
      return res.data.IpfsHash
    } catch (error) {
      console.error("Error uploading prescription image to IPFS:", error)
      return null
    }
  }

  const uploadMetadataToPinata = async (imageHash: string) => {
    const metadata = {
      patientName: form.patientName,
      doctorName: form.doctorName,
      medications: form.medications,
      prescriptionImage: `ipfs://${imageHash}`,
    }
    
    try {
      const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
        headers: {
          "pinata_api_key": process.env.NEXT_PUBLIC_PINATA_API_KEY,
          "pinata_secret_api_key": process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
          "Content-Type": "application/json",
        },
      })
      return `ipfs://${res.data.IpfsHash}`
    } catch (error) {
      console.error("Error uploading prescription metadata to IPFS:", error)
      return null
    }
  }

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS1 as `0x${string}`

  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      alert("Please connect your wallet first!")
      return
    }

    // Validate medications
    const validMedications = form.medications.filter(med => med.name.trim() !== "" && med.dosage.trim() !== "")
    if (validMedications.length === 0) {
      alert("Please add at least one medication with dosage.")
      return
    }

    try {
      // Step 1: Upload the prescription image file
      const imageHash = await uploadImageToPinata()
      if (!imageHash) {
        alert("Prescription image upload failed.")
        return
      }
      
      // Step 2: Upload the metadata (including patient name, doctor name, medications, and image reference)
      const tokenURI = await uploadMetadataToPinata(imageHash)
      if (!tokenURI) {
        alert("Prescription metadata upload failed.")
        return
      }

      // Step 3: Call the contract to create the prescription
      writeContract({
        address: contractAddress,
        abi: contractabi,
        functionName: "createToken",
        args: [tokenURI, parseEther("400")],
      })

      // Call the onSubmit prop if provided
      if (onSubmit) {
        onSubmit(form)
      }
    } catch (error) {
      console.error("Error creating prescription:", error)
      alert("An error occurred while creating the prescription.")
    }
  }

  return (
    <div className={cn("w-full max-w-6xl lg:grid lg:grid-cols-2 gap-8 rounded-xl overflow-hidden backdrop-blur-xl bg-white bg-opacity-90 shadow-2xl border border-green-500/20", className)}>
      {/* Form Section */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Create Prescription</h1>
            <p className="mt-2 text-sm text-green-600">Fill in the details below to create a new prescription</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="patient-name" className="text-green-700">Patient Name</Label>
                <Input
                  id="patient-name"
                  name="patientName"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="mt-1 bg-white border-green-500/50 text-green-700 placeholder-green-400"
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="doctor-name" className="text-green-700">Doctor Name</Label>
                <Input
                  id="doctor-name"
                  name="doctorName"
                  type="text"
                  placeholder="Dr. Jane Smith"
                  required
                  className="mt-1 bg-white border-green-500/50 text-green-700 placeholder-green-400"
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-green-700 font-medium">Medications</Label>
                  <Button 
                    type="button" 
                    onClick={addMedication} 
                    className="px-2 py-1 h-8 text-sm bg-green-100 hover:bg-green-200 text-green-700"
                  >
                    + Add Medication
                  </Button>
                </div>
                
                {form.medications.map((medication, index) => (
                  <div key={index} className="p-4 border border-green-200 rounded-md bg-green-50">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-green-700 font-medium">Medication #{index + 1}</Label>
                      {form.medications.length > 1 && (
                        <Button 
                          type="button" 
                          onClick={() => removeMedication(index)} 
                          className="h-8 w-8 p-0 bg-red-100 hover:bg-red-200 text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor={`medication-name-${index}`} className="text-green-700">Medication Name</Label>
                        <Input
                          id={`medication-name-${index}`}
                          value={medication.name}
                          type="text"
                          placeholder="Medication Name"
                          required
                          className="mt-1 bg-white border-green-500/50 text-green-700 placeholder-green-400"
                          onChange={(e) => handleMedicationChange(index, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`dosage-${index}`} className="text-green-700">Dosage</Label>
                        <Input
                          id={`dosage-${index}`}
                          value={medication.dosage}
                          type="text"
                          placeholder="500mg"
                          required
                          className="mt-1 bg-white border-green-500/50 text-green-700 placeholder-green-400"
                          onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div>
                <Label htmlFor="prescription-image" className="text-green-700">Upload Prescription Image</Label>
                <Input
                  id="prescription-image"
                  name="prescriptionImage"
                  type="file"
                  accept="image/*"
                  required
                  className="mt-1 bg-white border-green-500/50 text-green-700 file:bg-green-100 file:text-green-700 file:border-0 file:rounded-md file:px-4 file:py-2 hover:file:bg-green-200"
                  onChange={handleChange}
                />
              </div>
            </div>
            {!isConnected ? (
              <Button onClick={() => alert("Connect your wallet first!")} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white">Connect Wallet</Button>
            ) : (
              <Button 
                type="submit" 
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                disabled={isTransactionLoading}
              >
                {isTransactionLoading ? "Creating Prescription..." : "Create Prescription"}
              </Button>
            )}
          </form>
          {isSuccess && (
            <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
              Successfully created prescription! Transaction hash: {hash}
            </div>
          )}
        </div>
      </div>

      {/* Animated Background Section */}
      <div className="relative h-full w-full overflow-hidden bg-green-50 flex flex-col items-center justify-center">
        <div className="absolute inset-0 w-full h-full bg-green-50 z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
        
        <h1 className={cn("md:text-4xl text-xl text-green-700 relative z-20")}>
          Create Your Prescription
        </h1>
        <p className="text-center mt-2 text-green-600 relative z-20 px-4">
          Securely store and manage your prescriptions on the blockchain
        </p>
      </div>
    </div>
  )
}