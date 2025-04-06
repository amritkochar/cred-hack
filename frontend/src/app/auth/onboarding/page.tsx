"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BankStatementUpload from "@/components/auth/BankStatementUpload";

export default function OnboardingPage() {
  const { isAuthenticated, isLoading, isNewUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
      return;
    }

    // If user is authenticated but not a new user, redirect to home
    if (!isLoading && isAuthenticated && !isNewUser) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, isLoading, isNewUser, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <BankStatementUpload />
    </div>
  );
}
