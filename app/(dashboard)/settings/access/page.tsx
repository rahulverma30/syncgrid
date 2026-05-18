'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  LoadingSpinner,
  ConfirmationModal,
} from '@/components/ui';
import { Shield, ArrowLeft, Key, Trash2, Plus, Clock, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface AccessKey {
  _id: string;
  name: string;
  prefix: string;
  scope: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function SettingsAccessPage() {
  const [mounted, setMounted] = useState(false);
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState('read-only');

  // Revoke confirm modal states
  const [isRevokeConfirmOpen, setIsRevokeConfirmOpen] = useState(false);
  const [keyToRevokeId, setKeyToRevokeId] = useState<string | null>(null);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setKeys([
        {
          _id: 'k1',
          name: 'Corporate Webhook Sync Key',
          prefix: 'sg_live_79a2...',
          scope: 'read-write',
          status: 'active',
          createdAt: '2026-05-01',
          expiresAt: '2027-05-01',
        },
        {
          _id: 'k2',
          name: 'Scoping API Key',
          prefix: 'sg_live_12b8...',
          scope: 'read-only',
          status: 'active',
          createdAt: '2026-05-10',
          expiresAt: '2027-05-10',
        },
      ]);
    } catch (err) {
      toast.error('Failed to sync credentials database.');
    }
    opacity: 1;
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchKeys();
  }, []);

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) {
      toast.error('API key name is required.');
      return;
    }
    const newKeyItem: AccessKey = {
      _id: `k_${Math.random().toString(36).substr(2, 9)}`,
      name: newKeyName,
      prefix: `sg_live_${Math.random().toString(36).substr(2, 6)}...`,
      scope: newKeyScope,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
      expiresAt: '2027-05-18',
    };
    setKeys([newKeyItem, ...keys]);
    setNewKeyName('');
    toast.success('Successfully generated new SyncGrid API Access key!');
  };

  const handleRevoke = (id: string) => {
    setKeyToRevokeId(id);
    setIsRevokeConfirmOpen(true);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 select-none font-semibold">
        <Link href="/settings/roles">
          <Button variant="outline" size="sm" className="h-8 hover:bg-accent/40 text-xs gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Roles
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Security Governance Suite"
        title="Settings Access Keys"
        description="Provision new webhook access keys, generate secure API client credentials, and configure SSH scopes."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Key list */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <LoadingSpinner className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground animate-pulse font-bold tracking-wider uppercase">
                Syncing credentials...
              </p>
            </div>
          ) : (
            <Card className="bg-card/40 border border-border/60 rounded-3xl overflow-hidden backdrop-blur-md text-left">
              <div className="p-5 border-b border-border/40 select-none">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Access Tokens ({keys.length})
                </h3>
              </div>

              <div className="divide-y divide-border/40 text-xs">
                {keys.map((k) => (
                  <div key={k._id} className="p-5 flex items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 select-none">
                        <Key className="h-4 w-4 text-primary shrink-0" />
                        <h4 className="font-bold text-white truncate text-sm">{k.name}</h4>
                      </div>
                      <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-semibold select-none flex-wrap">
                        <span className="font-mono bg-background/50 border border-border/60 px-1.5 py-0.5 rounded text-white">
                          {k.prefix}
                        </span>
                        <span>
                          Scope: <span className="text-blue-400 uppercase">{k.scope}</span>
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          Expires {k.expiresAt}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleRevoke(k._id)}
                      variant="outline"
                      size="sm"
                      className="h-9 hover:bg-red-500/10 hover:text-red-500 border-border/60 shrink-0 select-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {keys.length === 0 && (
                  <div className="p-10 text-center text-slate-500 select-none">
                    No active B2B credentials detected.
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Generate Key Form */}
        <div className="space-y-6 text-left select-none">
          <Card className="bg-card/40 border border-border/60 p-5 rounded-2xl backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border/40 pb-2">
              Generate API Token
            </h3>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Key Name Label
                </label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Jenkins CI/CD Sync Key"
                  className="bg-background/40 h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Scope Level
                </label>
                <select
                  value={newKeyScope}
                  onChange={(e) => setNewKeyScope(e.target.value)}
                  className="w-full px-3 bg-background/30 border border-border/60 hover:border-primary/20 rounded-xl h-9 text-xs text-slate-300 focus:ring-0 outline-none cursor-pointer"
                >
                  <option value="read-only" className="bg-slate-950">
                    Read Only Scope
                  </option>
                  <option value="read-write" className="bg-slate-950">
                    Read & Write Scope
                  </option>
                  <option value="admin" className="bg-slate-950">
                    Full Admin Scope
                  </option>
                </select>
              </div>

              <Button
                onClick={handleGenerateKey}
                variant="default"
                size="sm"
                className="w-full text-xs h-9"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Generate Key Pair
              </Button>
            </div>
          </Card>

          <Card className="bg-primary/5 border border-primary/20 p-5 rounded-2xl backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Lock className="h-4 w-4" />
              Secured Key Storage
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              API key variables are hashed immediately using SHA-256 before storage. Ensure you copy
              the generated key string, as it will not be displayed again.
            </p>
          </Card>
        </div>
      </div>
      {/* Revoke API Key Confirmation Modal */}
      <ConfirmationModal
        isOpen={isRevokeConfirmOpen}
        onClose={() => setIsRevokeConfirmOpen(false)}
        onConfirm={() => {
          if (keyToRevokeId) {
            setKeys(keys.filter((k) => k._id !== keyToRevokeId));
            toast.error('Access token permanently revoked.');
          }
          setIsRevokeConfirmOpen(false);
        }}
        title="Revoke Access Token"
        message="Are you absolutely sure you want to permanently revoke this API access token? All services and webhooks utilizing this credentials pair will instantly fail authentication requests."
        confirmLabel="Revoke Key"
        cancelLabel="Cancel"
        type="danger"
      />
    </div>
  );
}
