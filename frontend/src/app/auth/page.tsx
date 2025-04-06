"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 xs:p-6 md:p-8">
        <div className="w-[320px] mx-auto glass rounded-[28px] p-6 md:p-8 flex flex-col items-center justify-center min-h-[320px] animate-fade-in shadow-lg hover:shadow-xl transition-all">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-400 border-t-transparent"></div>
          <p className="text-gray-400 mt-4 font-medium">Loading...</p>
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
