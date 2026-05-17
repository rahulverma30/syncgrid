import { toast } from 'sonner';

export type SocketCallback = (data: any) => void;

class MockSocketGateway {
  private subscriptions = new Map<string, Set<SocketCallback>>();
  private isConnected = false;
  private currentCompanyId: string | null = null;
  private reconnectInterval: any = null;

  /**
   * Initializes the socket gateway for a specific tenant scope
   */
  public connect(companyId: string): void {
    if (this.isConnected && this.currentCompanyId === companyId) return;

    this.currentCompanyId = companyId;
    this.isConnected = true;
    console.log(`[SOCKET_GATEWAY] Connected to tenant space: ws://syncgrid.io/tenant/${companyId}`);

    // Emulate a steady stream of collaborative presence modifications or notifications
    this.startHeartbeat();
  }

  /**
   * Disconnects the socket gateway
   */
  public disconnect(): void {
    this.isConnected = false;
    this.currentCompanyId = null;
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }
    console.log('[SOCKET_GATEWAY] Socket disconnected.');
  }

  /**
   * Subscribes to a socket channel event
   */
  public on(event: string, callback: SocketCallback): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }
    this.subscriptions.get(event)!.add(callback);

    return () => this.off(event, callback);
  }

  /**
   * Unsubscribes from a channel event
   */
  public off(event: string, callback: SocketCallback): void {
    const set = this.subscriptions.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  /**
   * Broadcasts a simulated event locally for collaborative response
   */
  public broadcastSimulated(event: string, data: any): void {
    if (!this.isConnected) return;

    const set = this.subscriptions.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Socket broadcast callback error on ${event}:`, e);
        }
      });
    }
  }

  /**
   * Periodically trigger a real-time activity alert simulation
   */
  private startHeartbeat(): void {
    if (this.reconnectInterval) clearInterval(this.reconnectInterval);

    this.reconnectInterval = setInterval(() => {
      if (!this.isConnected || !this.currentCompanyId) return;

      // Simulated background activities
      const events = [
        {
          name: 'project_activity_alert',
          payload: {
            title: 'Task progress logged',
            message: 'Milestone Alpha reached 80% progress by Developer',
          },
        },
        {
          name: 'presence_update',
          payload: {
            usersOnline: ['Super Admin', 'Project Manager', 'Developer'],
          },
        },
      ];

      const choice = events[Math.floor(Math.random() * events.length)];
      this.broadcastSimulated(choice.name, choice.payload);

      // Toast notification to let the user know real-time sync is working
      if (choice.name === 'project_activity_alert') {
        toast.info(`[Real-time Alert] ${choice.payload.title}: ${choice.payload.message}`, {
          duration: 3500,
        });
      }
    }, 45000); // every 45s to avoid excessive dashboard interruptions
  }
}

export const socketGateway = new MockSocketGateway();
