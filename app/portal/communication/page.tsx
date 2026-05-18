'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Megaphone,
  Pin,
  User,
  Calendar,
  Send,
  Loader2,
  ThumbsUp,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui';
import { toast } from 'sonner';

export default function PortalCommunicationPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch('/api/portal/announcements');
      const body = await res.json();
      if (body.success) {
        setAnnouncements(body.data);
      }

      // Load discussion messages - we will simulate comments for the general chat thread
      // by generating static items combined with user additions from sessionStorage!
      const stored = sessionStorage.getItem('portal_discussion_messages');
      if (stored) {
        setComments(JSON.parse(stored));
      } else {
        const defaultMsgs = [
          {
            authorName: 'Pepper Potts (Account Manager)',
            authorType: 'internal-user',
            content:
              'Welcome to your project discussions room! Feel free to raise questions, request visual reviews, or discuss sprint revisions directly in this thread with our engineers.',
            createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
          },
          {
            authorName: 'Tony Stark (Super Admin)',
            authorType: 'internal-user',
            content:
              'We uploaded the latest staging environment URL inside the approvals dashboard. Take a look at the milestone signoff!',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          },
        ];
        setComments(defaultMsgs);
        sessionStorage.setItem('portal_discussion_messages', JSON.stringify(defaultMsgs));
      }
    } catch (err) {
      toast.error('Failed to load communication space.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);

    // Retrieve verified session details to know the poster's identity
    try {
      const verifyRes = await fetch('/api/portal/auth/verify');
      const verifyBody = await verifyRes.json();

      if (verifyBody.success) {
        const userName = verifyBody.data.name;

        const added = [
          ...comments,
          {
            authorName: `${userName} (Client User)`,
            authorType: 'client-user',
            content: newComment,
            createdAt: new Date().toISOString(),
          },
        ];

        setComments(added);
        sessionStorage.setItem('portal_discussion_messages', JSON.stringify(added));
        setNewComment('');
        toast.success('Message posted successfully!');
      }
    } catch (error) {
      toast.error('Failed to authenticate and post message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl bg-slate-900" />
          ))}
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-full rounded-2xl bg-slate-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Announcements channel list */}
      <div className="space-y-4">
        <div className="space-y-1 text-left">
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-blue-500" />
            <span>Agency Broadcasts</span>
          </h1>
          <p className="text-xs text-slate-500">Official company announcements & releases</p>
        </div>

        {announcements.length === 0 ? (
          <Card className="bg-slate-900/20 border-slate-850 p-8 rounded-2xl text-center">
            <p className="text-xs text-slate-500 italic">No broadcasts shared currently.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <Card
                key={ann._id}
                className="bg-slate-900/40 border-slate-850 p-5 rounded-2xl relative overflow-hidden text-left hover:border-slate-850 transition-colors"
              >
                {ann.isPinned && (
                  <Pin className="absolute top-4 right-4 w-3.5 h-3.5 text-blue-400 rotate-45" />
                )}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white pr-6">{ann.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{ann.content}</p>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-850/60">
                    <span className="flex items-center space-x-1">
                      <User className="w-3 h-3 text-blue-500" />
                      <span>{ann.publishedBy}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* General discussion thread column */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-slate-900/40 border-slate-850 rounded-3xl p-6 lg:p-8 space-y-6 flex flex-col h-[640px]">
          <div className="border-b border-slate-850 pb-4 text-left">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span>Workspace Discussions</span>
            </h2>
            <p className="text-xs text-slate-500">
              Collaborative board with internal project leads
            </p>
          </div>

          {/* Chat Messages container (flexible sizing) */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {comments.map((msg, index) => {
              const isClient = msg.authorType === 'client-user';
              return (
                <div
                  key={index}
                  className={`flex flex-col max-w-[85%] ${isClient ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                >
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 pb-1 font-semibold">
                    <span>{msg.authorName}</span>
                    <span>•</span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed text-left ${
                      isClient
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-950/40 border border-slate-850 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input text-box */}
          <div className="space-y-3 pt-4 border-t border-slate-850">
            <div className="flex space-x-2 items-center">
              <Textarea
                placeholder="Post your feedback, question, or message to the team..."
                className="bg-slate-950/40 border-slate-850 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-blue-500/25 rounded-2xl p-4 h-16 min-h-16 flex-1 text-xs"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting}
              />
              <Button
                className="bg-blue-600 hover:bg-blue-500 text-white p-4 h-16 w-16 rounded-2xl border-0 shadow-lg shadow-blue-600/10 flex items-center justify-center"
                onClick={handlePostComment}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
