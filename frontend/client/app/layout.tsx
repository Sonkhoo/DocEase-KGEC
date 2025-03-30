import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./provider";
import { AuthProvider } from "./_context/Authcontext";
import { DoctorAuthProvider } from "./_context/Doctorcontext";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css"; 
import FloatingChatButton from "@/components/FloatingChatButton";
import { UserProvider } from "./_context/UserContext"
import Navbar from "@/components/common/navbar";
import LoadingWrapper from "@/components/common/Loader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocEase",
  description: "Your Medical Records Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LoadingWrapper>
        <UserProvider>
          <Providers><DoctorAuthProvider><AuthProvider> <Navbar/>{children}
            <FloatingChatButton/>
          </AuthProvider></DoctorAuthProvider></Providers>
        </UserProvider>
        </LoadingWrapper>
      </body>
    </html>
  );
}
