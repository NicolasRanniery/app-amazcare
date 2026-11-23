import { DeviceGateway } from './DeviceGateway';
import { MockDeviceGateway } from './MockDeviceGateway';
import { HttpDeviceGateway } from './HttpDeviceGateway';

let gatewayInstance: DeviceGateway | null = null;

export function getDeviceGateway(): DeviceGateway {
  if (!gatewayInstance) {
    const mode = process.env.EXPO_PUBLIC_DEVICE_MODE || 'mock';
    if (mode === 'http') {
      gatewayInstance = new HttpDeviceGateway();
    } else {
      gatewayInstance = new MockDeviceGateway();
    }
  }
  return gatewayInstance;
}

export * from './DeviceGateway';
export * from './MockDeviceGateway';
export * from './HttpDeviceGateway';
