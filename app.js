const state = {
    environment: {},
    anomalies: [],
    stats: { tests: 0, iterations: 0, duration: 0, start: 0 },
    config: { seed: 12345, iterations: 1000, timeout: 5000, level: 'safe', suite: 'all' },
    isRunning: false,
    abortController: null
};

function init() {
    detectEnvironment();
    bindUI();
    updateStats();
}

function detectEnvironment() {
    const env = state.environment;
    env.userAgent = navigator.userAgent;
    env.platform = navigator.platform;
    env.language = navigator.language;
    env.hardwareConcurrency = navigator.hardwareConcurrency;
    env.deviceMemory = navigator.deviceMemory || 'N/A';
    env.cookieEnabled = navigator.cookieEnabled;
    
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            env.webglRenderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        }
    } catch (e) { env.webglRenderer = 'Error: ' + e.message; }

    env.features = {
        wasm: typeof WebAssembly !== 'undefined',
        sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
        worker: typeof Worker !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
        indexedDB: 'indexedDB' in window,
        webCrypto: 'crypto' in window && 'subtle' in window.crypto,
        structuredClone: typeof structuredClone === 'function',
        weakRef: typeof WeakRef !== 'undefined',
        finalizationRegistry: typeof FinalizationRegistry !== 'undefined'
    };

    const grid = document.getElementById('envGrid');
    grid.innerHTML = '';
    for (const [key, value] of Object.entries(env)) {
        if (key === 'features') {
            for (const [fKey, fVal] of Object.entries(value)) {
                grid.innerHTML += `<div class="grid-item"><div class="label">${fKey}</div><div class="value">${fVal ? 'Supported' : 'Not Supported'}</div></div>`;
            }
        } else {
            grid.innerHTML += `<div class="grid-item"><div class="label">${key}</div><div class="value">${typeof value === 'object' ? JSON.stringify(value) : value}</div></div>`;
        }
    }
}

function bindUI() {
    document.getElementById('btnRun').onclick = runTests;
    document.getElementById('btnStop').onclick = () => { if (state.abortController) state.abortController.abort(); };
    document.getElementById('btnCompatibility').onclick = () => { detectEnvironment(); alert('Environment re-scanned.'); };
    document.getElementById('btnExportJSON').onclick = () => exportReport('json');
    document.getElementById('btnExportTXT').onclick = () => exportReport('txt');
    document.getElementById('btnExportReport').onclick =
