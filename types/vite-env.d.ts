/// <reference types="vite/client" />

// Globals that exist outside the module graph:
// - frontEndConfig is inlined into index.html by AppBootstrapPlugin (the {{loadAppConfig}} placeholder)
// - consolePanel and Stats come from the vendored console-panel.js / stats.min.js dev overlays,
//   script-injected by frontend/src/appUtils/devOverlays/loadDevOverlays.ts when
//   frontEndConfig.showDevTools is enabled
interface Window {
    consolePanel?: {
        disable: () => void;
        enable: (config?: object) => void
    };
    frontEndConfig?: {
        showDevTools?: boolean
    };
    Stats?: new () => {
        begin: () => void;
        dom: HTMLElement;
        end: () => void;
        update: () => void
    }
}
