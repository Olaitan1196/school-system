import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dev mode = app is not packaged
const isDev = !app.isPackaged;

let mainWindow;
let splashWindow;
let backendProcess;

// ============================================
// START THE EXPRESS BACKEND AS A CHILD PROCESS
// ============================================
const startBackend = () => {
    const serverPath = isDev
        ? join(__dirname, '..', 'server', 'index.js')
        : join(process.resourcesPath, 'server', 'index.js');

    const envPath = isDev
        ? join(__dirname, '..', 'server', '.env')
        : join(process.resourcesPath, 'server', '.env');

    backendProcess = spawn('node', [serverPath], {
        env: {
            ...process.env,
            NODE_ENV: 'development',
            PORT: '5000',
            DOTENV_CONFIG_PATH: envPath
        },
        cwd: isDev
            ? join(__dirname, '..', 'server')
            : join(process.resourcesPath, 'server'),
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
// APP LIFECYCLE
// ============================================
app.whenReady().then(() => {
    createSplashWindow();

    // Only start backend as child process in production
    // In dev, nodemon already runs the backend
    if (!isDev) {
        startBackend();
    }

    setTimeout(() => {
        createMainWindow();
    }, 3000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('before-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});

app.on('window-all-closed', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
});