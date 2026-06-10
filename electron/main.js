import { app, BrowserWindow, ipcMain, shell, net } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import { getLocalDb } from './database/localDb.js';
import { runFullSync, isOnline } from './services/syncService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = !app.isPackaged;

let mainWindow;
let splashWindow;
let backendProcess;
let syncInterval;

// ============================================
// START THE EXPRESS BACKEND AS A CHILD PROCESS
// Only runs in production (packaged .exe)
// ============================================
const startBackend = () => {
    const serverPath = join(process.resourcesPath, 'server', 'index.js');

    const envPath = join(process.resourcesPath, 'server', '.env');

    backendProcess = spawn('node', [serverPath], {
        env: {
            ...process.env,
            NODE_ENV: 'production',
            PORT: '5000',
            DOTENV_CONFIG_PATH: envPath
        },
        cwd: join(process.resourcesPath, 'server'),
        stdio: 'pipe'
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
};

// ============================================
// CREATE THE SPLASH / LOADING SCREEN
// ============================================
const createSplashWindow = () => {
    splashWindow = new BrowserWindow({
        width: 500,
        height: 350,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    splashWindow.loadFile(join(__dirname, 'splash.html'));
};

// ============================================
// CREATE THE MAIN APP WINDOW
// ============================================
const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 768,
        minHeight: 600,
        show: false,
        title: "Comforters' College",
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    const startUrl = isDev
        ? 'http://localhost:5173'
        : `file://${join(process.resourcesPath, 'client', 'dist', 'index.html')}`;

    mainWindow.loadURL(startUrl);

    mainWindow.once('ready-to-show', () => {
        if (splashWindow) {
            splashWindow.destroy();
        }
        mainWindow.show();
        mainWindow.maximize();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

// ============================================
// AUTO SYNC — watches internet every 30 seconds
// When internet returns, runs full sync
// ============================================
const startSyncWatcher = () => {
    let wasOnline = isOnline();

    syncInterval = setInterval(async () => {
        const nowOnline = isOnline();

        // Tell the frontend the current connection status
        if (mainWindow) {
            mainWindow.webContents.send('connection-status', nowOnline);
        }

        // If we just came back online, trigger a sync
        if (!wasOnline && nowOnline) {
            console.log('Internet restored — starting sync...');

            if (mainWindow) {
                mainWindow.webContents.send('sync-started');
            }

            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_ANON_KEY;

            const result = await runFullSync(supabaseUrl, supabaseKey);

            if (mainWindow) {
                mainWindow.webContents.send('sync-complete', result);
            }
        }

        wasOnline = nowOnline;

    }, 30000);
};

// ============================================
// IPC HANDLERS
// These let the React frontend communicate
// with the Electron backend
// ============================================

// Frontend requests a manual sync
ipcMain.handle('manual-sync', async () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const result = await runFullSync(supabaseUrl, supabaseKey);
    return result;
});

// Frontend asks for current online status
ipcMain.handle('get-online-status', () => {
    return isOnline();
});

// Frontend requests to open a URL in browser
ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
});

// ============================================
// APP LIFECYCLE
// ============================================
app.whenReady().then(() => {
    // Initialize SQLite database
    getLocalDb();

    createSplashWindow();

    if (!isDev) {
        startBackend();
    }

    setTimeout(() => {
        createMainWindow();
        startSyncWatcher();
    }, 3000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('before-quit', () => {
    if (backendProcess) backendProcess.kill();
    if (syncInterval) clearInterval(syncInterval);
});

app.on('window-all-closed', () => {
    if (backendProcess) backendProcess.kill();
    if (syncInterval) clearInterval(syncInterval);
    if (process.platform !== 'darwin') {
        app.quit();
    }
});