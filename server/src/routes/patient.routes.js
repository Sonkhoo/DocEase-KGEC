import { Router } from "express";
import { registerPatient, loginPatient, bookAppointment, updatePatient } from "../controllers/patient.controllers.js";
import passport from "../utils/passport.js";


const router = Router();

router.route("/register").post(registerPatient);
//http://localhost:8000/api/v1/patients/register

router.route("/login").post(loginPatient);
//http://localhost:8000/api/v1/patients/login

router.route("/book/appointment").post(bookAppointment)
//http://localhost:8000/api/v1/patients/book/appointment

import upload from "../middlewares/multer.middlewares.js";

router.route("/update/:id").patch(
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "medical_certificates", maxCount: 5 }
  ]),
  updatePatient
);


router.route("/auth/google").get(passport.authenticate("patient-google", { scope: ["profile", "email"] }));
//http://localhost:8000/api/v1/patients/auth/google

router.route("/auth/google/callback").get(passport.authenticate("patient-google", { 
    failureRedirect: "/login",
    failureMessage: true,
    session: false 
}), 
    (req, res) => {
        try {
            if (!req.user) {
                return res.redirect("http://localhost:3000/login?error=Authentication failed");
            }

            const { accessToken, refreshToken, user } = req.user;
            
            // Set tokens as HttpOnly cookies
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Strict",
                maxAge: 15 * 60 * 1000, // 15 minutes
            });
      
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            // Redirect to frontend dashboard with user data
            res.redirect(`http://localhost:3000/dashboard/user?user=${encodeURIComponent(JSON.stringify(user))}`); 
        } catch (error) {
            console.error("Callback error:", error);
            res.redirect("http://localhost:3000/login?error=Authentication failed");
        }
    }
);
//http://localhost:8000/api/v1/patients/auth/google/callback

router.route("/logout").get((req, res) => {
    req.logout();
    res.redirect("/login");
});
//http://localhost:8000/api/v1/doctors/logout

export default router;