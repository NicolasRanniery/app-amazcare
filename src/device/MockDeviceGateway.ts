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

export class MockDeviceGateway implements DeviceGateway {
  private statusSubject: SimpleObservable<DeviceStatus>;
  private eventSubject: SimpleObservable<DeviceEvent | null>;
  private activeAlarmDrawers: DrawerId[] = [];
  private syncedMedications: Medication[] = [];

  constructor() {
    const initialDrawers: Record<DrawerId, { open: boolean; led: LedMode }> = {
      1: { open: false, led: 'off' },
      2: { open: false, led: 'off' },
      3: { open: false, led: 'off' },
      4: { open: false, led: 'off' },
      5: { open: false, led: 'off' },
      6: { open: false, led: 'off' },
    };

    const initialStatus: DeviceStatus = {
      online: true,
      lastSyncAt: new Date().toISOString(),
      clockOk: true,
      drawers: initialDrawers,
      buzzer: false,
    };

    this.statusSubject = new SimpleObservable<DeviceStatus>(initialStatus);
    this.eventSubject = new SimpleObservable<DeviceEvent | null>(null);
  }

  get status$(): ObservableLike<DeviceStatus> {
    return this.statusSubject;
  }

  get events$(): ObservableLike<DeviceEvent | null> {
    return this.eventSubject;
  }

  async syncSchedule(meds: Medication[]): Promise<void> {
    this.syncedMedications = [...meds];
    const current = this.statusSubject.getValue();
    this.statusSubject.next({
      ...current,
      lastSyncAt: new Date().toISOString(),
      clockOk: true,
    });
  }

  async triggerAlarm(drawers: DrawerId[]): Promise<void> {
    this.activeAlarmDrawers = [...drawers];
    const current = this.statusSubject.getValue();
    const updatedDrawers = { ...current.drawers };

    for (const d of drawers) {
      updatedDrawers[d] = {
        ...updatedDrawers[d],
        led: 'on',
      };
    }

    this.statusSubject.next({
      ...current,
      buzzer: true,
      drawers: updatedDrawers,
    });

    this.eventSubject.next({
      type: 'ALARM_STARTED',
      drawers,
      at: new Date().toISOString(),
    });
  }

  async stopAlarm(): Promise<void> {
    this.activeAlarmDrawers = [];
    const current = this.statusSubject.getValue();
    const updatedDrawers = { ...current.drawers };

    for (const key of [1, 2, 3, 4, 5, 6] as DrawerId[]) {
      updatedDrawers[key] = {
        ...updatedDrawers[key],
        led: 'off',
      };
    }

    this.statusSubject.next({
      ...current,
      buzzer: false,
      drawers: updatedDrawers,
    });
  }

  async openDrawer(drawer: DrawerId): Promise<void> {
    const current = this.statusSubject.getValue();
    const updatedDrawers = { ...current.drawers };
    updatedDrawers[drawer] = {
      ...updatedDrawers[drawer],
      open: true,
    };

    const isAlarmActive = this.activeAlarmDrawers.length > 0;
    const isCorrect = this.activeAlarmDrawers.includes(drawer);

    if (isAlarmActive) {
      if (isCorrect) {
        // Gaveta correta: LED pisca e se todas as ativas foram abertas, buzzer para
        updatedDrawers[drawer].led = 'blink';
        this.statusSubject.next({
          ...current,
          buzzer: false, // para o alarme ao abrir a gaveta certa
          drawers: updatedDrawers,
        });

        this.eventSubject.next({
          type: 'DRAWER_OPENED',
          drawer,
          correct: true,
          scheduled: true,
          at: new Date().toISOString(),
        });
      } else {
        // Gaveta errada aberta durante alarme
        this.statusSubject.next({
          ...current,
          drawers: updatedDrawers,
        });

        this.eventSubject.next({
          type: 'WRONG_DRAWER',
          drawer,
          expected: [...this.activeAlarmDrawers],
          at: new Date().toISOString(),
        });
      }
    } else {
      // Gaveta aberta fora do horário programado! Dispara buzzer
      this.statusSubject.next({
        ...current,
        buzzer: true,
        drawers: updatedDrawers,
      });

      this.eventSubject.next({
        type: 'OUT_OF_SCHEDULE_OPEN',
        drawer,
        at: new Date().toISOString(),
      });
    }
  }

  async closeDrawer(drawer: DrawerId): Promise<void> {
    const current = this.statusSubject.getValue();
    const updatedDrawers = { ...current.drawers };
    updatedDrawers[drawer] = {
      ...updatedDrawers[drawer],
      open: false,
    };

    const wasInAlarm = this.activeAlarmDrawers.includes(drawer);
    if (wasInAlarm) {
      // LED apaga e a gaveta é removida da lista pendente do alarme
      updatedDrawers[drawer].led = 'off';
      this.activeAlarmDrawers = this.activeAlarmDrawers.filter(
        (d) => d !== drawer
      );
    }

    // Se não há mais gavetas em alarme, encerra o alarme
    const hasActiveAlarm = this.activeAlarmDrawers.length > 0;
    const buzzerActive = hasActiveAlarm ? current.buzzer : false;

    this.statusSubject.next({
      ...current,
      buzzer: buzzerActive,
      drawers: updatedDrawers,
    });

    this.eventSubject.next({
      type: 'DRAWER_CLOSED',
      drawer,
      at: new Date().toISOString(),
    });
  }

  async setLed(drawer: DrawerId, mode: LedMode): Promise<void> {
    const current = this.statusSubject.getValue();
    this.statusSubject.next({
      ...current,
      drawers: {
        ...current.drawers,
        [drawer]: {
          ...current.drawers[drawer],
          led: mode,
        },
      },
    });
  }

  async setBuzzer(on: boolean): Promise<void> {
    const current = this.statusSubject.getValue();
    this.statusSubject.next({
      ...current,
      buzzer: on,
    });
  }

  toggleWifi(): void {
    const current = this.statusSubject.getValue();
    this.statusSubject.next({
      ...current,
      online: !current.online,
    });
  }
}
