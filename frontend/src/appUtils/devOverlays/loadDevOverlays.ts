// Dev overlays: console-panel (on-page console) and stats.js (FPS meter). Both are vendored under
// frontend/src/resources/3rdparty/autoloaded/ (see copy-files-from-to.cjson) and reach the
// publicDirectory through AppBootstrapPlugin's static-resources copy. They load only when
// config.application.frontEnd.showDevTools is enabled - the config is inlined into index.html as
// window.frontEndConfig by AppBootstrapPlugin ({{loadAppConfig}}).
//
// NOTE: This loader is this template branch's own addition - the reference web-app-template vendors
// the same files but gates its dev tools through an in-app UI instead (script-injection pattern
// adapted from its JsPerformanceMonitor component).

const loadScript = function (src: string, onLoad?: () => void) {
    const script = document.createElement('script');
    if (onLoad) {
        script.addEventListener('load', onLoad);
    }
    script.addEventListener('error', function () {
        console.warn(`Dev overlay: failed to load script ${src}`);
    });
    script.src = src;
    document.head.append(script);
};

const loadCss = function (href: string) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.addEventListener('error', function () {
        console.warn(`Dev overlay: failed to load stylesheet ${href}`);
    });
    link.href = href;
    document.head.append(link);
};

const loadConsolePanel = function () {
    loadCss('/resources/3rdparty/autoloaded/console-panel/console-panel.css');
    loadScript('/resources/3rdparty/autoloaded/console-panel/console-panel.js', function () {
        // The vendored script only constructs window.consolePanel; rendering and console
        // interception happen in enable()
        window.consolePanel?.enable();
    });
};

const loadStatsJsFpsMeter = function () {
    loadScript('/resources/3rdparty/autoloaded/stats.js/stats.min.js', function () {
        if (!window.Stats) {
            return;
        }
        const stats = new window.Stats();
        const elStats = stats.dom;
        document.body.append(elStats);
        // stats.js pins its panel to the top-left by default; move it to the top-right so it does
        // not overlap the app content / other dev overlays
        elStats.style.left = 'auto';
        elStats.style.right = '0';

        const animate = function () {
            stats.update();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    });
};

const loadDevOverlays = function () {
    if (!window.frontEndConfig?.showDevTools) {
        return;
    }

    loadConsolePanel();
    loadStatsJsFpsMeter();
};

export { loadDevOverlays };
