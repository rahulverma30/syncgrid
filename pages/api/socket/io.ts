import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: any) => {
  if (!res.socket.server.io) {
    console.log('[SOCKET_IO] Initializing custom standalone Socket.io server...');
    const httpServer: NetServer = res.socket.server as any;

    const io = new ServerIO(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log(`🔌 [SOCKET_IO] Client connected: ${socket.id}`);

      // Handle custom room joining scoped strictly to the user's companyId
      socket.on('join-tenant', (companyId) => {
        if (companyId) {
          const roomName = `tenant:${companyId}`;
          socket.join(roomName);
          console.log(`🔌 [SOCKET_IO] Socket ${socket.id} joined isolated room ${roomName}`);
        }
      });

      // Handle manual heartbeat ping
      socket.on('ping', () => {
        socket.emit('pong');
      });

      socket.on('disconnect', () => {
        console.log(`🔌 [SOCKET_IO] Client disconnected: ${socket.id}`);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('[SOCKET_IO] Socket.io server already running.');
  }
  res.end();
};

export default ioHandler;
