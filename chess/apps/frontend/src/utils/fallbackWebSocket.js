/**
 * Fallback WebSocket implementation that mimics the SockJS interface
 * but uses native WebSockets instead. This is used as a fallback
 * if SockJS fails to initialize due to compatibility issues.
 */
export default class FallbackWebSocket {
  constructor(url, _unused_, options) {
    let wsUrl = url;
    let queryParams = '';
    
    if (url.includes('?')) {
      const parts = url.split('?');
      wsUrl = parts[0];
      queryParams = '?' + parts[1];
    }
    
    if (wsUrl.startsWith('http:')) {
      wsUrl = wsUrl.replace('http:', 'ws:');
    } else if (wsUrl.startsWith('https:')) {
      wsUrl = wsUrl.replace('https:', 'wss:');
    }

    if (!wsUrl.endsWith('/websocket')) {
      wsUrl = wsUrl.endsWith('/') ? `${wsUrl}websocket` : `${wsUrl}/websocket`;
    }
    
    wsUrl += queryParams;

    console.log(`FallbackWebSocket: Converted URL to ${wsUrl}`);
    
    this.url = wsUrl;
    this.options = options || {};
    this.socket = null;
    this.eventListeners = {
      open: [],
      message: [],
      close: [],
      error: []
    };
    
    this.connect();
  }

  connect() {
    try {
      console.log(`FallbackWebSocket: Connecting to ${this.url}`);
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = (event) => {
        console.log(`FallbackWebSocket: Connected to ${this.url}`);
        this.eventListeners.open.forEach(listener => listener(event));
      };
      
      this.socket.onmessage = (event) => {
        this.eventListeners.message.forEach(listener => listener(event));
      };
      
      this.socket.onclose = (event) => {
        console.log(`FallbackWebSocket: Connection closed`);
        this.eventListeners.close.forEach(listener => listener(event));
      };
      
      this.socket.onerror = (event) => {
        console.error(`FallbackWebSocket: Error`, event);
        this.eventListeners.error.forEach(listener => listener(event));
      };
    } catch (error) {
      console.error('FallbackWebSocket: Failed to create WebSocket', error);
      throw error;
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.error('FallbackWebSocket: Cannot send data, socket not open');
    }
  }

  close(code, reason) {
    if (this.socket) {
      this.socket.close(code, reason);
    }
  }

  addEventListener(type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type].push(listener);
    }
  }

  removeEventListener(type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type] = this.eventListeners[type].filter(l => l !== listener);
    }
  }
} 
