'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FolderDown,
  FileText,
  Download,
  Calendar,
  ShieldAlert,
  Search,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui';
import { toast } from 'sonner';

export default function PortalDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/portal/documents');
      const body = await res.json();
      if (body.success) {
        setDocuments(body.data);
      }
    } catch (err) {
      toast.error('Failed to load shared document vault.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (doc: any) => {
    if (!doc.isDownloadable) {
      toast.error('Download permission is restricted for this document.');
      return;
    }
    try {
      const res = await fetch('/api/portal/documents/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharedDocId: doc.id }),
      });
      const body = await res.json();
      if (res.ok && body.success) {
        toast.success(`Secure token authorized! Initiating audited download: ${doc.name}`);
        window.open(body.data.downloadUrl, '_blank');
      } else {
        toast.error(body.message || 'Signature authorization rejected.');
      }
    } catch (err) {
      toast.error('Network failure while requesting download signature.');
    }
  };

  const filteredDocs = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-96 rounded-xl bg-slate-900" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl bg-slate-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="space-y-1 text-left">
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <FolderDown className="w-5 h-5 text-blue-500" />
            <span>Secure Document Vault</span>
          </h1>
          <p className="text-xs text-slate-500">
            Exposed assets, contracts, proposals, NDAs, and invoices
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search vault documents..."
            className="pl-10 bg-slate-900 border-slate-800 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-blue-500/25 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <Card className="bg-slate-900/20 border-slate-850 p-12 rounded-3xl text-center">
          <EmptyState
            title="Vault Empty"
            description={
              searchQuery
                ? 'No documents matched your query search parameters.'
                : 'Your workspace document cabinet is empty.'
            }
            icon={<FolderDown className="w-12 h-12 text-slate-500" />}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <Card
              key={doc.id}
              className="bg-slate-900/40 border-slate-850 hover:border-slate-800 transition-colors rounded-2xl overflow-hidden relative group"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/15">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="flex items-center space-x-2">
                    {doc.isWatermarked && (
                      <span className="inline-flex items-center text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/15 px-2 py-0.5 rounded">
                        <ShieldAlert className="w-2.5 h-2.5 mr-1" />
                        Confidential
                      </span>
                    )}
                    {!doc.isDownloadable && (
                      <span className="inline-flex items-center text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/15 px-2 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5 mr-1" />
                        Preview Only
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                    {doc.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-medium">
                    <span className="uppercase">{doc.category}</span>
                    <span>•</span>
                    <span>{formatBytes(doc.size)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-850/60 text-xs">
                  <span className="text-slate-500 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Expires:{' '}
                      {doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString() : 'Never'}
                    </span>
                  </span>

                  <div className="flex items-center space-x-1">
                    {doc.isDownloadable ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg p-2 h-auto"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg p-2 h-auto"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
