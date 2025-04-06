"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const { isAuthenticated, isLoading, isNewUser } = useAuth();
  const router = useRouter();

  // State to track navigation in progress
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Redirect based on authentication and user status
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setIsNavigating(true);
      if (isNewUser) {
        // If user is new, redirect to onboarding
        router.push("/auth/onboarding");
      } else {
        // If user is authenticated and not new, redirect to home
        router.push("/");
      }
    }
  }, [isAuthenticated, isLoading, isNewUser, router]);

  // Show loading state while checking authentication or during navigation
  if (isLoading || isNavigating) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 xs:p-6 md:p-8">
        <div className="w-[320px] mx-auto glass rounded-[28px] p-6 md:p-8 flex flex-col items-center justify-center min-h-[320px] animate-fade-in shadow-lg hover:shadow-xl transition-all">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-400 border-t-transparent"></div>
          <p className="text-gray-400 mt-4 font-medium">
            {isNavigating 
              ? (isNewUser ? "Preparing onboarding..." : "Redirecting to app...") 
              : "Loading..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 xs:p-6 md:p-8">
      <AuthForm />
    </main>
  );
}
