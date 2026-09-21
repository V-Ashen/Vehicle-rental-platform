import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Plus, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { parseFirestoreDate } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";
import AddDocumentModal from "./AddDocumentModal";

interface VehicleDocumentsTabProps {
  vehicleId: string;
}

export default function VehicleDocumentsTab({ vehicleId }: VehicleDocumentsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["owner-vehicle-documents", vehicleId],
    queryFn: async () => {
      const res = await apiClient.get(`/vehicles/${vehicleId}/documents`);
      return res.data.data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>;
      case 'EXPIRED': return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentTypeName = (type: string) => {
    switch(type) {
      case 'INSURANCE': return 'Insurance';
      case 'REVENUE': return 'Revenue License';
      case 'EMISSION': return 'Emission Test';
      case 'OTHER': return 'Other Document';
      default: return type;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-indigo-600" />
            Vehicle Documents
          </h3>
          <p className="text-sm text-slate-500">Manage insurance, licenses, and other regulatory documents.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Document Number</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Attachment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
                      <p className="text-sm text-slate-500">Loading documents...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !documents || documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">No documents found</p>
                    <p>Upload insurance or license records for this vehicle.</p>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc: any) => (
                  <TableRow 
                    key={doc.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      {getDocumentTypeName(doc.documentType)}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {doc.documentNumber}
                    </TableCell>
                    <TableCell>
                      {format(parseFirestoreDate(doc.issueDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(parseFirestoreDate(doc.expiryDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(doc.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </a>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddDocumentModal 
        vehicleId={vehicleId} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
