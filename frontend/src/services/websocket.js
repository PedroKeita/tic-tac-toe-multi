const WS_URL = 'ws://localhost:8080';

class GameWebSocket {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.connected = false;
    this._reconnectTimer = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.connected = true;
        this._notify('_connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this._notify(message.type, message);
        } catch (e) {
          console.error('[WS] Failed to parse message:', e);
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this._notify('_disconnected');
      };

      this.ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        if (!this.connected) reject(err);
      };
    });
  }

  send(type, payloadObj = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const message = {
      type,
      sender: null,
      payload: JSON.stringify(payloadObj),
      timestamp: Date.now(),
    };
    this.ws.send(JSON.stringify(message));
  }

  on(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }

  off(type, callback) {
    if (!this.listeners.has(type)) return;
    if (!callback) {
      this.listeners.delete(type);
    } else {
      this.listeners.set(
        type,
        this.listeners.get(type).filter((cb) => cb !== callback)
      );
    }
  }

  _notify(type, data) {
    const cbs = this.listeners.get(type) || [];
    cbs.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error(`[WS] Listener error for ${type}:`, e);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }
}

export const gameSocket = new GameWebSocket();
