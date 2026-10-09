import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ticketService } from '../../services/ticket.service';
import { userService } from '../../services/user.service';
import { socketService, CommentDeletedEvent } from '../../services/socket.service';
import { useAuth } from '../../context/AuthContext';
import { UserRole, TicketStatus, TicketPriority, Comment } from '../../types';
import { StatusBadge, PriorityBadge } from '../../components/shared/Badges';
import { Spinner } from '../../components/shared/Spinner';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { formatStatus, getAxiosErrorMessage } from '../../lib/utils';
import { AttachmentList } from '../../components/shared/AttachmentList';

const COMMENT_MAX_LENGTH = 5000;

function getInitials(name: string) {
  return name
    .split(' ')
    .filter((n) => n.length > 0)
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


const Section: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
}> = ({ title, subtitle }) => (
  <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4">
    <div>
      <h2 className="text-sm font-semibold leading-tight text-gray-900">{title}</h2>
      {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
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
  const conversationRef = useRef<HTMLDivElement>(null);
  const shouldStickToLatest = useRef(true);

  const {
    data: ticket,
    isLoading,
    isError: ticketError,
    error: ticketLoadError,
    refetch: refetchTicket,
  } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketService.getTicketById(id!),
    enabled: !!id,
    retry: (failureCount, err) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      return status !== 404 && failureCount < 2;
    },
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

  useEffect(() => {
    const conversation = conversationRef.current;
    if (!commentsLoading && shouldStickToLatest.current && conversation) {
      conversation.scrollTop = conversation.scrollHeight;
    }
  }, [comments, commentsLoading]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ticket', id] });
    qc.invalidateQueries({ queryKey: ['comments', id] });
    qc.invalidateQueries({ queryKey: ['activity', id] });
    qc.invalidateQueries({ queryKey: ['tickets'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
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

    const handleTicketError = (payload: { message?: string }) => {
      toast.error(payload?.message || 'Unable to update the ticket room');
    };

    socketService.on('comment:new', handleNewComment);
    socketService.on('comment:deleted', handleDeletedComment);
    socketService.on('ticket:error', handleTicketError);
    socketService.joinTicket(id);

    return () => {
      socketService.off('comment:new', handleNewComment);
      socketService.off('comment:deleted', handleDeletedComment);
      socketService.off('ticket:error', handleTicketError);
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
  if (ticketError) {
    const status = (ticketLoadError as { response?: { status?: number } })?.response?.status;
    return (
      <div className="text-center py-24">
        <p className="text-4xl mb-3">🎫</p>
        <p className="font-medium text-gray-600 mb-1">
          {status === 404 ? 'Ticket not found' : 'Failed to load ticket'}
        </p>
        <p className="text-sm text-gray-400 mb-4">
          {status === 404
            ? 'It may have been deleted, or you do not have access to it.'
            : getAxiosErrorMessage(ticketLoadError, 'Something went wrong while loading this ticket.')}
        </p>
        <button type="button" onClick={() => refetchTicket()} className="btn-secondary text-sm px-4 py-2">
          Try again
        </button>
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


  const priorityOptions = Object.values(TicketPriority).map((p) => ({
    value: p,
    label: p.charAt(0) + p.slice(1).toLowerCase(),
  }));

  const createdByName = typeof ticket.createdBy === 'object' ? ticket.createdBy.name : '—';
  const assignedName = ticket.assignedAgent
    ? (typeof ticket.assignedAgent === 'object' ? ticket.assignedAgent.name : String(ticket.assignedAgent))
    : null;
  const categoryName = typeof ticket.category === 'object' ? ticket.category.name : String(ticket.category);
  const orderedComments = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );


  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back
            </button>
            <h1 className="break-words text-xl font-bold leading-snug text-gray-900 sm:text-2xl">{ticket.subject}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs text-gray-600">{ticket.ticketId}</code>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Opened {format(new Date(ticket.createdAt), 'MMM d, yyyy')} <span className="mx-1 text-gray-300">·</span>
              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              {categoryName && <><span className="mx-1 text-gray-300">·</span>{categoryName}</>}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowAssignPanel((v) => !v)}
                className="btn-secondary text-sm"
              >
                {ticket.assignedAgent ? 'Reassign agent' : 'Assign agent'}
              </button>
            )}
          </div>
        </div>

        {showAssignPanel && isAdmin && (
          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-end">
            <div className="min-w-48 flex-1">
              <label className="label" htmlFor="assign-agent">Select agent</label>
              <select
                id="assign-agent"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="input"
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
              className="btn-primary"
            >
              {assignMutation.isPending ? 'Assigning…' : 'Confirm assignment'}
            </button>
            <button onClick={() => setShowAssignPanel(false)} className="btn-secondary">Cancel</button>
          </div>
        )}
      </header>

      <div className="grid min-w-0 grid-cols-1 gap-5">
        
        <div className="grid min-w-0 grid-cols-1 content-start gap-5 lg:grid-cols-2">

         
          <Section className="lg:col-span-2">
            <SectionHeader
              title="Description"
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

       
          
        </div>

       
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Section>
            <SectionHeader
              title="Ticket Details"
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

    
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900 mb-4">Summary</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{comments.length}</p>
                <p className="mt-1 text-xs text-gray-500">Messages</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{activity.length}</p>
                <p className="mt-1 text-xs text-gray-500">Events</p>
              </div>
            </div>
          </div>
        </div><div className="grid min-w-0 grid-cols-1 content-start gap-5 lg:grid-cols-2"><Section className="flex h-[500px] min-h-0 min-w-0 flex-col">
            <SectionHeader
              title="Conversation"
              subtitle={`${comments.length} message${comments.length !== 1 ? 's' : ''}`}
            />
            <div
              ref={conversationRef}
              onScroll={(event) => {
                const element = event.currentTarget;
                shouldStickToLatest.current =
                  element.scrollHeight - element.scrollTop - element.clientHeight < 48;
              }}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
              aria-label="Conversation messages"
            >
              {commentsLoading ? (
                <div className="flex justify-center py-8"><Spinner size="sm" /></div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">🗨️</p>
                  <p className="text-sm text-gray-400">No messages yet. Start the conversation below.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {orderedComments.map((c) => {
                    const authorRole = typeof c.author === 'object' ? c.author.role : null;
                    const authorName = typeof c.author === 'object' ? c.author.name : 'Unknown';
                    const isMe = typeof c.author === 'object' && c.author._id === user?.id;
                    const isSupport = authorRole === UserRole.AGENT || authorRole === UserRole.ADMIN;

                    return (
                      <div key={c._id} className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && <Avatar name={authorName} size="sm" />}
                        <div className={`flex min-w-0 max-w-[85%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs font-semibold text-gray-700">{isMe ? 'You' : authorName}</span>
                            {!isMe && (
                              <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                                {isSupport ? 'Support' : 'Incoming'}
                              </span>
                            )}
                            {isSupport && !c.isInternal && (
                              <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                                {authorRole === UserRole.ADMIN ? 'Admin' : 'Agent'}
                              </span>
                            )}
                            {c.isInternal && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">Internal note</span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              {format(new Date(c.createdAt), 'MMM d, yyyy · h:mm a')}
                            </span>
                            {(isMe || isAdmin) && (
                              <button
                                onClick={() => setDeleteCommentId(c._id)}
                                className="ml-1 text-[10px] font-medium text-red-500 hover:text-red-700"
                                title="Delete comment"
                              >
                                Delete
                              </button>
                            )}
                          </div>

                          <div className={`max-w-full break-words rounded-xl border px-4 py-3 text-sm leading-relaxed ${
                            c.isInternal
                              ? 'border-amber-200 bg-amber-50 text-amber-900'
                              : isMe
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-gray-200 bg-gray-100 text-gray-800'
                          }`}>
                            <p className="whitespace-pre-wrap">{c.content}</p>
                            {c.attachments?.length > 0 && (
                              <div className="mt-2">
                                <AttachmentList attachments={c.attachments} compact />
                              </div>
                            )}
                          </div>
                        </div>
                        {isMe && <Avatar name={authorName} size="sm" />}
                      </div>
                    );
                  })}
                </div>
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
                  maxLength={COMMENT_MAX_LENGTH}
                  onChange={(e) => setCommentText(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && commentText.trim()) {
                      addCommentMutation.mutate();
                    }
                  }}
                  aria-label={isInternal ? 'Internal note' : 'Message'}
                  className={`block w-full px-4 py-3 rounded-xl text-sm border placeholder-gray-400 focus:outline-none focus:ring-2 transition-all resize-none ${
                    isInternal
                      ? 'bg-amber-50 border-amber-200 focus:ring-amber-400'
                      : 'bg-white border-gray-200 focus:ring-blue-500'
                  }`}
                  placeholder={isInternal ? 'Write an internal note…' : 'Write your message… (Ctrl+Enter to send)'}
                />
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className={commentText.length > COMMENT_MAX_LENGTH ? 'text-red-600' : 'text-gray-400'}>
                    {commentText.length}/{COMMENT_MAX_LENGTH}
                  </span>
                </div>
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
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isInternal}
                          onChange={() => setIsInternal((v) => !v)}
                        />
                        <div
                          role="switch"
                          aria-checked={isInternal}
                          aria-label="Internal note"
                          className={`relative w-8 h-4 rounded-full transition-colors ${isInternal ? 'bg-amber-400' : 'bg-gray-200'}`}
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
            <Section className="flex h-[500px] min-h-0 min-w-0 flex-col">
              <SectionHeader
                title="Activity Timeline"
                subtitle={`${activity.length} event${activity.length !== 1 ? 's' : ''}`}
              />
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
                {activity.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gray-500">No activity recorded yet.</p>
                ) : (
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
                          <p className="break-words text-sm leading-snug text-gray-700">{a.description}</p>
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
                )}
              </div>
            </Section></div>
        
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
