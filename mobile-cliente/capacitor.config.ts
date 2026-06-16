import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lavame.cliente',
  appName: 'Lava-Me',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: 'ionic',
    },
  },
};

export default config;
