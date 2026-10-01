"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Mail, Send, History, Eye, LayoutTemplate } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type EmailTemplate = { type: string; subject: string; html: string };
type EmailHistory = {
  id: string; tenantId: string; userId: string; userName?: string;
  type: string; subject: string; status: string; errorMessage: string | null; createdAt: string;
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
      toast({ title: "Test Email Sent", description: `Successfully dispatched test email to ${testEmail}` });
      setIsTestDialogOpen(false);
      setTestEmail("");
    },
    onError: (error: any) => {
      toast({ title: "Test Email Failed", description: error.response?.data?.message || "Failed to send test email.", variant: "destructive" });
    },
  });

  const handleSendTest = () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (selectedTemplate) testEmailMutation.mutate({ email: testEmail, type: selectedTemplate.type });
  };

  const paginatedHistory = history.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(history.length / rowsPerPage);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-indigo-400" />
          </div>
          Email Center
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">Preview system email templates and dispatch test emails.</p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 h-auto mb-6">
          <TabsTrigger value="templates" className="rounded-lg data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-4 py-2 text-sm font-medium transition-all">
            <LayoutTemplate className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-4 py-2 text-sm font-medium transition-all">
            <History className="w-4 h-4 mr-2" />
            Mail History
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-0">
          {isLoadingTemplates ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {templates.map((template) => {
                const formattedTitle = template.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return (
                  <div key={template.type} className="group bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-2xl overflow-hidden flex flex-col hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-0.5">
                    {/* Thumbnail */}
                    <div
                      onClick={() => { setPreviewTemplate(template); setIsPreviewDialogOpen(true); }}
                      className="h-32 bg-gradient-to-br from-indigo-950/50 to-slate-800/50 relative flex items-center justify-center cursor-pointer overflow-hidden border-b border-slate-800/60"
                    >
                      <LayoutTemplate className="w-12 h-12 text-indigo-700/60 relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:text-indigo-400" />
                      <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 flex items-center justify-center transition-all z-20">
                        <div className="bg-white/90 text-slate-900 px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </div>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      <Badge className="mb-2 w-fit text-[10px] uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Template</Badge>
                      <h3 className="font-bold text-sm text-slate-100 leading-tight mb-1">{formattedTitle}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">{template.subject}</p>

                      <div className="mt-auto flex gap-2">
                        <Button
                          onClick={() => { setPreviewTemplate(template); setIsPreviewDialogOpen(true); }}
                          variant="outline" size="sm"
                          className="flex-1 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg h-8 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                        </Button>
                        <Button
                          onClick={() => { setSelectedTemplate(template); setIsTestDialogOpen(true); }}
                          size="sm"
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm rounded-lg h-8 text-xs"
                        >
                          <Send className="w-3.5 h-3.5 mr-1.5" /> Test
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-0">
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/60 hover:bg-transparent">
                  {['Type', 'Subject', 'Tenant', 'Recipient', 'Status', 'Date', 'Error'].map(h => (
                    <TableHead key={h} className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4 first:pl-6">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingHistory ? (
                  <TableRow><TableCell colSpan={7} className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" /></TableCell></TableRow>
                ) : history.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="text-center py-16">
                      <History className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm font-medium">No mail history found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedHistory.map((h) => (
                    <TableRow key={h.id} className="border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <span className="text-xs font-mono text-indigo-400">{h.type}</span>
                      </TableCell>
                      <TableCell className="py-4 max-w-[160px] truncate text-sm text-slate-300" title={h.subject}>{h.subject}</TableCell>
                      <TableCell className="py-4 text-xs text-slate-500 font-mono">{h.tenantId?.substring(0, 10) || 'N/A'}...</TableCell>
                      <TableCell className="py-4">
                        <p className="text-sm text-slate-300">{h.userName || h.userId || 'N/A'}</p>
                        {h.userName && h.userName !== h.userId && <p className="text-xs text-slate-600">{h.userId}</p>}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className={
                          h.status === 'SENT' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs' :
                          h.status === 'FAILED' ? 'bg-rose-500/15 text-rose-400 border-rose-500/20 text-xs' :
                          'bg-slate-700/50 text-slate-400 border-slate-600/50 text-xs'
                        }>{h.status}</Badge>
                      </TableCell>
                      <TableCell className="py-4 text-xs text-slate-500 whitespace-nowrap">{new Date(h.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="py-4 max-w-[140px] truncate text-xs text-rose-400" title={h.errorMessage || ''}>{h.errorMessage || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, history.length)} of {history.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg disabled:opacity-40">Previous</Button>
                  <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg disabled:opacity-40">Next</Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Test Email Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Send Test Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-400">
              Send a test dispatch of <strong className="text-indigo-400">{selectedTemplate?.type}</strong> to an email address.
            </p>
            <Input
              type="email"
              placeholder="Enter test email address..."
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendTest()}
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 rounded-xl"
            />
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
              disabled={testEmailMutation.isPending || !testEmail}
              onClick={handleSendTest}
            >
              {testEmailMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Send className="mr-2 h-4 w-4" />Dispatch Test</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-3xl h-[80vh] bg-white flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{previewTemplate?.subject}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow w-full overflow-auto bg-slate-100">
            {previewTemplate && (
              <iframe srcDoc={previewTemplate.html} className="w-full h-full" style={{ border: "none" }} title="Full Preview" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
