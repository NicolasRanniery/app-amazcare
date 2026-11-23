import { DrawerId, Medication } from '../domain/types';
import {
  DeviceGateway,
  DeviceStatus,
  DeviceEvent,
  LedMode,
  ObservableLike,
  Unsubscribe,
} from './DeviceGateway';

class SimpleObservable<T> implements ObservableLike<T> {
  private listeners: Array<(value: T) => void> = [];
  private currentValue: T;

  constructor(initialValue: T) {
    this.currentValue = initialValue;
  }

  getValue(): T {
    return this.currentValue;
  }

  next(value: T): void {
    this.currentValue = value;
    for (const listener of this.listeners) {
      listener(value);
    }
  }

  subscribe(callback: (value: T) => void): Unsubscribe {
    this.listeners.push(callback);
    callback(this.currentValue);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }
}

export class HttpDeviceGateway implements DeviceGateway {
  private baseUrl: string;
  private wsUrl: string;
  private statusSubject: SimpleObservable<DeviceStatus>;
  private eventSubject: SimpleObservable<DeviceEvent | null>;
  private socket: WebSocket | null = null;
  private pollInterval: any = null;

  constructor(host: string = 'http://amazcare.local') {
    this.baseUrl = host;
    this.wsUrl = host.replace(/^http/, 'ws') + '/ws';

    const initialDrawers: Record<DrawerId, { open: boolean; led: LedMode }> = {
      1: { open: false, led: 'off' },
      2: { open: false, led: 'off' },
      3: { open: false, led: 'off' },
      4: { open: false, led: 'off' },
      5: { open: false, led: 'off' },
      6: { open: false, led: 'off' },
    };

    this.statusSubject = new SimpleObservable<DeviceStatus>({
      online: false,
      clockOk: false,
      drawers: initialDrawers,
      buzzer: false,
    });
    this.eventSubject = new SimpleObservable<DeviceEvent | null>(null);

    this.connect();
  }

  get status$(): ObservableLike<DeviceStatus> {
    return this.statusSubject;
  }

  get events$(): ObservableLike<DeviceEvent | null> {
    return this.eventSubject;
  }

  private connect(): void {
    try {
      this.fetchStatus();
      this.pollInterval = setInterval(() => this.fetchStatus(), 10000);

      if (typeof WebSocket !== 'undefined') {
        this.socket = new WebSocket(this.wsUrl);
        this.socket.onmessage = (event) => {
          try {
            const data: DeviceEvent = JSON.parse(event.data);
            this.eventSubject.next(data);
          } catch {}
        };
        this.socket.onerror = () => {
          this.markOffline();
        };
      }
    } catch {
      this.markOffline();
    }
  }

  private markOffline(): void {
    const cur = this.statusSubject.getValue();
    this.statusSubject.next({ ...cur, online: false });
  }

  private async fetchStatus(): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/status`);
      if (!res.ok) throw new Error('Status not ok');
      const data = await res.json();

      const drawers: Record<DrawerId, { open: boolean; led: LedMode }> = {
        1: { open: false, led: 'off' },
        2: { open: false, led: 'off' },
        3: { open: false, led: 'off' },
        4: { open: false, led: 'off' },
        5: { open: false, led: 'off' },
        6: { open: false, led: 'off' },
      };

      if (Array.isArray(data.drawers)) {
        for (const d of data.drawers) {
          const id = d.id as DrawerId;
          if (drawers[id]) {
            drawers[id] = { open: !!d.open, led: d.led || 'off' };
          }
        }
      }

      this.statusSubject.next({
        online: true,
        lastSyncAt: data.lastSyncAt || new Date().toISOString(),
        clockOk: !!data.rtc?.synced,
        drawers,
        buzzer: !!data.buzzer,
      });
    } catch {
      this.markOffline();
    }
  }

  async syncSchedule(meds: Medication[]): Promise<void> {
    try {
      const payload = {
        syncAt: new Date().toISOString(),
        schedules: meds.map((m) => ({
          drawer: m.drawer,
          medicationId: m.id,
          times: m.times,
        })),
      };

      await fetch(`${this.baseUrl}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('Failed to sync schedule with ESP32', e);
    }
  }

  async triggerAlarm(drawers: DrawerId[]): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/alarm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', drawers }),
      });
    } catch {}
  }

  async stopAlarm(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/alarm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
    } catch {}
  }

  async openDrawer(drawer: DrawerId): Promise<void> {
    // Para teste via API com ESP32 real se suportado
    try {
      await fetch(`${this.baseUrl}/drawer/${drawer}/open`, { method: 'POST' });
    } catch {}
  }

  async closeDrawer(drawer: DrawerId): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/drawer/${drawer}/close`, { method: 'POST' });
    } catch {}
  }
}
