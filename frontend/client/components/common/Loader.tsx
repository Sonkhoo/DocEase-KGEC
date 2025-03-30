"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";

export default function LoadingWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") {
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // Show loader for 3 seconds

    return () => clearTimeout(timer);
  }, [pathname]);

  if (loading && pathname === "/") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-r from-green-400 to-green-600 z-50">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
          style={{ perspective: "1000px" }}
        >
          <motion.div
            className="relative w-20 h-20 flex items-center justify-center shadow-2xl rounded-full bg-white"
            animate={{ scale: [1, 1.2, 1], rotateY: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <HeartPulse className="w-16 h-16 text-green-700" />
          </motion.div>
          <motion.p
            className="mt-4 text-lg font-semibold text-white drop-shadow-lg"
            animate={{ opacity: [0.5, 1, 0.5], translateZ: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ transform: "translateZ(10px)" }}
          >
            Loading Health Data...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}