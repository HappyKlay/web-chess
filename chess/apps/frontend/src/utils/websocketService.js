import { Client } from '@stomp/stompjs';
// Import SockJS with a fallback to direct WebSocket if SockJS fails
import SockJS from 'sockjs-client';
import FallbackWebSocket from './fallbackWebSocket';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.subscriptions = {};
    this.connectionAttempts = 0;
    this.MAX_RECONNECT_ATTEMPTS = 3;
    this.userName = ''; // Store the user's name
    this.gameId = ''; // Store the current game ID
    this.nameExchangeInterval = null; // To store the interval for name exchange
    this.pendingSubscriptions = []; // Track pending subscriptions
  }

  connect(onConnected, onError) {
    try {
      this.connectionAttempts++;
      console.log(`Attempting to connect to WebSocket (Attempt ${this.connectionAttempts})`);
      
      // Get the current hostname to handle both development and production
      const host = window.location.hostname;
      const port = '8080'; // Backend port
      
      // Get the JWT token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found - connection may fail');
      } else {
        console.log('Authentication token found for WebSocket connection');
      }
      
      // Create STOMP client headers with the JWT token
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Create configuration for STOMP client
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
          
          // Check if it's an authentication error
          if (frame.headers && frame.headers.message && 
              frame.headers.message.includes('unauthorized')) {
            if (onError) onError(new Error('Authentication failed. Please log in again.'));
          } else {
            if (onError) onError(frame);
          }
        },
        onWebSocketError: (event) => {
          console.error(`WebSocket error:`, event);
          
          // If we haven't exceeded max reconnection attempts, try again
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
        // Try connecting with different approaches
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

  // Try different connection methods until one works
  _tryConnection(host, port, stompConfig, token) {
    // Always include token in the URL as a query parameter
    // This is more reliable than relying on headers for WebSocket authentication
    const tokenParam = token ? `token=${encodeURIComponent(token)}` : '';
    
    let sockJsUrl = `http://${host}:${port}/game-ws`;
    
    // Add token parameter if present
    if (token) {
      sockJsUrl += `?${tokenParam}`;
      console.log(`Adding token to URL: ${sockJsUrl}`);
    }
    
    // Direct websocket URL
    let wsUrl = `ws://${host}:${port}/game-ws`;
    if (token) {
      wsUrl += `?${tokenParam}`;
    }
    
    console.log(`Connecting to: ${sockJsUrl}`);
    
    // First try: SockJS
    try {
      // Create SockJS socket with the URL containing token
      const socket = new SockJS(sockJsUrl);
      
      // Listen for transport errors (helps with debugging)
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
    
    // Second try: Our FallbackWebSocket implementation
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
    
    // Third try: Direct WebSocket URL
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
    // Clear the name exchange interval if it exists
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
      
      // Store the pending subscription
      this.pendingSubscriptions.push({ topic, callback });
      
      // Only set the onConnect handler if it hasn't been set yet to avoid overriding
      if (!this.stompClient.onConnect || this.stompClient.onConnect._isOriginal) {
        const originalOnConnect = this.stompClient.onConnect;
        
        // Create a new onConnect handler that processes all pending subscriptions
        const enhancedOnConnect = frame => {
          // Call the original onConnect if it exists
          if (originalOnConnect) originalOnConnect(frame);
          
          console.log(`Processing ${this.pendingSubscriptions.length} pending subscriptions`);
          
          // Process all pending subscriptions
          while (this.pendingSubscriptions.length > 0) {
            const { topic, callback } = this.pendingSubscriptions.shift();
            this._doSubscribe(topic, callback);
          }
        };
        
        // Mark this as our enhanced handler
        enhancedOnConnect._isOriginal = true;
        
        // Set the enhanced onConnect handler
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
      
      // Set or chain the onConnect callback only if needed
      if (!this.stompClient.onConnect || !this.stompClient.onConnect._hasSendHandler) {
        const originalOnConnect = this.stompClient.onConnect;
        
        const enhancedOnConnect = frame => {
          // Call the original onConnect if it exists
          if (originalOnConnect) originalOnConnect(frame);
          
          // Send the message
          this._doSend(destination, body);
        };
        
        // Mark that this handler includes a send operation
        enhancedOnConnect._hasSendHandler = true;
        
        // Set the enhanced onConnect handler
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

  // Set the user name for name exchange
  setUserName(name) {
    this.userName = name;
    console.log(`User name set to: ${name}`);
  }

  // Set the current game ID
  setGameId(gameId) {
    this.gameId = gameId;
    console.log(`Current game ID set to: ${gameId}`);
  }

  // Start name exchange when joining a game
  startNameExchange() {
    if (!this.userName || !this.gameId) {
      console.error('Cannot start name exchange: missing user name or game ID');
      return;
    }

    // Clear any existing interval
    if (this.nameExchangeInterval) {
      clearInterval(this.nameExchangeInterval);
    }

    // Send initial name message
    this.sendNameMessage();

    // Set up interval to send name messages every 3 seconds
    this.nameExchangeInterval = setInterval(() => {
      this.sendNameMessage();
    }, 3000);

    console.log(`Started name exchange for user ${this.userName} in game ${this.gameId}`);
  }

  // Stop name exchange
  stopNameExchange() {
    if (this.nameExchangeInterval) {
      clearInterval(this.nameExchangeInterval);
      this.nameExchangeInterval = null;
      console.log(`Stopped name exchange for user ${this.userName}`);
    }
  }

  // Send name message
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

  // Join a game and start name exchange
  joinGameWithNameExchange(gameId, userId, userName) {
    // Set the user name and game ID
    this.setUserName(userName || userId);
    this.setGameId(gameId);

    // Join the game
    const joinMessage = {
      gameId: gameId,
      userId: userId,
      type: "JOIN",
      content: userName || userId
    };

    // Send join message
    this.send("/app/game.join", joinMessage);

    // Subscribe to game topic
    const gameTopic = `/topic/game/${gameId}`;
    this.subscribe(gameTopic, (message) => {
      // Handle the incoming message
      console.log('Received message:', message);
      
      // If message is START, begin name exchange
      if (message.type === "START") {
        this.startNameExchange();
      }
    });

    return this;
  }

  // Improved method to send player information
  sendPlayerInfo(gameId, userId, playerData) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('Cannot send player info, WebSocket not connected');
      return false;
    }
    
    try {
      // Ensure we have valid data to send
      if (!playerData) {
        console.error('Cannot send player info: no data provided');
        return false;
      }
      
      // Ensure required fields exist with sensible defaults
      const sanitizedData = {
        ...playerData,
        username: playerData.username || 'Player',
        elo: playerData.elo || 1200
      };
      
      // Convert elo to number if it's not already
      if (typeof sanitizedData.elo !== 'number') {
        sanitizedData.elo = parseInt(sanitizedData.elo) || 1200;
      }
      
      // Make sure the playerData is properly formatted
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
  
  // Improved method to send a chess move
  sendMove(gameId, userId, moveData) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('Cannot send move, WebSocket not connected');
      return;
    }
    
    try {
      // Make sure the moveData is properly formatted
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
  
  // Send a draw offer
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
  
  // Send a response to a draw offer
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