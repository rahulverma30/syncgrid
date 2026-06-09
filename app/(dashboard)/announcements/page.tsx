'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { PageHeader, Button, Modal } from '@/components/ui';
import {
  Megaphone,
  MessageCircle,
  Heart,
  ThumbsUp,
  PartyPopper,
  Smile,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getClientError, getNetworkError, SUCCESS_MESSAGES } from '@/lib/errors';
import { formatDistanceToNow } from '@/lib/date';

export default function AnnouncementsHub() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const isManager = session?.user?.roles?.some((r: string) =>
    ['admin', 'super-admin', 'manager', 'hr'].includes(r.toLowerCase())
  );

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/protected/collaboration/announcements');
        const data = await res.json();
        if (mounted && data.success) {
          setAnnouncements(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void fetchAnnouncements();
    return () => {
      mounted = false;
    };
  }, []);

  const handlePostComment = async (announcementId: string) => {
    const content = commentInput[announcementId];
    if (!content?.trim()) return;

    try {
      const res = await fetch(
        `/api/protected/collaboration/announcements/${announcementId}/comment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setAnnouncements((prev) => prev.map((a) => (a._id === announcementId ? data.data : a)));
        setCommentInput((prev) => ({ ...prev, [announcementId]: '' }));
      }
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  const handleToggleReaction = async (announcementId: string, emoji: string) => {
    try {
      const res = await fetch(
        `/api/protected/collaboration/announcements/${announcementId}/react`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setAnnouncements((prev) => prev.map((a) => (a._id === announcementId ? data.data : a)));
      }
    } catch (err) {
      toast.error('Failed to react');
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      const res = await fetch('/api/protected/collaboration/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Announcement published globally!');
        setAnnouncements([data.data, ...announcements]);
        setIsModalOpen(false);
        setNewTitle('');
        setNewContent('');
      } else {
        toast.error(data.message || 'Failed to create announcement');
      }
    } catch (err) {
      toast.error('Failed to create announcement');
    }
  };

  const REACTION_EMOJIS = ['👍', '❤️', '🎉', '🔥', '👀'];

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-end">
        <PageHeader
          eyebrow="Company Communication Hub"
          title="Global Announcements"
          description="Stay updated with the latest company news, updates, and global broadcasts."
        />
        {isManager && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 rounded-xl">
            <Megaphone className="w-4 h-4" />
            Publish Announcement
          </Button>
        )}
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-8 pb-12">
        {loading ? (
          <div className="text-center text-muted-foreground p-12">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center p-12 border border-border/50 rounded-2xl bg-card/50 backdrop-blur-md">
            <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-bold">No Announcements Yet</h3>
            <p className="text-muted-foreground text-sm mt-2">
              When leadership publishes updates, they will appear here.
            </p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann._id}
              className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/40">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-foreground">{ann.title}</h2>
                  <span className="text-xs text-muted-foreground bg-accent/40 px-3 py-1 rounded-full font-medium">
                    {formatDistanceToNow(new Date(ann.createdAt))}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {ann.authorId?.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {ann.authorId?.name || 'Admin'}
                    </div>
                    <div className="text-xs text-muted-foreground">Company Leadership</div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {ann.content}
              </div>

              {/* Interaction Bar */}
              <div className="px-6 py-3 bg-muted/20 border-t border-border/40 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {REACTION_EMOJIS.map((emoji) => {
                    const count = ann.reactions?.filter((r: any) => r.emoji === emoji).length || 0;
                    const hasReacted = ann.reactions?.some(
                      (r: any) => r.emoji === emoji && r.userId === currentUserId
                    );
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(ann._id, emoji)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${
                          hasReacted
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-background hover:bg-accent border border-border/60 text-muted-foreground'
                        }`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="font-semibold">{count}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground ml-auto flex items-center gap-1.5 font-medium">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {ann.comments?.length || 0} Comments
                </div>
              </div>

              {/* Comments Section */}
              <div className="bg-background/40 p-6 border-t border-border/40 space-y-4">
                {ann.comments?.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {ann.comments.map((comment: any, idx: number) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold shrink-0">
                          {comment.authorId?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="bg-card border border-border/40 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm w-full">
                          <div className="flex justify-between items-end mb-1">
                            <span className="font-semibold text-foreground text-xs">
                              {comment.authorId?.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt))}
                            </span>
                          </div>
                          <p className="text-foreground/80">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {session?.user?.name?.charAt(0) || 'M'}
                  </div>
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentInput[ann._id] || ''}
                    onChange={(e) =>
                      setCommentInput({ ...commentInput, [ann._id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePostComment(ann._id);
                    }}
                    className="flex-1 bg-card border border-border/60 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePostComment(ann._id)}
                    className="rounded-full px-4"
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publish Global Announcement"
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Headline</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Q3 Townhall Update"
              className="w-full rounded-md border border-border bg-slate-950/40 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">
              Message Content
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write your announcement..."
              className="w-full rounded-md border border-border bg-slate-950/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary h-32 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="py-1">
              Cancel
            </Button>
            <Button
              onClick={handleCreateAnnouncement}
              disabled={!newTitle.trim() || !newContent.trim()}
              className="py-1"
            >
              Publish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
