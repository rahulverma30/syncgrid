import { io, Socket } from 'socket.io-client';

export type SocketCallback = (data: any) => void;

class RealSocketGateway {
  private socket: Socket | null = null;
  private subscriptions = new Map<string, Set<SocketCallback>>();
  private currentCompanyId: string | null = null;
  private isConnecting = false;

  /**
   * Initializes a secure live WebSocket session scoped to a specific tenant
   */
  public async connect(companyId: string): Promise<void> {
    if (this.socket?.connected && this.currentCompanyId === companyId) return;
    if (this.isConnecting) return;

    this.isConnecting = true;
    this.currentCompanyId = companyId;

    try {
      // Hit the socket initialization API to warm up the Pages Router endpoint
      await fetch('/api/socket/io');

      // Instantiate Socket.io connection client
      this.socket = io({
        path: '/api/socket/io',
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 2000,
      });

      this.socket.on('connect', () => {
        console.log(`🔌 [SOCKET_GATEWAY] Live WebSocket established: ${this.socket?.id}`);
        this.isConnecting = false;

        // Scope connection to the multi-tenant room immediately upon handshake
        this.socket?.emit('join-tenant', companyId);
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 [SOCKET_GATEWAY] Handshake failed:', error);
        this.isConnecting = false;
      });

      // Bind all pre-registered event callbacks to the newly connected socket instance
      this.subscriptions.forEach((callbacks, event) => {
        this.socket?.on(event, (data) => {
          callbacks.forEach((cb) => {
            try {
              cb(data);
            } catch (e) {
              console.error(`🔌 [SOCKET_GATEWAY] Callback error on event ${event}:`, e);
            }
          });
        });
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`🔌 [SOCKET_GATEWAY] Socket connection closed: ${reason}`);
      });
    } catch (err) {
      console.error('🔌 [SOCKET_GATEWAY] Failed to connect:', err);
      this.isConnecting = false;
    }
  }

  /**
   * Closes active connections
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentCompanyId = null;
    console.log('🔌 [SOCKET_GATEWAY] Connection released.');
  }

  /**
   * Bind event listener
   */
  public on(event: string, callback: SocketCallback): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());

      // Bind straight to the active socket connection if it's currently connected
      this.socket?.on(event, (data) => {
        this.subscriptions.get(event)?.forEach((cb) => cb(data));
      });
    }

    this.subscriptions.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unbind event listener
   */
  public off(event: string, callback: SocketCallback): void {
    const set = this.subscriptions.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.subscriptions.delete(event);
        this.socket?.off(event);
      }
    }
  }

  /**
   * Keep signature compatibility for any internal legacy triggers
   */
  public broadcastSimulated(event: string, data: any): void {
    const set = this.subscriptions.get(event);
    if (set) {
      set.forEach((cb) => cb(data));
    }
  }
}

export const socketGateway = new RealSocketGateway();
