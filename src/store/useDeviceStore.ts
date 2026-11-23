import { create } from 'zustand';
import { DrawerId } from '../domain/types';
import {
  DeviceGateway,
  DeviceStatus,
  DeviceEvent,
  getDeviceGateway,
} from '../device';

interface ActiveAlarmMoment {
  time: string;
  date: string;
  drawers: DrawerId[];
  medicationIds: string[];
}

interface DeviceState {
  status: DeviceStatus;
  lastEvent: DeviceEvent | null;
  activeAlarm: ActiveAlarmMoment | null;

  initializeGateway: () => () => void;
  openDrawer: (drawer: DrawerId) => Promise<void>;
  closeDrawer: (drawer: DrawerId) => Promise<void>;
  startAlarm: (moment: ActiveAlarmMoment) => Promise<void>;
  stopAlarm: () => Promise<void>;
  toggleWifi: () => void;
}

const gateway: DeviceGateway = getDeviceGateway();

export const useDeviceStore = create<DeviceState>((set, get) => ({
  status: gateway.status$.getValue(),
  lastEvent: gateway.events$.getValue(),
  activeAlarm: null,

  initializeGateway: () => {
    const unsubStatus = gateway.status$.subscribe((status) => {
      set({ status });
    });

    const unsubEvents = gateway.events$.subscribe((event) => {
      if (event) {
        set({ lastEvent: event });
      }
    });

    return () => {
      unsubStatus();
      unsubEvents();
    };
  },

  openDrawer: async (drawer) => {
    await gateway.openDrawer(drawer);
  },

  closeDrawer: async (drawer) => {
    await gateway.closeDrawer(drawer);
  },

  startAlarm: async (moment) => {
    set({ activeAlarm: moment });
    await gateway.triggerAlarm(moment.drawers);
  },

  stopAlarm: async () => {
    set({ activeAlarm: null });
    await gateway.stopAlarm();
  },

  toggleWifi: () => {
    if (gateway.toggleWifi) {
      gateway.toggleWifi();
    }
  },
}));
