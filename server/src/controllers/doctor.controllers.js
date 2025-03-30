import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import Doctor from "../models/doctors.models.js";
import fs from "fs"
import Appointment from "../models/appointment.models.js";
import User from "../models/users.models.js";

const generateAccessandRefreshToken = async(userId)=>{
    try {
        const doctor =await Doctor.findById(userId)
        console.log("inside function ",doctor)
        const accessToken = doctor.generateAccessToken()
        const refreshToken = doctor.generateRefreshToken()

        console.log("accessToken", accessToken, "refreshToken", refreshToken);

        doctor.refreshToken = refreshToken
        await doctor.save({ validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new apiError(500,"Something went wrong while generating tokens")
    }
}

const registerDoctor = asyncHandler(async (req, res, next) => {
    const {
        name,
        contact_info,
        password,
      } = req.body;

      const {phone, email} = contact_info

      if (!name || (!email && !phone) || !password) {
        throw new apiError("Please provide all required fields", 400);
      }

      // Check if the doctor already exists
      const existingDoctor = await Doctor.findOne({ 
        $or: [
          { "contact_info.email": email }, 
          { "contact_info.phone": phone }
        ]
      });

      if (existingDoctor) {
        throw new apiError("Doctor already exists", 400);
      }

      // Create a new doctor instance
      const newDoctor = await Doctor.create({
        name,
        contact_info: {
          email: email || undefined,
          phone: phone || undefined
        },
        password,
      }); 

      const createdDoctor = await Doctor.findById(newDoctor._id).select(
        "-password -refreshToken"
      );

      if(!createdDoctor){
        throw new apiError(500, "Registering User failed");
      }
      
      const {accessToken, refreshToken} = await generateAccessandRefreshToken(createdDoctor._id);

      res.status(201)
        .cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none"
        })
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none"
        })
        .cookie("userId", createdDoctor._id, {
          httpOnly: true,
          secure: true,
          sameSite: "none"
        })
        .json(
          new apiResponse(200, {
            user: createdDoctor,
            accessToken,
            refreshToken
          }, "User registered successfully")
        );
});

// need to add multer,cloudinary, otp/email validation for password storage(microservices?/message queue?)
//need to add avaiblity logic here
const updateDoctor = asyncHandler(async (req, res, next) => {
  // Define allowed fields (excluding profileImage which is handled via file upload)
  const allowedFields = [
      'name',
      'specialty',
      'qualifications',
      'experience',
      'contact_info',
      'hospital_affiliation',
      'consultation_fee',
      'registrationNumber'
  ];

  // Build update object from allowed fields
  const updateData = {};
  allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
      }
  });

      // Validate contact info
      if (updateData.contact_info) {
          if (!updateData.contact_info.email && !updateData.contact_info.phone) {
              return next(new apiError("Contact info requires email or phone", 400));
          }
      }

      // Update doctor document
      const updatedDoctor = await Doctor.findByIdAndUpdate(
          req.params.id,
          { $set: updateData },
          { 
              new: true,
              runValidators: true,
              select: '-password -availability'
          }
      );

      if (!updatedDoctor) {
          return next(new apiError("Doctor not found", 404));
      }

      res.status(200).json(
          new apiResponse(200, updatedDoctor, "Doctor updated successfully")
      );

      });

const updateDoctorPassword = asyncHandler(async (req, res, next) => {
    // Assuming the authenticated doctor's id is available in req.user.id
    const doctorId = req.user.id; 
    const { currentPassword, newPassword } = req.body;
  
    if (!currentPassword || !newPassword) {
      throw new apiError("Current and new password are required", 400);
    }
  
    // Retrieve the doctor record
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new apiError("Doctor not found", 404);
    }
  
    // Verify the current password
    const isMatch = await bcrypt.compare(currentPassword, doctor.password);
    if (!isMatch) {
      throw new apiError("Current password is incorrect", 400);
    }
  
    // Hash the new password and update the record
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    doctor.password = hashedPassword;
    await doctor.save();
  
    res.status(200).json(new apiResponse(200, null, "Password updated successfully"));
  });
  
