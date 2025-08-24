import { CapacitorConfig } from '@capacitor/cli';
import { loadEnv } from 'vite';

Object.assign(process.env, loadEnv(process.env.NODE_ENV ?? '', process.cwd(), 'VITE_'));

// Capacitor configuration for iOS & Android builds
// NOTE: After pulling locally, run the commands listed in README to sync platforms.

const config: CapacitorConfig = {
  appId: 'app.aurora.75bb2996e53544b9a4c6d20c7e096a86',
  appName: 'mindscape-control-panel',
  webDir: 'dist',
  bundledWebRuntime: false,
};

export default config;
