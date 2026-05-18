'use client';

import React, { useState } from 'react';
import { useKnowledgeStore } from '@/store';
import { MessageSquare, Send, User } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/date';

export function CommentThreads() {
  const { activeDocument, postComment } = useKnowledgeStore();
  const [commentContent, setCommentContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  if (!activeDocument) return null;

  const comments = activeDocument.comments || [];

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || isPosting) return;

    setIsPosting(true);
    const success = await postComment(activeDocument._id, commentContent.trim());
    setIsPosting(false);
    if (success) {
      setCommentContent('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/20 border border-border/20 rounded-xl overflow-hidden backdrop-blur-md">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/30 bg-slate-950/40">
        <MessageSquare className="h-4 w-4 text-emerald-400" />
        <span className="text-sm font-semibold text-slate-200">Page Discussions</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded bg-slate-900 border border-border/40 text-slate-400 font-mono">
          {comments.length}
        </span>
      </div>

      {/* Dynamic comments feed timeline */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[150px]">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 italic text-xs">
            <span>No discussions started yet.</span>
            <span className="text-[10px] text-slate-600 mt-1">Post a review comment below.</span>
          </div>
        ) : (
          comments.map((comment: any, idx: number) => {
            const senderName = comment.senderId?.name || 'Collaborator';
            return (
              <div key={idx} className="flex flex-col gap-1 bg-slate-900/30 border border-border/10 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-slate-950/60 border border-border flex items-center justify-center text-slate-400">
                    <User className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">{senderName}</span>
                  <span className="text-[9px] text-slate-500 font-mono ml-auto">
                    {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt)) + ' ago' : 'now'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-7 break-words whitespace-pre-line">{comment.content}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Editor Comment Post Form Box */}
      <form onSubmit={handlePostComment} className="border-t border-border/20 p-4 bg-slate-950/30 flex gap-2">
        <input
          type="text"
          placeholder="Ask a question or request review..."
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          className="flex-1 bg-slate-900/60 border border-border/40 hover:border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none placeholder-slate-600 transition-colors"
        />
        <button
          type="submit"
          disabled={isPosting || !commentContent.trim()}
          className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 disabled:opacity-40 transition-opacity"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
