import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

function logToFile(fileName, message) {
  const filePath = path.join(logDir, fileName);
  const timestamp = new Date().toISOString();
  fs.appendFileSync(filePath, `[${timestamp}] ${message}\n`);
}

export const logger = {
  info: (message, user) => logToFile('info.log', `${message} ${user ? `| User: ${JSON.stringify(user)}` : ''}`),
  warn: (message, user) => logToFile('warn.log', `${message} ${user ? `| User: ${JSON.stringify(user)}` : ''}`),
  error: (message, err) => logToFile('error.log', `${message} | Error: ${err}`)
};
