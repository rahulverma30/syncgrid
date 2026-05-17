export type DomainEventType =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'SPRINT_UPDATED'
  | 'MILESTONE_COMPLETED'
  | 'RISK_ESCALATED'
  | 'ALLOCATION_OVERLOADED'
  | 'WORKFLOW_CHANGED';

export interface DomainEvent<T = any> {
  type: DomainEventType;
  payload: T;
  companyId: string;
  timestamp: string;
  userName?: string;
}

type EventListener<T = any> = (event: DomainEvent<T>) => void;

class EnterpriseEventBus {
  private listeners = new Map<DomainEventType, Set<EventListener>>();

  /**
   * Subscribes a listener function to a specific domain event type
   */
  public subscribe<T = any>(type: DomainEventType, listener: EventListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    // Return unsubscribe function
    return () => this.unsubscribe(type, listener);
  }

  /**
   * Unsubscribes a listener function from an event type
   */
  public unsubscribe<T = any>(type: DomainEventType, listener: EventListener<T>): void {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(listener);
    }
  }

  /**
   * Publishes a domain event to all registered listeners
   */
  public publish<T = any>(
    type: DomainEventType,
    companyId: string,
    payload: T,
    userName?: string
  ): void {
    const event: DomainEvent<T> = {
      type,
      companyId,
      payload,
      timestamp: new Date().toISOString(),
      userName,
    };

    // Trigger local listeners
    const set = this.listeners.get(type);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error(`Error in event listener for ${type}:`, err);
        }
      });
    }

    // Trigger dynamic activity log creation (centralized audit trail hook)
    this.logActivity(event);
  }

  /**
   * Centralized event auditor hook
   */
  private async logActivity(event: DomainEvent): Promise<void> {
    if (typeof window === 'undefined') {
      // Server side: dynamically record in DB or log streams
      console.log(`[EVENT_BUS:SERVER] ${event.type} dispatched under Tenant ${event.companyId}`);
    } else {
      // Client side observer
      console.log(
        `[EVENT_BUS:CLIENT] ${event.type} dispatched under Tenant ${event.companyId}`,
        event.payload
      );
    }
  }
}

export const eventBus = new EnterpriseEventBus();
