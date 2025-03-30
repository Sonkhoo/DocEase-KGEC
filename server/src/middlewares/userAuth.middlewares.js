import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import Patient from "../models/users.models.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // Get token from various sources
        const authHeader = req.header("Authorization");
        console.log("Full auth header:", authHeader);
        
        let token = req.cookies?.accessToken;
        
        // Try to extract from Authorization header
        if (!token && authHeader) {
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            } else {
                // If header present but not properly formatted, use it directly
                token = authHeader;
            }
        }
        
        console.log("Patient Auth - Extracted token:", token ? `${token.substring(0, 20)}...` : "undefined");
        
        if (!token) {
            throw new apiError(401, "Unauthorized request - No token provided");
        }

        // Verify token
        console.log("Patient Auth - Verifying token with secret:", process.env.ACCESS_TOKEN_SECRET?.substring(0, 3) + "...");
        
        try {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            console.log("Patient Auth - Decoded token:", decodedToken);
            
            // Get user from database
            const user = await Patient.findById(decodedToken?._id).select("-password -refreshToken");
            
            if (!user) {
                console.log("Patient Auth - No user found with ID:", decodedToken?._id);
                throw new apiError(401, "Invalid Access Token");
            }
            
            console.log("Patient Auth - User found:", user._id.toString());
            
            // Attach user to request object
            req.user = user;
            next();
        } catch (jwtError) {
            console.error("Patient Auth - JWT verification error:", jwtError.message);
            throw new apiError(401, `JWT verification failed: ${jwtError.message}`);
        }
    } catch (error) {
        console.error("Patient Auth - Error in middleware:", error);
        throw new apiError(401, error?.message || "Invalid access token");
    }
}); 