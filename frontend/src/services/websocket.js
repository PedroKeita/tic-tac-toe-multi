const WS_URL = import.meta.env.VITE_WS_URL ?? `ws://${window.location.hostname}:8080`;

class GameWebSocket {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.connected = false;
    this._connectPromise = null;
    this._reconnectTimer = null;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING && this._connectPromise) {
      return this._connectPromise;
    }

    this._connectPromise = new Promise((resolve, reject) => {
      let isSettled = false;
      const ws = new WebSocket(WS_URL);
      this.ws = ws;

      ws.onopen = () => {
        isSettled = true;
        this.connected = true;
        this._connectPromise = null;
        this._notify('_connected');
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this._notify(message.type, message);
        } catch (e) {
          console.error('[WS] Failed to parse message:', e);
        }
      };

      ws.onclose = (event) => {
        this.connected = false;
        this._connectPromise = null;
        this._notify('_disconnected');
        if (!isSettled) {
          isSettled = true;
          reject(new Error(`WebSocket fechado antes de abrir (codigo: ${event.code})`));
        }
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        if (!isSettled) {
          isSettled = true;
          this._connectPromise = null;
          reject(err);
        }
      };
    });

    return this._connectPromise;
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
      this._connectPromise = null;
    }
  }

  isConnected() {
    return this.connected;
  }
}

export const gameSocket = new GameWebSocket();
