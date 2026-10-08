import { io, Socket } from 'socket.io-client';
import { API_ORIGIN } from '../lib/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_ORIGIN;

export interface CommentDeletedEvent {
  ticketId?: string;
  commentId: string;
}

let socket: Socket | null = null;
const joinedTicketIds = new Set<string>();

const getToken = (): string | null => localStorage.getItem('token');

const ensureSocket = (): Socket | null => {
  const token = getToken();
  if (!token) return null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
    });

    socket.on('connect', () => {
      joinedTicketIds.forEach((ticketId) => {
        socket?.emit('ticket:join', { ticketId });
      });
    });
  } else if (socket.auth) {
    socket.auth = { token };
  }

  return socket;
};

const getConnectedSocket = (): Socket | null => {
  const s = ensureSocket();
  if (!s) return null;
  if (!s.connected) s.connect();
  return s;
};

const onAuthRefresh = (e: Event) => {
  const { token } = (e as CustomEvent<{ token: string }>).detail;
  if (socket?.auth) {
    socket.auth = { token };
    socket.disconnect();
    socket.connect();
  }
};

const onAuthLogout = () => {
  joinedTicketIds.clear();
  if (socket?.connected) socket.disconnect();
  socket = null;
};

if (typeof window !== 'undefined') {
  window.addEventListener('auth:refresh', onAuthRefresh);
  window.addEventListener('auth:logout', onAuthLogout);
}

export const socketService = {
  getSocket: ensureSocket,

  joinTicket(ticketId: string) {
    const s = getConnectedSocket();
    if (!s) return;
    joinedTicketIds.add(ticketId);
    s.emit('ticket:join', { ticketId });
  },

  leaveTicket(ticketId: string) {
    joinedTicketIds.delete(ticketId);
    if (socket?.connected) {
      socket.emit('ticket:leave', { ticketId });
    }
    if (joinedTicketIds.size === 0 && socket) {
      socket.disconnect();
      socket = null;
    }
  },

  on(event: string, listener: (...args: any[]) => void) {
    ensureSocket()?.on(event, listener);
  },

  off(event: string, listener: (...args: any[]) => void) {
    socket?.off(event, listener);
  },
};