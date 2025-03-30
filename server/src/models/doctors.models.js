import { Schema, model } from "mongoose";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const availabilitySchema = new Schema({
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", ""],
      validate: {
        validator: function(v) {
          // Day is required and must be a valid day name when recurring is true
          // When recurring is false, day can be empty
          return (!this.recurring && v === "") || (this.recurring && ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].includes(v));
        },
        message: props => 'Day is required for recurring availability slots and must be a valid day name'
      }
    },
    start_time: {
      type: String,
      required: true,
    },
    end_time: {
      type: String,
      required: true,
    },
    recurring: {
      type: Boolean,
      default: true,
    },
    date: {
      type: Date,
      validate: {
        validator: function(v) {
          // Date is required when recurring is false
          // When recurring is true, date should be null
          return (this.recurring && v === null) || (!this.recurring && v instanceof Date && !isNaN(v.getTime()));
        },
        message: props => 'Valid date is required for one-time availability slots'
      }
    },
  });
  
  const doctorSchema = new Schema({
    name: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    googleId: { 
      type: String, 
      unique: true, 
      sparse: true 
    },
    specialty: {
      type: [String],
    },
    qualifications: {
      type: [String],
    },
    experience: {
      type: Number,
      default: 0,
    },
    availability: {
      type: [availabilitySchema],
      default: [],
    },
    contact_info: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true,
      },
      phone: {
        type: String,
        sparse: true,
      },
    },
    hospital_affiliation: {
      type: String,
    },
    consultation_fee: {
      type: Number,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    password: {
       type: String,
    },
    refreshToken: {
      type: String
    },
    registrationNumber: {
      type: String,
    },
    profileImage: {
     url: {
       type: String,
     },
     public_id: {
       type: String,
     }
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }, { timestamps: true });
  
  doctorSchema.index(
    { 'contact_info.phone': 1 },
    {
      unique: true,
      partialFilterExpression: 
      { 
        'contact_info.phone': { $exists: true, $ne: null }
      }
    }
  );

  // Add pre-save middleware to validate contact info
  doctorSchema.pre('save', async function(next) {
    if (!this.contact_info.email && !this.contact_info.phone) {
      next(new Error('At least one contact method (email or phone) is required'));
    } else {
      next();
    }
  });

  doctorSchema.pre("save", async function(next){ //pre is a hook just like post etc and save is a method
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
  })

  doctorSchema.methods.isPasswordCorrect = async function(password){ //isPasswordCorrect is a user defined method
    return await bcrypt.compare(password, this.password)
}

  doctorSchema.methods.generateAccessToken = function(){
    const accessToken = jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            phone: this.phone
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )

  return accessToken
}
doctorSchema.methods.generateRefreshToken = function(){
    const refreshToken = jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )

  return refreshToken
}

  const Doctor = model('Doctor', doctorSchema);
  
  
  export default Doctor