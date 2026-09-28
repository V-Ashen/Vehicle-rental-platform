"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Mail, Send, History, Eye, LayoutTemplate } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type EmailTemplate = {
  type: string;
  subject: string;
  html: string;
};

type EmailHistory = {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  type: string;
  subject: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};

export default function AdminEmailsPage() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/emails/templates");
      return res.data.data as EmailTemplate[];
    },
  });

  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["admin-email-history"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/emails/history");
      return res.data.data as EmailHistory[];
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

  if (isLoadingTemplates || isLoadingHistory) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const paginatedHistory = history.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(history.length / rowsPerPage);

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

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="mb-6 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="templates" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <Mail className="w-4 h-4 mr-2" />
            Mail Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900">
            <History className="w-4 h-4 mr-2" />
            Mail History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => {
              const formattedTitle = template.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              return (
                <Card key={template.type} className="group border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Stylized Thumbnail Area */}
                  <div 
                    onClick={() => openPreview(template)}
                    className="h-32 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-900/20 relative flex items-center justify-center cursor-pointer overflow-hidden border-b border-slate-100 dark:border-slate-800/50"
                  >
                    <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/20 bg-[size:16px_16px]" />
                    <LayoutTemplate className="w-12 h-12 text-indigo-300 dark:text-indigo-700/50 relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-indigo-600/10 dark:bg-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px] z-20">
                      <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <Eye className="w-4 h-4" />
                        Preview
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-5 flex flex-col flex-grow">
                    <div className="mb-4">
                      <Badge variant="secondary" className="mb-2 w-fit text-[10px] uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        Email Template
                      </Badge>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight mb-1">
                        {formattedTitle}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2" title={template.subject}>
                        {template.subject}
                      </p>
                    </div>

                    <div className="mt-auto pt-4 flex gap-2">
                      <Button 
                        onClick={() => openPreview(template)}
                        variant="outline" 
                        className="flex-1 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Eye className="w-4 h-4 mr-2 text-slate-500" />
                        View
                      </Button>
                      <Button 
                        onClick={() => openTestDialog(template)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 rounded-t-xl">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Recent Dispatches</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Tenant ID</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        No mail history found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedHistory.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium text-slate-900 dark:text-white">{h.type}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={h.subject}>{h.subject}</TableCell>
                        <TableCell>{h.tenantId || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{h.userName || h.userId || "N/A"}</span>
                            {h.userName && h.userName !== h.userId && (
                              <span className="text-xs text-slate-500">{h.userId}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={h.status === 'SENT' ? 'default' : h.status === 'FAILED' ? 'destructive' : h.status === 'CANCELLED' ? 'secondary' : 'outline'}>
                            {h.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 whitespace-nowrap">
                          {new Date(h.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-red-500" title={h.errorMessage || ""}>
                          {h.errorMessage || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-sm text-slate-500">
                  Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, history.length)} of {history.length} entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm font-medium px-2">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

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
