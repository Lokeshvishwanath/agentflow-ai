import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = () => { getSocket().connect(); };
export const disconnectSocket = () => { socket?.disconnect(); socket = null; };

export const subscribeExecution = (executionId) => getSocket().emit('subscribe:execution', executionId);
export const unsubscribeExecution = (executionId) => getSocket().emit('unsubscribe:execution', executionId);
export const subscribeUser = (userId) => getSocket().emit('subscribe:user', userId);