const updateDoctorAvailability = asyncHandler(async (req, res, next) => {
    // Use the ID from the route parameters instead of req.user.id
    const doctorId = req.params.id;
    const { availability } = req.body;

    console.log("Received availability data:", JSON.stringify(availability, null, 2));
    console.log("doctorId", doctorId);
  
    if (!availability || !Array.isArray(availability)) {
      return next(new apiError("Availability must be an array of availability objects.", 400));
    }
  
    // Validate and process availability data
    try {
      // Validate each availability object
      const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      
      // Process and clean the availability data
      const processedAvailability = availability.map(slot => {
        // Validate basic slot fields
        if (!slot.start_time || !slot.end_time) {
          throw new apiError("Each availability slot must include start_time and end_time", 400);
        }
        
        // Create a clean version of the slot
        const cleanSlot = {
          start_time: slot.start_time,
          end_time: slot.end_time,
          recurring: typeof slot.recurring === 'boolean' ? slot.recurring : true
        };
        
        // Handle recurring and one-time slots differently
        if (cleanSlot.recurring) {
          // For recurring slots, validate and include day
          if (!slot.day || !validDays.includes(slot.day)) {
            throw new apiError(`Invalid or missing day for recurring slot: ${slot.day}`, 400);
          }
          cleanSlot.day = slot.day;
          cleanSlot.date = null; // Clear date for recurring slots
        } else {
          // For one-time slots, validate and include date
          if (!slot.date) {
            throw new apiError("Date is required for one-time availability slots", 400);
          }
          
          // Handle date (frontend sends as ISO string, convert to Date object)
          try {
            // Ensure we have a valid date string or Date object
            const dateValue = slot.date instanceof Date ? slot.date : new Date(slot.date);
            
            // Check if date is valid
            if (isNaN(dateValue.getTime())) {
              console.error("Invalid date:", slot.date);
              throw new apiError("Invalid date format for one-time slot", 400);
            }
            
            cleanSlot.date = dateValue;
            cleanSlot.day = ""; // Clear day for one-time slots
          } catch (error) {
            console.error("Date conversion error:", error);
            throw new apiError(`Error processing date: ${error.message}`, 400);
          }
        }
        
        return cleanSlot;
      });

      // Update the doctor's availability field 
      const updatedDoctor = await Doctor.findByIdAndUpdate(
        doctorId,
        { availability: processedAvailability },
        { new: true, runValidators: true }
      );
    
      if (!updatedDoctor) {
        return next(new apiError("Doctor not found or failed to update availability", 404));
      }
    
      console.log("Updated doctor availability successfully");
      res.status(200).json(new apiResponse(200, updatedDoctor, "Availability updated successfully"));
    } catch (error) {
      console.error("Error updating availability:", error);
      
      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        return next(new apiError(`Validation error: ${error.message}`, 400));
      }
      
      // If error is already an apiError, pass it through
      if (error instanceof apiError) {
        return next(error);
      }
      
      // Otherwise, wrap in a generic error
      return next(new apiError(`Error updating availability: ${error.message}`, 500));
    }
  });

const deleteDoctor = asyncHandler(async (req, res, next) => {
    const doctorId = req.params.id;
    const existingDoctor = await Doctor.findById(doctorId);

    if (!existingDoctor) {
        throw new apiError("Doctor does not exist", 400);   
    }

    const deletedDoctor = await Doctor.findByIdAndDelete(doctorId);
});

const loginDoctor = asyncHandler(async (req, res, next) => {
    const {name, contact_info, password}= req.body
    console.log(name, contact_info, password);
    if(!name || !contact_info.email && !contact_info.phone || !password){
        throw new apiError(400, "Username or Email is rerquired")
    }

    const doctor = await Doctor.findOne({
        $or: [{ "contact_info.email": contact_info.email }, { "contact_info.phone": contact_info.phone }]
    })

    if(!doctor){
        throw new apiError(400, "User does not exist")
    }

    const isPasswordValid = await doctor.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new apiError(401, "Invalid Password")
    }

    const {accessToken, refreshToken} = await generateAccessandRefreshToken(doctor._id)

    const loggedinUser = await Doctor.findById(doctor._id)
    .select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken, options) //adding refresh and access token to cookies
    .cookie("refreshToken", refreshToken, options)
    .cookie("user._id", loggedinUser._id.toString(), options)
    .json(
        new apiResponse(200,{
            user: loggedinUser, accessToken, refreshToken //alada kore send korchi karon user locally store korte chaite pare for developping maybe mobile app( eta data field)
        },
            "User Logged in successfully"
        )
    )
})

