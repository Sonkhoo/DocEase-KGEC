"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from 'axios';
import { useRouter } from 'next/navigation'; // Import useRouter

export interface Doctor {
  _id: string;
  name: string;
  speciality: string[];
  contact_info: {
    email?: string;
    phone?: string;
  };
  experience?: number;
  hospital_affiliation?: string;
  consultation_fee?: number;
  registrationNumber?: string;
  avatar?: string;
}

export function DoctorsList() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Initialize the router

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!searchTerm.trim()) {
        setDoctors([]); // Clear the list if the search term is empty
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await axios.post(
          'http://localhost:8001/api/v1/doctors/PostDoc',
          {
            name: searchTerm.trim(),
            specialization: searchTerm.trim()
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data.success) {
          setDoctors(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch doctors');
        }
      } catch (err) {
        setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Failed to fetch doctors' : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchDoctors();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Handle routing to the doctor's booking page
  const handleBookAppointment = (doctorId: string) => {
    console.log('Booking appointment with doctor:', doctorId); // Debugging
    router.push(`/appointment/${doctorId}`); // Navigate to the doctor's booking page
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded-lg shadow">
        <input
          type="text"
          placeholder="Search doctors by name or specialization"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {loading && <p className="text-center text-green-600">Loading doctors...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {doctors.length === 0 && !loading && (
        <p className="text-center text-gray-500">No doctors found</p>
      )}

      {doctors.map((doctor) => (
        <div key={doctor._id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={doctor.avatar || "/placeholder.svg"} alt={doctor.name} />
              <AvatarFallback className="bg-green-100 text-green-700">
                {doctor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-green-600">Specializations:</span>
                  <div className="flex flex-wrap gap-1">
                    {doctor.speciality?.map((spec, index) => {
                      console.log('Doctor:', doctor.name, 'Specialization:', spec);
                      return (
                        <span 
                          key={index}
                          className="text-sm text-gray-600 bg-green-50 px-2 py-0.5 rounded-full"
                        >
                          {spec}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {doctor.experience && (
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-green-600">Experience:</span>
                    <span className="text-sm text-gray-600">{doctor.experience} years</span>
                  </div>
                )}
              </div>
              {doctor.hospital_affiliation && (
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Hospital:</span> {doctor.hospital_affiliation}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {doctor.consultation_fee && (
              <p className="text-sm font-medium text-green-600">
                Consultation Fee: ₹{doctor.consultation_fee}
              </p>
            )}
            <Button
              onClick={() => handleBookAppointment(doctor._id)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Book Appointment
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}