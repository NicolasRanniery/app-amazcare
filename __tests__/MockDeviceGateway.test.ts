import { MockDeviceGateway } from '../src/device/MockDeviceGateway';
import { DeviceEvent } from '../src/device/DeviceGateway';

describe('Device: MockDeviceGateway', () => {
  let gateway: MockDeviceGateway;

  beforeEach(() => {
    gateway = new MockDeviceGateway();
  });

  it('initializes with all 6 drawers closed, LEDs off and buzzer off', () => {
    const status = gateway.status$.getValue();
    expect(status.online).toBe(true);
    expect(status.buzzer).toBe(false);
    expect(status.drawers[1].open).toBe(false);
    expect(status.drawers[1].led).toBe('off');
  });

  it('triggers out-of-schedule buzzer when a drawer is opened without an active alarm', async () => {
    const events: DeviceEvent[] = [];
    gateway.events$.subscribe((ev) => {
      if (ev) events.push(ev);
    });

    await gateway.openDrawer(2);

    const status = gateway.status$.getValue();
    expect(status.drawers[2].open).toBe(true);
    expect(status.buzzer).toBe(true); // Buzzer alerts unauthorized open
    expect(events.some((e) => e.type === 'OUT_OF_SCHEDULE_OPEN')).toBe(true);

    await gateway.closeDrawer(2);
    expect(gateway.status$.getValue().drawers[2].open).toBe(false);
  });

  it('handles simultaneous alarms with multiple drawers (polypharmacy)', async () => {
    const events: DeviceEvent[] = [];
    gateway.events$.subscribe((ev) => {
      if (ev) events.push(ev);
    });

    // Alarm for Drawer 1 and Drawer 4
    await gateway.triggerAlarm([1, 4]);

    let status = gateway.status$.getValue();
    expect(status.buzzer).toBe(true);
    expect(status.drawers[1].led).toBe('on');
    expect(status.drawers[4].led).toBe('on');

    // Opening wrong drawer (e.g. 3) emits WRONG_DRAWER
    await gateway.openDrawer(3);
    expect(
      events.some(
        (e) => e.type === 'WRONG_DRAWER' && e.drawer === 3
      )
    ).toBe(true);
    await gateway.closeDrawer(3);

    // Opening correct drawer 1: LED blinks and buzzer stops
    await gateway.openDrawer(1);
    status = gateway.status$.getValue();
    expect(status.drawers[1].led).toBe('blink');
    expect(status.buzzer).toBe(false);

    // Closing drawer 1: LED turns off
    await gateway.closeDrawer(1);
    status = gateway.status$.getValue();
    expect(status.drawers[1].led).toBe('off');

    // Opening correct drawer 4
    await gateway.openDrawer(4);
    expect(gateway.status$.getValue().drawers[4].led).toBe('blink');
    await gateway.closeDrawer(4);
    expect(gateway.status$.getValue().drawers[4].led).toBe('off');
  });

  it('toggles Wi-Fi status cleanly', () => {
    expect(gateway.status$.getValue().online).toBe(true);
    gateway.toggleWifi();
    expect(gateway.status$.getValue().online).toBe(false);
    gateway.toggleWifi();
    expect(gateway.status$.getValue().online).toBe(true);
  });
});
