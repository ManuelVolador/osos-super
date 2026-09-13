import type { PlacedOrder } from '../app/components/CheckoutDrawer';

export type RealtimeEventType = 'ORDER_CREATED' | 'ORDER_STATUS_UPDATED' | 'ORDER_DELETED' | 'PING';

export interface RealtimeOrderEvent {
  type: RealtimeEventType;
  timestamp: string;
  order?: PlacedOrder;
  orderNumber?: string;
  status?: string;
}

type EventListener = (event: RealtimeOrderEvent) => void;
type StatusListener = (status: { isConnected: boolean; transport: 'websocket' | 'broadcast' | 'local' }) => void;

class RealtimeOrderService {
  private ws: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<EventListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private isWsConnected: boolean = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.initBroadcastChannel();
    this.initWebSocket();
  }

  private initBroadcastChannel() {
    if (typeof window === 'undefined') return;
    try {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('osos_realtime_orders');
        this.broadcastChannel.onmessage = (e) => {
          if (e.data && e.data.type) {
            this.notifyListeners(e.data as RealtimeOrderEvent);
          }
        };
      }
    } catch {
      // BroadcastChannel unavailable in this environment
    }
  }

  private initWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      // Connect to local WebSocket server on port 5174
      const wsHost = window.location.hostname || 'localhost';
      const wsUrl = `ws://${wsHost}:5174`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isWsConnected = true;
        this.notifyStatusChange();
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as RealtimeOrderEvent;
          if (parsed && parsed.type) {
            this.notifyListeners(parsed);
          }
        } catch {
          // non-json message
        }
      };

      this.ws.onerror = () => {
        this.isWsConnected = false;
        this.notifyStatusChange();
      };

      this.ws.onclose = () => {
        this.isWsConnected = false;
        this.notifyStatusChange();
        // Auto-reconnect after 4s
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.initWebSocket();
          }, 4000);
        }
      };
    } catch {
      this.isWsConnected = false;
      this.notifyStatusChange();
    }
  }

  private notifyListeners(event: RealtimeOrderEvent) {
    if (event.type === 'ORDER_CREATED') {
      this.playChime();
    }
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.warn('Realtime listener error:', err);
      }
    });
  }

  private notifyStatusChange() {
    const status = this.getStatus();
    this.statusListeners.forEach((fn) => {
      try {
        fn(status);
      } catch {
        // ignore
      }
    });
  }

  public getStatus(): { isConnected: boolean; transport: 'websocket' | 'broadcast' | 'local' } {
    if (this.isWsConnected) {
      return { isConnected: true, transport: 'websocket' };
    }
    if (this.broadcastChannel) {
      return { isConnected: true, transport: 'broadcast' };
    }
    return { isConnected: false, transport: 'local' };
  }

  public subscribe(callback: EventListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public onStatusChange(callback: StatusListener): () => void {
    this.statusListeners.add(callback);
    callback(this.getStatus());
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public broadcastNewOrder(order: PlacedOrder) {
    const event: RealtimeOrderEvent = {
      type: 'ORDER_CREATED',
      timestamp: new Date().toISOString(),
      order,
      orderNumber: order.orderNumber,
    };

    this.send(event);
  }

  public broadcastOrderStatus(orderNumber: string, status: string) {
    const event: RealtimeOrderEvent = {
      type: 'ORDER_STATUS_UPDATED',
      timestamp: new Date().toISOString(),
      orderNumber,
      status,
    };

    this.send(event);
  }

  public broadcastOrderDeleted(orderNumber: string) {
    const event: RealtimeOrderEvent = {
      type: 'ORDER_DELETED',
      timestamp: new Date().toISOString(),
      orderNumber,
    };

    this.send(event);
  }

  private send(event: RealtimeOrderEvent) {
    // 1. Send via WebSocket if open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(event));
      } catch (err) {
        console.warn('WebSocket send failed:', err);
      }
    }

    // 2. Send via BroadcastChannel for instant multi-tab sync
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch (err) {
        console.warn('BroadcastChannel postMessage failed:', err);
      }
    }

    // 3. Notify in-memory listeners
    this.notifyListeners(event);
  }

  /**
   * Synthesize a warm, gentle dual-tone auditory chime for new orders
   * using the standard Web Audio API (no external MP3/WAV dependencies)
   */
  public playChime() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const now = this.audioCtx.currentTime;

      // Note 1: D5 (587.33 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.36);

      // Note 2: A5 (880.00 Hz)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.12);
      gain2.gain.setValueAtTime(0.0001, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.62);
    } catch {
      // Audio autoplay policy or unavailable audio hardware
    }
  }
}

export const realtimeService = new RealtimeOrderService();
