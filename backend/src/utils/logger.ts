import fs from 'fs';
import path from 'path';

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFile = path.join(logDir, 'sync.log');

export function logError(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    console.error(logMessage);
}

export function logInfo(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] INFO: ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    console.log(logMessage);
}