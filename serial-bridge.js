/**
 * serial-bridge.js
 * Run with: node serial-bridge.js
 *
 * Reads JSON lines from ESP32 over USB Serial,
 * broadcasts them to the Expo app via WebSocket.
 *
 * Install deps:
 *   npm install serialport ws
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { WebSocketServer } = require('ws');

// ── CONFIG ──────────────────────────────────────────────────
const SERIAL_PORT = 'COM7';   // Your ESP32 port
const BAUD_RATE   = 115200;
const WS_PORT     = 8765;
// ────────────────────────────────────────────────────────────

const port = new SerialPort({ path: SERIAL_PORT, baudRate: BAUD_RATE });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
const wss = new WebSocketServer({ port: WS_PORT });

console.log(`Serial bridge running on ws://localhost:${WS_PORT}`);
console.log(`Listening on ${SERIAL_PORT} @ ${BAUD_RATE} baud`);

port.on('error', err => console.error('Serial error:', err.message));

parser.on('data', (line) => {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{')) return; // skip non-JSON noise

  try {
    const parsed = JSON.parse(trimmed);
    console.log('Sensor data:', parsed);

    // Broadcast to all connected WebSocket clients (your Expo app)
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(parsed));
      }
    });
  } catch (e) {
    console.warn('Bad JSON from ESP32:', trimmed);
  }
});