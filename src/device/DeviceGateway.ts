import { DrawerId, Medication } from '../domain/types';

export type LedMode = 'off' | 'on' | 'blink';

export interface DeviceStatus {
  online: boolean;
  lastSyncAt?: string;
  clockOk: boolean;
  drawers: Record<DrawerId, { open: boolean; led: LedMode }>;
  buzzer: boolean;
}

export type DeviceEvent =
  | { type: 'ALARM_STARTED'; drawers: DrawerId[]; at: string }
  | {
      type: 'DRAWER_OPENED';
      drawer: DrawerId;
      at: string;
      correct: boolean;
      scheduled: boolean;
    }
  | { type: 'DRAWER_CLOSED'; drawer: DrawerId; at: string }
  | { type: 'WRONG_DRAWER'; drawer: DrawerId; at: string; expected: DrawerId[] }
  | { type: 'OUT_OF_SCHEDULE_OPEN'; drawer: DrawerId; at: string };

export type Unsubscribe = () => void;

export interface ObservableLike<T> {
  subscribe(callback: (value: T) => void): Unsubscribe;
  getValue(): T;
}

export interface DeviceGateway {
  readonly status$: ObservableLike<DeviceStatus>;
  readonly events$: ObservableLike<DeviceEvent | null>;

  syncSchedule(meds: Medication[]): Promise<void>;
  openDrawer(drawer: DrawerId): Promise<void>;
  closeDrawer(drawer: DrawerId): Promise<void>;
  triggerAlarm(drawers: DrawerId[]): Promise<void>;
  stopAlarm(): Promise<void>;
  toggleWifi?(): void;
  setLed?(drawer: DrawerId, mode: LedMode): Promise<void>;
  setBuzzer?(on: boolean): Promise<void>;
}
