import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import FallbackWebSocket from './fallbackWebSocket';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.subscriptions = {};
    this.connectionAttempts = 0;
    this.MAX_RECONNECT_ATTEMPTS = 3;
    this.userName = ''; 
    this.gameId = '';
    this.nameExchangeInterval = null; 
    this.pendingSubscriptions = []; 
  }

  connect(onConnected, onError) {
    try {
      this.connectionAttempts++;
      console.log(`Attempting to connect to WebSocket (Attempt ${this.connectionAttempts})`);
      
      const host = window.location.hostname;
      const port = '8080';
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found - connection may fail');
      } else {
        console.log('Authentication token found for WebSocket connection');
      }
      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const stompConfig = {
        debug: function (str) {
          console.log(`STOMP: ${str}`);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        connectHeaders: headers,
        onConnect: () => {
          console.log(`Successfully connected to STOMP server`);
          this.connectionAttempts = 0;
          if (onConnected) onConnected();
        },
        onStompError: (frame) => {
          console.error(`STOMP error:`, frame);
          
          if (frame.headers && frame.headers.message && 
              frame.headers.message.includes('unauthorized')) {
            if (onError) onError(new Error('Authentication failed. Please log in again.'));
          } else {
            if (onError) onError(frame);
          }
        },
        onWebSocketError: (event) => {
          console.error(`WebSocket error:`, event);
          
          if (this.connectionAttempts <= this.MAX_RECONNECT_ATTEMPTS) {
            console.log(`Retrying connection in 2 seconds (attempt ${this.connectionAttempts})`);
            setTimeout(() => {
              this.connect(onConnected, onError);
            }, 2000);
          } else {
            console.error('Maximum reconnection attempts reached');
            if (onError) onError(new Error('Could not connect after multiple attempts. The server may be down or your session may have expired.'));
          }
        }
      };
      
      try {
        this._tryConnection(host, port, stompConfig, token);
      } catch (connectionError) {
        console.error('Connection error:', connectionError);
        throw connectionError;
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      if (onError) onError(error);
    }

    return this;
  }

  _tryConnection(host, port, stompConfig, token) {
    const tokenParam = token ? `token=${encodeURIComponent(token)}` : '';
    
    let sockJsUrl = `http://${host}:${port}/game-ws`;
    
    if (token) {
      sockJsUrl += `?${tokenParam}`;
      console.log(`Adding token to URL: ${sockJsUrl}`);
    }
    
    let wsUrl = `ws://${host}:${port}/game-ws`;
    if (token) {
      wsUrl += `?${tokenParam}`;
    }
    
    console.log(`Connecting to: ${sockJsUrl}`);
    
    try {
      const socket = new SockJS(sockJsUrl);
      
      socket.onclose = (event) => {
        if (event && event.code) {
          console.log(`SockJS closed with code: ${event.code}, reason: ${event.reason || 'No reason provided'}`);
        }
      };
      
      stompConfig.webSocketFactory = () => socket;
      this.stompClient = new Client(stompConfig);
      this.stompClient.activate();
      return;
    } catch (sockJsError) {
      console.error('SockJS connection failed:', sockJsError);
    }
    
    try {
      console.log(`Trying FallbackWebSocket connection to: ${wsUrl}`);
      const fallbackSocket = new FallbackWebSocket(wsUrl);
      stompConfig.webSocketFactory = () => fallbackSocket;
      this.stompClient = new Client(stompConfig);
      this.stompClient.activate();
      return;
    } catch (fallbackError) {
      console.error('FallbackWebSocket connection failed:', fallbackError);
    }
    
    try {
      console.log(`Trying direct WebSocket connection to: ${wsUrl}`);
      stompConfig.brokerURL = wsUrl;
      delete stompConfig.webSocketFactory;
      this.stompClient = new Client(stompConfig);
      this.stompClient.activate();
      return;
    } catch (directWsError) {
      console.error('Direct WebSocket connection failed:', directWsError);
      throw new Error('All connection methods failed');
    }
  }

  disconnect() {
    if (this.nameExchangeInterval) {
      clearInterval(this.nameExchangeInterval);
      this.nameExchangeInterval = null;
    }
    
    if (this.stompClient) {
      Object.keys(this.subscriptions).forEach(topic => {
        this.unsubscribe(topic);
      });
      
      if (this.stompClient.connected) {
        try {
          this.stompClient.deactivate();
        } catch (e) {
          console.warn('Error during disconnect:', e);
        }
      }
    }
  }

  subscribe(topic, callback) {
    if (!this.stompClient) {
      console.error('Cannot subscribe, WebSocket client not initialized');
      return;
    }
    
    if (!this.stompClient.connected) {
      console.warn('WebSocket not connected yet, will queue subscription for when connected');
      
      this.pendingSubscriptions.push({ topic, callback });
      
      if (!this.stompClient.onConnect || this.stompClient.onConnect._isOriginal) {
        const originalOnConnect = this.stompClient.onConnect;
        
        const enhancedOnConnect = frame => {
          if (originalOnConnect) originalOnConnect(frame);
          
          console.log(`Processing ${this.pendingSubscriptions.length} pending subscriptions`);
          
          while (this.pendingSubscriptions.length > 0) {
            const { topic, callback } = this.pendingSubscriptions.shift();
            this._doSubscribe(topic, callback);
          }
        };
        
        enhancedOnConnect._isOriginal = true;
        
        this.stompClient.onConnect = enhancedOnConnect;
      }
      
      return;
    }

    this._doSubscribe(topic, callback);
  }
  
  _doSubscribe(topic, callback) {
    if (!this.subscriptions[topic]) {
      try {
        this.subscriptions[topic] = this.stompClient.subscribe(topic, (message) => {
          try {
            const payload = JSON.parse(message.body);
            callback(payload);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        });
        console.log(`Successfully subscribed to topic: ${topic}`);
      } catch (error) {
        console.error(`Error subscribing to ${topic}:`, error);
      }
    }
  }

  unsubscribe(topic) {
    if (this.subscriptions[topic]) {
      try {
        this.subscriptions[topic].unsubscribe();
        delete this.subscriptions[topic];
        console.log(`Unsubscribed from topic: ${topic}`);
      } catch (error) {
        console.error(`Error unsubscribing from ${topic}:`, error);
      }
    }
  }

  send(destination, body) {
    if (!this.stompClient) {
      console.error('Cannot send message, WebSocket client not initialized');
      return;
    }
    
    if (!this.stompClient.connected) {
      console.warn('WebSocket not connected yet, will try to send when connected');
      
      if (!this.stompClient.onConnect || !this.stompClient.onConnect._hasSendHandler) {
        const originalOnConnect = this.stompClient.onConnect;
        
        const enhancedOnConnect = frame => {
          if (originalOnConnect) originalOnConnect(frame);
          
          this._doSend(destination, body);
        };
        
        enhancedOnConnect._hasSendHandler = true;
        
        this.stompClient.onConnect = enhancedOnConnect;
      }
      
      return;
    }
    
    this._doSend(destination, body);
  }
  
  _doSend(destination, body) {
    try {
      this.stompClient.publish({
        destination: destination,
        body: JSON.stringify(body)
      });
      console.log(`Message sent to ${destination}:`, body);
    } catch (error) {
      console.error(`Error sending message to ${destination}:`, error);
    }
  }

  setUserName(name) {
    this.userName = name;
    console.log(`User name set to: ${name}`);
  }

  setGameId(gameId) {
    this.gameId = gameId;
    console.log(`Current game ID set to: ${gameId}`);
  }

  startNameExchange() {
    if (!this.userName || !this.gameId) {
      console.error('Cannot start name exchange: missing user name or game ID');
      return;
    }

    if (this.nameExchangeInterval) {
      clearInterval(this.nameExchangeInterval);
    }

    this.sendNameMessage();

    this.nameExchangeInterval = setInterval(() => {
      this.sendNameMessage();
    }, 3000);

    console.log(`Started name exchange for user ${this.userName} in game ${this.gameId}`);
  }

  stopNameExchange() {
    if (this.nameExchangeInterval) {
      clearInterval(this.nameExchangeInterval);
      this.nameExchangeInterval = null;
      console.log(`Stopped name exchange for user ${this.userName}`);
    }
  }

  sendNameMessage() {
    if (!this.stompClient || !this.stompClient.connected) {
      console.warn('Cannot send name message: WebSocket not connected');
      return;
    }

    const nameMessage = {
      gameId: this.gameId,
      userId: this.userName,
      type: "NAME_EXCHANGE",
      content: `Hello, I am ${this.userName}`
    };

    this.send("/app/game.message", nameMessage);
  }

  joinGameWithNameExchange(gameId, userId, userName) {
    this.setUserName(userName || userId);
    this.setGameId(gameId);

    const joinMessage = {
      gameId: gameId,
      userId: userId,
      type: "JOIN",
      content: userName || userId
    };

    this.send("/app/game.join", joinMessage);

    const gameTopic = `/topic/game/${gameId}`;
    this.subscribe(gameTopic, (message) => {
      console.log('Received message:', message);
      
      if (message.type === "START") {
        this.startNameExchange();
      }
    });

    return this;
  }

  sendPlayerInfo(gameId, userId, playerData) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('Cannot send player info, WebSocket not connected');
      return false;
    }
    
    try {
      if (!playerData) {
        console.error('Cannot send player info: no data provided');
        return false;
      }
      
      const sanitizedData = {
        ...playerData,
        username: playerData.username || 'Player',
        elo: playerData.elo || 1200
      };
      
      if (typeof sanitizedData.elo !== 'number') {
        sanitizedData.elo = parseInt(sanitizedData.elo) || 1200;
      }
      
      const payload = {
        gameId: gameId,
        userId: userId,
        type: "PLAYER_INFO",
        content: JSON.stringify(sanitizedData)
      };
      
      this.send("/app/game.playerInfo", payload);
      console.log("Player info sent:", payload);
      
      return true;
    } catch (error) {
      console.error("Error sending player info:", error);
      return false;
    }
  }
  
  sendMove(gameId, userId, moveData) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('Cannot send move, WebSocket not connected');
      return;
    }
    
    try {
      const payload = {
        gameId: gameId,
        userId: userId,
        type: "MOVE",
        content: typeof moveData === 'string' ? moveData : JSON.stringify(moveData)
      };
      
      this.send("/app/game.move", payload);
      console.log("Move sent:", payload);
      
      return true;
    } catch (error) {
      console.error("Error sending move:", error);
      return false;
    }
  }
  
  sendDrawOffer(gameId, userId, playerName) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.log('Cannot send draw offer, WebSocket not connected');
      return false;
    }
    
    try {
      const payload = {
        gameId: gameId,
        userId: userId,
        type: "DRAW_OFFER",
        content: JSON.stringify({
          playerName: playerName
        })
      };
      
      this.send("/app/game.message", payload);
      console.log("Draw offer sent:", payload);
      
      return true;
    } catch (error) {
      console.log("Error sending draw offer:", error);
      return false;
    }
  }
  
  sendDrawResponse(gameId, userId, accepted, playerName) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('Cannot send draw response, WebSocket client not connected');
      return false;
    }
    
    try {
      const message = {
        gameId: gameId,
        userId: userId,
        type: "DRAW_RESPONSE",
        content: JSON.stringify({
          accepted: accepted,
          playerName: playerName
        })
      };
      
      this._doSend("/app/game.drawOffer", message);
      console.log("Draw response sent:", message);
      return true;
    } catch (error) {
      console.error("Error sending draw response:", error);
      return false;
    }
  }
  
  sendTimerUpdate(gameId, userId, whiteTime, blackTime) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('Cannot send timer update, WebSocket client not connected');
      return false;
    }
    
    try {
      const message = {
        gameId: gameId,
        userId: userId,
        type: "TIMER_UPDATE",
        content: JSON.stringify({
          whiteTime: whiteTime,
          blackTime: blackTime,
          timestamp: Date.now()
        })
      };
      
      this._doSend("/app/game.message", message);
      return true;
    } catch (error) {
      console.error("Error sending timer update:", error);
      return false;
    }
  }
}

export default new WebSocketService(); 
