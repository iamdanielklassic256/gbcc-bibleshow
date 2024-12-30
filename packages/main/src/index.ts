import type { AppInitConfig } from './AppInitConfig.js';
import { createModuleRunner } from './ModuleRunner.js';
import { disallowMultipleAppInstance } from './modules/SingleInstanceApp.js';
import { createDualWindowManagerModule } from './modules/DualWindowManager.js';
import { terminateAppOnLastWindowClose } from './modules/ApplicationTerminatorOnLastWindowClose.js';
import { hardwareAccelerationMode } from './modules/HardwareAccelerationModule.js';
import { autoUpdater } from './modules/AutoUpdater.js';
import { allowInternalOrigins } from './modules/BlockNotAllowedOrigins.js';
import { allowExternalUrls } from './modules/ExternalUrls.js';
import { ipcMain } from 'electron';

function setupWindowIPC() {
  console.log('Main: Setting up window IPC handlers');
  ipcMain.handle('window-message', async (_event, message) => {
    console.log('Main: Window message received:', message);
  });
}

export async function initApp(initConfig: AppInitConfig) {
  console.log('Main: Initializing application');
  setupWindowIPC();

  const moduleRunner = createModuleRunner()
    .init(
      createDualWindowManagerModule({
        initConfig,
        openDevTools: import.meta.env.DEV,
        windowConfig: {
          main: {
            width: 800,
            height: 600,
            title: 'Main Window',
          },
          secondary: {
            width: 600,
            height: 800,
            title: 'Secondary Window',
          },
        },
      }),
    )
    .init(disallowMultipleAppInstance())
    .init(terminateAppOnLastWindowClose())
    .init(hardwareAccelerationMode({ enable: false }))
    .init(autoUpdater())
    .init(
      allowInternalOrigins(
        new Set(
          initConfig.renderer instanceof URL
            ? [
                initConfig.renderer.origin,
                new URL('/secondary', initConfig.renderer).origin,
              ]
            : [],
        ),
      ),
    )
    .init(
      allowExternalUrls(
        new Set(
          initConfig.renderer instanceof URL
            ? [
                'https://vite.dev',
                'https://developer.mozilla.org',
                'https://solidjs.com',
                'https://qwik.dev',
                'https://lit.dev',
                'https://react.dev',
                'https://preactjs.com',
                'https://www.typescriptlang.org',
                'https://vuejs.org',
              ]
            : [],
        ),
      ),
    );

  await moduleRunner;
  console.log('Main: Application initialization complete');
}
