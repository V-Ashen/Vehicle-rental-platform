"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type EmailTemplate = {
  type: string;
  subject: string;
  html: string;
};

export default function AdminEmailsPage() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/emails/templates");
      return res.data.data as EmailTemplate[];
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (payload: { email: string; type: string }) => {
      return apiClient.post("/admin/emails/test", payload);
    },
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: `Successfully dispatched test email to ${testEmail}`,
      });
      setIsTestDialogOpen(false);
      setTestEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Test Email Failed",
        description: error.response?.data?.message || "Failed to send test email.",
        variant: "destructive",
      });
    },
  });

  const openTestDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsTestDialogOpen(true);
  };

  const handleSendTest = () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    if (selectedTemplate) {
      testEmailMutation.mutate({ email: testEmail, type: selectedTemplate.type });
    }
  };

  const openPreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
          <Mail className="mr-3 h-8 w-8 text-indigo-600" />
          Email Templates
        </h1>
        <p className="text-slate-500 mt-2">
          Preview system email templates and dispatch test emails.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.type} className="border-slate-200 dark:border-slate-800 flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-t-xl">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {template.type}
              </CardTitle>
              <p className="text-sm text-slate-500 truncate" title={template.subject}>
                Subject: {template.subject}
              </p>
            </CardHeader>
            <CardContent className="p-6 flex flex-col gap-4 flex-grow">
              <div 
                className="w-full h-40 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-lg relative cursor-pointer group"
                onClick={() => openPreview(template)}
              >
                <div className="absolute inset-0 bg-slate-900/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">Click to Preview</span>
                </div>
                <iframe 
                  srcDoc={template.html} 
                  className="w-full h-full pointer-events-none origin-top-left scale-[0.4] w-[250%] h-[250%]"
                  style={{ border: "none" }}
                  title={`Preview of ${template.type}`}
                />
              </div>
              <Button 
                onClick={() => openTestDialog(template)}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Test Delivery
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Email Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500">
              Send a test payload of <strong>{selectedTemplate?.type}</strong> to an email address.
            </p>
            <Input
              type="email"
              placeholder="Enter test email address..."
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendTest()}
            />
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={testEmailMutation.isPending || !testEmail}
              onClick={handleSendTest}
            >
              {testEmailMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Dispatch Test
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-3xl h-[80vh] bg-white flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{previewTemplate?.subject}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow w-full h-full bg-slate-100 overflow-auto">
            {previewTemplate && (
              <iframe
                srcDoc={previewTemplate.html}
                className="w-full h-full"
                style={{ border: "none" }}
                title="Full Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
