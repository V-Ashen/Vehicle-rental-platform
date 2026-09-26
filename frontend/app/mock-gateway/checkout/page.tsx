"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, CreditCard, ShieldCheck } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function MockGatewayCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  
  const orderId = searchParams?.get("order_id") || "UNKNOWN_ORDER";
  const amount = searchParams?.get("amount") || "0.00";
  const currency = searchParams?.get("currency") || "LKR";

  const handlePayment = async (isSuccess: boolean) => {
    setIsProcessing(true);
    
    try {
      // Simulate real-world gateway delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Hit our backend webhook directly to simulate the payment gateway callback
      await apiClient.post("/webhooks/payments", {
        order_id: orderId,
        transaction_id: `MOCK-TXN-${Math.floor(Math.random() * 1000000)}`,
        status: isSuccess ? 2 : -1
      });
      
      setStatus(isSuccess ? "success" : "error");
      
      // Auto redirect back to billing dashboard after 3 seconds
      setTimeout(() => {
        router.push("/owner/billing");
      }, 3000);
      
    } catch (error) {
      toast({
        title: "Webhook Failed",
        description: "Could not reach the backend webhook endpoint.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center space-x-2 font-bold tracking-wider">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>MOCK PAY GATEWAY</span>
          </div>
          <span className="text-xs text-slate-400 uppercase tracking-widest">Test Mode</span>
        </div>
        
        {status === "idle" && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">Complete Payment</CardTitle>
              <CardDescription>
                You are paying <strong>Vehicle Rental SaaS</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-slate-100 p-4 rounded-lg flex justify-between items-center border border-slate-200">
                <span className="text-slate-500 font-medium">Total Amount</span>
                <span className="text-2xl font-black text-slate-900">{currency} {parseFloat(amount).toLocaleString()}</span>
              </div>
              
              <div className="text-sm text-slate-500 text-center">
                Order ID: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">{orderId}</code>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm text-center">
                This is a mock gateway for testing purposes. No real money will be deducted.
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-3">
              <Button 
                onClick={() => handlePayment(true)} 
                disabled={isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg font-bold"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Simulate Successful Payment"}
              </Button>
              <Button 
                onClick={() => handlePayment(false)} 
                disabled={isProcessing}
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-12"
              >
                Simulate Failed Payment
              </Button>
            </CardFooter>
          </>
        )}

        {status === "success" && (
          <div className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900">Payment Successful!</h2>
            <p className="text-slate-500">The webhook has been fired. Redirecting you back to the application...</p>
            <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mt-4" />
          </div>
        )}

        {status === "error" && (
          <div className="p-8 text-center space-y-4">
            <XCircle className="w-20 h-20 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900">Payment Failed</h2>
            <p className="text-slate-500">The webhook has been fired with a failure status. Redirecting...</p>
            <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mt-4" />
          </div>
        )}
      </Card>
    </div>
  );
}