const logoutDoctor = asyncHandler(async (req, res, next) => {
    
})

const getVerifiedDoctorProfile = asyncHandler(async (req, res, next) => {
    const doctorId = req.params.id
    const doctor = await Doctor.findById(doctorId)
    .select("-password -refreshToken")
    if(!doctor){
        throw new apiError(400, "Doctor does not exist")
    }
    console.log(doctor)
    return res.status(200)
    .json(
        new apiResponse(200, {
        user: doctor
        }, "Doctor details fetched successfully")
    )

})


const getAllApprovedDoctors = asyncHandler(async (req, res, next) => { 
  const doctor = await Doctor.find({  
    isVerified: true, 
    specialty: { $exists: true, $ne: [] }, 
    availability: { $exists: true, $ne: [] } 
  }).select("-password -refreshToken")

  if (!doctor.length) {
    throw new apiError(404, "No approved doctors found");
  }
  res
    .status(200)
    .json(
      new apiResponse(200, doctor, "Approved doctors fetched successfully")
    );

})

const getDoctorsBySpecialty = asyncHandler(async (req, res, next) => {

  const { specialty } = req.params;
  if (!specialty) {
    throw new apiError(400, "Specialty is required");
  }
  const doctor = await Doctor.find({ specialty, isApproved: true }).select(
    "-password -refreshToken"
  );
  if (!doctor.length) {
    throw new apiError(404, "No doctors found for this specialty");
  }
  res
    .status(200)
    .json(
      new apiResponse(
        200,
        doctor,
        'Doctors specializing in ${specialty} fetched successfully'
      )
    );

})

const getDoctorReviews = asyncHandler(async (req, res, next) => {
    
})

const getDoctorAppointments = asyncHandler(async (req, res, next) => {
    
})

const getDoctorAvailability = asyncHandler(async (req, res, next) => {
});

const PostAllDoctors = asyncHandler(async (req, res, next) => {
  // Extract the name and specialization from the request body
  const { name, specialization } = req.body;
  console.log(specialization)
  // Optionally, validate the name field
  if (!name && !specialization) {
    return res.status(400).json({ success: false, message: "Name or specialization is required" });
  }

  // Find doctors whose name or specialization matches (case-insensitive search)
  const doctors = await Doctor.find({
    $or: [
      { name: { $regex: name || '', $options: 'i' } },
      { specialty: { $regex: specialization || '', $options: 'i' } }
    ]
  });

  console.log(doctors)

  // Return the results in the response
  res.status(200).json({ success: true, data: doctors });
});

const getDoctorPatients = asyncHandler(async (req, res, next) => {
    const doctorId = req.params.doctorId;
    
    // Get all appointments for this doctor
    const appointments = await Appointment.find({ doctorId })
        .populate('patientId', 'name contact_info.email profileImage')
        .sort({ createdAt: -1 });

    // Transform appointments into patient list with last message
    const patients = appointments.map(appointment => ({
        _id: appointment.patientId._id,
        name: appointment.patientId.name,
        email: appointment.patientId.contact_info.email,
        profileImage: appointment.patientId.profileImage,
        lastMessage: {
            text: "Start a conversation",
            timestamp: new Date()
        }
    }));

    // Remove duplicates based on patient ID
    const uniquePatients = Array.from(
        new Map(patients.map(item => [item._id, item])).values()
    );

    res.status(200).json(
        new apiResponse(200, { patients: uniquePatients }, "Patients fetched successfully")
    );
});

const getPatientProfile = asyncHandler(async (req, res, next) => {
    const patientId = req.params.patientId;
    
    const patient = await Patient.findById(patientId)
        .select('name contact_info.email profileImage');

    if (!patient) {
        throw new apiError(404, "Patient not found");
    }

    res.status(200).json(
        new apiResponse(200, { user: patient }, "Patient profile fetched successfully")
    );
});

export { registerDoctor, updateDoctor, deleteDoctor, loginDoctor, logoutDoctor, getVerifiedDoctorProfile, getAllApprovedDoctors, getDoctorsBySpecialty, getDoctorReviews, getDoctorAppointments, getDoctorAvailability, updateDoctorAvailability, updateDoctorPassword, PostAllDoctors, getDoctorPatients, getPatientProfile };