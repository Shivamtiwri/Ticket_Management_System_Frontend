import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ticketService } from '../../services/ticket.service';
import { userService } from '../../services/user.service';
import { socketService, CommentDeletedEvent } from '../../services/socket.service';
import { useAuth } from '../../context/AuthContext';
import { UserRole, TicketStatus, Comment } from '../../types';
import { StatusBadge, PriorityBadge } from '../../components/shared/Badges';
import { Spinner } from '../../components/shared/Spinner';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { formatStatus, getAxiosErrorMessage } from '../../lib/utils';
import { AttachmentList } from '../../components/shared/AttachmentList';


function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function avatarColor(name: string) {
  const palette = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
    'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const Avatar: React.FC<{ name: string; size?: 'sm' | 'md' }> = ({ name, size = 'md' }) => {
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <span className={`${cls} ${avatarColor(name)} rounded-full inline-flex items-center justify-center font-semibold text-white flex-shrink-0 select-none`}>
      {getInitials(name)}
    </span>
  );
};


interface QuickSelectProps {
  label: string;
  currentValue: string;
  currentLabel: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
  loading?: boolean;
  accentClass?: string;
}
const QuickSelect: React.FC<QuickSelectProps> = ({
  label,
  currentValue,
  currentLabel,
  options,
  onSelect,
  loading,
  accentClass = 'bg-slate-700 text-white',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50 ${accentClass}`}
      >
        {loading
          ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          : null
        }
        <span className="opacity-70">{label}:</span>
        <span>{currentLabel}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-30 overflow-hidden">
          {options.map((o) => {
            const isActive = o.value === currentValue;
            return (
              <button
                key={o.value}
                onClick={() => { if (!isActive) onSelect(o.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors first:pt-3 last:pb-3 ${
                  isActive
                    ? 'text-blue-700 bg-blue-50 font-semibold cursor-default'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {o.label}
                {isActive && (
                  <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Section: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  accentClass?: string;
}> = ({ title, subtitle, accentClass = 'from-slate-50 to-gray-50' }) => (
  <div className={`px-5 py-4 bg-gradient-to-r ${accentClass} border-b border-gray-100 flex items-center gap-3`}>
    <div>
      <h2 className="font-semibold text-gray-900 text-sm leading-tight">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [commentText, setCommentText] = useState('');
  const [commentFiles, setCommentFiles] = useState<FileList | null>(null);
  const [isInternal, setIsInternal] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketService.getTicketById(id!),
    enabled: !!id,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => ticketService.getComments(id!),
    enabled: !!id,
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => ticketService.getTicketActivity(id!),
    enabled: !!id,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: userService.getAgents,
    enabled: user?.role === UserRole.ADMIN,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ticket', id] });
    qc.invalidateQueries({ queryKey: ['comments', id] });
    qc.invalidateQueries({ queryKey: ['activity', id] });
  };

  const addCommentMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('content', commentText);
      fd.append('isInternal', String(isInternal));
      if (commentFiles) Array.from(commentFiles).forEach((f) => fd.append('attachments', f));
      return ticketService.addComment(id!, fd);
    },
    onSuccess: () => {
      toast.success('Message sent');
      setCommentText('');
      setCommentFiles(null);
      setIsInternal(false);
      invalidate();
    },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => ticketService.updateTicket(id!, { status }),
    onSuccess: () => { toast.success('Status updated'); invalidate(); },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  const updatePriorityMutation = useMutation({
    mutationFn: (priority: string) => ticketService.updateTicket(id!, { priority }),
    onSuccess: () => { toast.success('Priority updated'); invalidate(); },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  const assignMutation = useMutation({
    mutationFn: (agentId: string) => ticketService.assignTicket(id!, agentId),
    onSuccess: () => { toast.success('Ticket assigned'); setShowAssignPanel(false); invalidate(); },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => ticketService.deleteComment(id!, commentId),
    onSuccess: () => { toast.success('Comment deleted'); setDeleteCommentId(null); invalidate(); },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  useEffect(() => {
    if (!id || !user) return;

    const handleNewComment = (comment: Comment) => {
      qc.setQueryData<Comment[]>(['comments', id], (old = []) =>
        old.some((c) => c._id === comment._id) ? old : [...old, comment]
      );
    };

    const handleDeletedComment = (payload: CommentDeletedEvent) => {
      qc.setQueryData<Comment[]>(['comments', id], (old = []) =>
        old.filter((c) => c._id !== payload.commentId)
      );
    };

    socketService.on('comment:new', handleNewComment);
    socketService.on('comment:deleted', handleDeletedComment);
    socketService.joinTicket(id);

    return () => {
      socketService.off('comment:new', handleNewComment);
      socketService.off('comment:deleted', handleDeletedComment);
      socketService.leaveTicket(id);
    };
  }, [id, user, qc]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Spinner />
        <p className="text-sm text-gray-400 animate-pulse">Loading ticket…</p>
      </div>
    );
  }
  if (!ticket) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-4xl mb-3">🎫</p>
        <p className="font-medium text-gray-600">Ticket not found</p>
      </div>
    );
  }

  const isAdmin = user?.role === UserRole.ADMIN;
  const isAgent = user?.role === UserRole.AGENT;
  const isCustomer = user?.role === UserRole.CUSTOMER;

  const allowedStatuses = (): TicketStatus[] => {
    const all = Object.values(TicketStatus);
    if (isAdmin) return all.filter((s) => s !== ticket.status);
    if (isAgent) {
      const map: Partial<Record<TicketStatus, TicketStatus[]>> = {
        [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS],
        [TicketStatus.ASSIGNED]: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_USER],
        [TicketStatus.IN_PROGRESS]: [TicketStatus.WAITING_FOR_USER, TicketStatus.RESOLVED],
        [TicketStatus.WAITING_FOR_USER]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
        [TicketStatus.RESOLVED]: [TicketStatus.IN_PROGRESS],
      };
      return map[ticket.status] ?? [];
    }
    if (isCustomer) {
      if (ticket.status === TicketStatus.WAITING_FOR_USER) return [TicketStatus.IN_PROGRESS];
      if (ticket.status === TicketStatus.RESOLVED) return [TicketStatus.CLOSED];
    }
    return [];
  };


  const transitionStatuses = allowedStatuses();
  const statusOptions = Array.from(
    new Map(
      [ticket.status, ...transitionStatuses].map((s) => [s, { value: s, label: formatStatus(s) }])
    ).values()
  );


  const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => ({
    value: p,
    label: p.charAt(0) + p.slice(1).toLowerCase(),
  }));

  const createdByName = typeof ticket.createdBy === 'object' ? ticket.createdBy.name : '—';
  const assignedName = ticket.assignedAgent
    ? (typeof ticket.assignedAgent === 'object' ? ticket.assignedAgent.name : String(ticket.assignedAgent))
    : null;
  const categoryName = typeof ticket.category === 'object' ? ticket.category.name : String(ticket.category);


  const heroGradient: Record<TicketStatus, string> = {
    OPEN: 'from-blue-600 via-blue-500 to-indigo-500',
    ASSIGNED: 'from-violet-600 via-purple-500 to-indigo-500',
    IN_PROGRESS: 'from-amber-500 via-orange-400 to-yellow-400',
    WAITING_FOR_USER: 'from-orange-500 via-amber-400 to-yellow-400',
    RESOLVED: 'from-emerald-500 via-green-400 to-teal-400',
    CLOSED: 'from-gray-500 via-slate-400 to-gray-400',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      <div className={`relative rounded-2xl bg-gradient-to-br ${heroGradient[ticket.status]} p-6 text-white shadow-lg overflow-hidden`}>
   
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium mb-3 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back
            </button>
            <h1 className="text-xl font-bold leading-snug text-white drop-shadow">{ticket.subject}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <code className="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded font-mono">{ticket.ticketId}</code>
              <span className="text-white/60 text-xs">·</span>
              <span className="text-xs text-white/70">opened {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
              {categoryName && (
                <>
                  <span className="text-white/60 text-xs">·</span>
                  <span className="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">{categoryName}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {isAdmin && (
              <button
                onClick={() => setShowAssignPanel((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-blue-700 hover:bg-blue-50 transition-all shadow-sm active:scale-95"
              >
                {ticket.assignedAgent ? '↺ Reassign' : '+ Assign Agent'}
              </button>
            )}
          </div>
        </div>

       
        {showAssignPanel && isAdmin && (
          <div className="relative mt-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-48">
              <label className="text-xs text-white/70 font-medium mb-1 block">Select Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full text-sm bg-white/90 text-gray-800 border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="">Choose an agent…</option>
                {agents.map((a) => (
                  <option key={a._id} value={a._id}>{a.name} — {a.email}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => selectedAgent && assignMutation.mutate(selectedAgent)}
              disabled={!selectedAgent || assignMutation.isPending}
              className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 disabled:opacity-50 transition-all shadow"
            >
              {assignMutation.isPending ? 'Assigning…' : 'Confirm'}
            </button>
            <button onClick={() => setShowAssignPanel(false)} className="text-white/60 hover:text-white text-sm">✕</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        <div className="lg:col-span-2 space-y-5">

         
          <Section>
            <SectionHeader
              title="Description"
              accentClass="from-slate-50 to-gray-50"
            />
            <div className="px-5 py-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
              {ticket.attachments?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dashed border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Attachments</p>
                  <AttachmentList attachments={ticket.attachments} />
                </div>
              )}
            </div>
          </Section>

       
          <Section>
            <SectionHeader
              title="Conversation"
              subtitle={`${comments.length} message${comments.length !== 1 ? 's' : ''}`}
              accentClass="from-blue-50 to-indigo-50"
            />
            <div className="px-5 py-4 space-y-4">
              {commentsLoading ? (
                <div className="flex justify-center py-8"><Spinner size="sm" /></div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">🗨️</p>
                  <p className="text-sm text-gray-400">No messages yet. Start the conversation below.</p>
                </div>
              ) : (
                comments.map((c) => {
                  const authorRole = typeof c.author === 'object' ? c.author.role : null;
                  const authorName = typeof c.author === 'object' ? c.author.name : 'Unknown';
                  const isMe = typeof c.author === 'object' && c.author._id === user?.id;
                  const isSupport = authorRole === UserRole.AGENT || authorRole === UserRole.ADMIN;

                  return (
                    <div key={c._id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <Avatar name={authorName} />
                      <div className={`flex-1 max-w-[85%] ${isMe ? 'items-end flex flex-col' : ''}`}>
                        <div className={`flex items-center gap-2 mb-1 flex-wrap ${isMe ? 'justify-end' : ''}`}>
                          <span className="text-xs font-semibold text-gray-700">{authorName}</span>
                          {isSupport && !c.isInternal && (
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Support</span>
                          )}
                          {c.isInternal && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">🔒 Internal</span>
                          )}
                          <span className="text-[10px] text-gray-400">
                            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                          </span>
                          {(isMe || isAdmin) && (
                            <button
                              onClick={() => setDeleteCommentId(c._id)}
                              className="text-[10px] text-red-400 hover:text-red-600 transition-colors ml-1"
                              title="Delete comment"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      
                        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border ${
                          c.isInternal
                            ? 'bg-amber-50 border-amber-200 text-amber-900 rounded-tl-sm'
                            : isMe
                            ? 'bg-blue-600 text-white border-transparent rounded-tr-sm'
                            : isSupport
                            ? 'bg-indigo-50 border-indigo-100 text-gray-800 rounded-tl-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-800 rounded-tl-sm'
                        }`}>
                          <p className="whitespace-pre-wrap">{c.content}</p>
                          {c.attachments?.length > 0 && (
                            <div className="mt-2">
                              <AttachmentList attachments={c.attachments} compact />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

      
            {ticket.status !== TicketStatus.CLOSED && (
              <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
                {isInternal && (
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-fit">
                    <span>🔒</span> This is an internal note — only staff can see it
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && commentText.trim()) {
                      addCommentMutation.mutate();
                    }
                  }}
                  className={`block w-full px-4 py-3 rounded-xl text-sm border placeholder-gray-400 focus:outline-none focus:ring-2 transition-all resize-none ${
                    isInternal
                      ? 'bg-amber-50 border-amber-200 focus:ring-amber-400'
                      : 'bg-white border-gray-200 focus:ring-blue-500'
                  }`}
                  placeholder={isInternal ? 'Write an internal note…' : 'Write your message… (Ctrl+Enter to send)'}
                />
                <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                      </svg>
                      <input type="file" multiple className="hidden" onChange={(e) => setCommentFiles(e.target.files)} />
                      Attach
                      {commentFiles && <span className="text-xs text-gray-400">({commentFiles.length})</span>}
                    </label>
                    {!isCustomer && (
                      <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
                        <div
                          onClick={() => setIsInternal((v) => !v)}
                          className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${isInternal ? 'bg-amber-400' : 'bg-gray-200'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isInternal ? 'translate-x-4' : ''}`} />
                        </div>
                        Internal
                      </label>
                    )}
                  </div>
                  <button
                    onClick={() => commentText.trim() && addCommentMutation.mutate()}
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-all shadow-sm active:scale-95"
                  >
                    {addCommentMutation.isPending ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.105 2.288a.75.75 0 00-.826.95l1.414 4.926A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.288z" />
                      </svg>
                    )}
                    Send
                  </button>
                </div>
              </div>
            )}
            {ticket.status === TicketStatus.CLOSED && (
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-center text-xs text-gray-400">
                This ticket is closed. No new messages can be added.
              </div>
            )}
          </Section>
          {activity.length > 0 && (
            <Section>
              <SectionHeader
                title="Activity Timeline"
                subtitle={`${activity.length} event${activity.length !== 1 ? 's' : ''}`}
                accentClass="from-purple-50 to-violet-50"
              />
              <div className="px-5 py-4">
                <div className="relative space-y-0">
                  {activity.map((a, idx) => {
                    const actorName = typeof a.actor === 'object' ? a.actor.name : 'Unknown';
                    const isLast = idx === activity.length - 1;
                    return (
                      <div key={a._id} className="flex gap-4 group">
                    
                        <div className="flex flex-col items-center w-6 flex-shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-violet-400 ring-2 ring-violet-100 mt-1 group-hover:bg-violet-600 transition-colors z-10" />
                          {!isLast && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                        </div>
                        <div className={`pb-4 flex-1 min-w-0 ${isLast ? '' : ''}`}>
                          <p className="text-sm text-gray-700 leading-snug">{a.description}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Avatar name={actorName} size="sm" />
                            <span className="text-xs text-gray-400">{actorName}</span>
                            <span className="text-gray-300 text-xs">·</span>
                            <span className="text-xs text-gray-400">{format(new Date(a.createdAt), 'MMM d, HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Section>
          )}
        </div>

       
        <div className="space-y-4">
          <Section>
            <SectionHeader
              title="Ticket Details"
              accentClass="from-slate-50 to-gray-50"
            />
            <div className="px-5 py-4 space-y-4">

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Status</p>
                {transitionStatuses.length > 0 ? (
                  <div className="relative">
                    <select
                      value={ticket.status}
                      onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                      disabled={updateStatusMutation.isPending}
                      className="w-full appearance-none text-sm font-semibold border border-gray-200 rounded-xl px-3 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 cursor-pointer"
                    >
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                      {updateStatusMutation.isPending
                        ? <span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        : <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                          </svg>
                      }
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ticket.status} />
                    <span className="text-[10px] text-gray-400 italic">no transitions available</span>
                  </div>
                )}
              </div>

             
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Priority</p>
                {(isAdmin || isAgent) && ticket.status !== TicketStatus.CLOSED ? (
                  <div className="relative">
                    <select
                      value={ticket.priority}
                      onChange={(e) => updatePriorityMutation.mutate(e.target.value)}
                      disabled={updatePriorityMutation.isPending}
                      className="w-full appearance-none text-sm font-semibold border border-gray-200 rounded-xl px-3 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 cursor-pointer"
                    >
                      {priorityOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                      {updatePriorityMutation.isPending
                        ? <span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        : <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                          </svg>
                      }
                    </div>
                  </div>
                ) : (
                  <PriorityBadge priority={ticket.priority} />
                )}
              </div>

            </div>
          </Section>

          
          <Section>
            <SectionHeader
              title="People"
              accentClass="from-indigo-50 to-blue-50"
            />
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={createdByName} />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Reported by</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{createdByName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {assignedName ? (
                  <>
                    <Avatar name={assignedName} />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">Assigned to</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{assignedName}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-sm flex-shrink-0">
                      ?
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Assigned to</p>
                      <p className="text-sm text-gray-400 italic">Unassigned</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Section>

       
          <Section>
            <SectionHeader
              title="Details"
              accentClass="from-emerald-50 to-teal-50"
            />
            <div className="px-5 py-4 divide-y divide-gray-50 text-sm">
              <div className="py-2.5 flex justify-between items-start gap-2">
                <span className="text-gray-400 text-xs font-medium flex-shrink-0">Category</span>
                <span className="text-gray-800 font-medium text-xs text-right">{categoryName}</span>
              </div>
              <div className="py-2.5 flex justify-between items-start gap-2">
                <span className="text-gray-400 text-xs font-medium flex-shrink-0">Created</span>
                <span className="text-gray-700 text-xs text-right" title={format(new Date(ticket.createdAt), 'PPpp')}>
                  {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-start gap-2">
                <span className="text-gray-400 text-xs font-medium flex-shrink-0">Updated</span>
                <span className="text-gray-700 text-xs text-right" title={format(new Date(ticket.updatedAt), 'PPpp')}>
                  {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                </span>
              </div>
              {ticket.resolvedAt && (
                <div className="py-2.5 flex justify-between items-start gap-2">
                  <span className="text-gray-400 text-xs font-medium flex-shrink-0">Resolved</span>
                  <span className="text-emerald-700 text-xs font-medium text-right">
                    {format(new Date(ticket.resolvedAt), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="py-2.5 flex flex-col gap-1.5">
                  <span className="text-gray-400 text-xs font-medium">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags.map((tag) => (
                      <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

    
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Summary</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{comments.length}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Messages</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{activity.length}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Events</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteCommentId}
        onClose={() => setDeleteCommentId(null)}
        onConfirm={() => deleteCommentId && deleteCommentMutation.mutate(deleteCommentId)}
        title="Delete Message"
        message="Are you sure you want to permanently delete this message?"
        confirmLabel="Delete"
        isDestructive
        isLoading={deleteCommentMutation.isPending}
      />
    </div>
  );
};
