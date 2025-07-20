import { useState, useEffect } from "react";
import { Card, CardContent } from "../../src/components/ui/Card";
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from "../../src/components/ui/Button";
import { motion } from "framer-motion";
import { User, Clock, X, Copy } from "lucide-react";
import axios from "axios";
import websocketService from "../utils/websocketService";

export default function WaitingRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [playerData, setPlayerData] = useState({ username: "", elo: 0 });
  const [gameCode, setGameCode] = useState("");
  const [error, setError] = useState(null);
  const [opponents, setOpponents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isGameCreator, setIsGameCreator] = useState(true);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (params.code && !location.state) {
      setGameCode(params.code);
      setIsGameCreator(false);
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUserId(currentUser.id || "guest-" + Math.random().toString(36).substring(7));
      setPlayerData({
        username: currentUser.username || "Guest",
        elo: currentUser.elo || 1000
      });
      
      return;
    }

    if (!location.state) {
      navigate('/');
      return;
    }

    const { gameCode, hostUsername, hostElo, waitingSeconds, userId, isHost } = location.state;
    setGameCode(gameCode);
    setPlayerData({ 
      username: hostUsername, 
      elo: hostElo 
    });
    setUserId(userId || "user-" + Math.random().toString(36).substring(7));
    
    setIsGameCreator(isHost !== undefined ? isHost : true);
    console.log("Is game creator:", isHost !== undefined ? isHost : true);
    
    if (waitingSeconds) {
      setElapsedTime(waitingSeconds);
    }
  }, [location.state, navigate, params.code]);

  useEffect(() => {
    if (!gameCode || !userId) return;

    setError(null);
    
    websocketService.connect(
      () => {
        setIsConnected(true);
        console.log("Connected to WebSocket");
        
        websocketService.subscribe(`/topic/game/${gameCode}`, handleGameMessage);
        
        websocketService.send("/app/game.join", {
          gameId: gameCode,
          userId: userId,
          type: "JOIN",
          content: playerData.username
        });
      },
      (error) => {
        console.error("WebSocket error:", error);
        
        if (error instanceof Event) {
          setError("Cannot connect to game server. Please ensure the server is running and try again.");
        } else if (error.headers && error.headers.message) {
          setError(`Server error: ${error.headers.message}`);
        } else {
          setError("Failed to connect to game server. Please try again later.");
        }
      }
    );

    return () => {
      if (isConnected) {
        try {
          websocketService.send("/app/game.leave", {
            gameId: gameCode,
            userId: userId,
            type: "LEAVE",
            content: ""
          });
        } catch (err) {
          console.error("Error sending leave message:", err);
        }
        websocketService.disconnect();
      }
    };
  }, [gameCode, userId, playerData.username, isConnected]);

  const handleGameMessage = (message) => {
    console.log("Received message:", message);
    
    switch (message.type) {
      case "JOIN":
        console.log("--------------------------------");
        console.log("message.userId", message.userId);
        console.log("userId", userId);
        if (message.userId !== userId) {
          setOpponents(prev => [...prev.filter(p => p.id !== message.userId), {
            id: message.userId,
            username: message.content
          }]);
        }
        break;
        
      case "START":
        navigate(`/game/${gameCode}`, {
          state: {
            gameId: gameCode,
            userId: userId,
            isWhitePlayer: isGameCreator,
            isHost: isGameCreator
          }
        });
        break;
        
      case "LEAVE":
        if (message.userId !== userId) {
          setOpponents(prev => prev.filter(p => p.id !== message.userId));
        }
        break;
        
      default:
        console.log("Unknown message type:", message.type);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async () => {
    try {
      if (isConnected) {
        websocketService.send("/app/game.leave", {
          gameId: gameCode,
          userId: userId,
          type: "LEAVE",
          content: ""
        });
      }
      
      if (isGameCreator) {
        await axios.delete(`http://localhost:8080/waiting-room/${gameCode}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      
      await axios.delete(`http://localhost:8080/game/${gameCode}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      navigate('/lobby');
    } catch (err) {
      console.error("Failed to close waiting room:", err);
      setError("Failed to close waiting room. Please try again.");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-6">
        <div className="bg-zinc-800/50 backdrop-blur-sm border border-red-900/30 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-zinc-200 mb-4">Connection Error</h2>
          <p className="text-red-400 mb-6">{error}</p>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
              onClick={() => {
                setError(null);
                websocketService.connect(
                  () => {
                    setIsConnected(true);
                    websocketService.subscribe(`/topic/game/${gameCode}`, handleGameMessage);
                    websocketService.send("/app/game.join", {
                      gameId: gameCode,
                      userId: userId,
                      type: "JOIN",
                      content: playerData.username
                    });
                  },
                  (err) => {
                    console.error("Reconnection error:", err);
                    setError("Failed to reconnect. Please try again later.");
                  }
                );
              }}
            >
              Try Again
            </Button>
            <Button 
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              onClick={() => navigate('/lobby')}
            >
              Back to Lobby
            </Button>
          </div>
          
          <div className="mt-6 border-t border-zinc-700 pt-4">
            <p className="text-zinc-400 text-sm">
              If the problem persists, ensure that:
            </p>
            <ul className="text-zinc-500 text-sm list-disc list-inside mt-2 space-y-1">
              <li>The game server is running at port 8080</li>
              <li>Your internet connection is stable</li>
              <li>No firewall is blocking the connection</li>
            </ul>
            
            <div className="mt-5 pt-4 border-t border-zinc-700">
              <p className="text-zinc-400 text-sm mb-3">
                If the server is unavailable, you can use mock mode for testing:
              </p>
              <Button
                className="w-full bg-amber-800/50 hover:bg-amber-700/50 text-amber-200 border border-amber-900"
                onClick={() => {
                  websocketService.mockMode = true;
                  setError(null);
                  
                  setTimeout(() => {
                    setIsConnected(true);
                    
                    websocketService.subscribe(`/topic/game/${gameCode}`, handleGameMessage);
                    
                    websocketService.send("/app/game.join", {
                      gameId: gameCode,
                      userId: userId,
                      type: "JOIN",
                      content: playerData.username
                    });
                  }, 500);
                }}
              >
                Continue in Mock Mode
              </Button>
              
              <p className="text-zinc-500 text-xs mt-2 text-center">
                Mock mode simulates the game flow without a real server
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-6">
      {/* Subtle background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-zinc-900/50 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/30 rounded-lg overflow-hidden">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-light tracking-wide text-zinc-300">
                  {opponents.length > 0 ? "Opponent found!" : "Waiting for opponent"}
                </h2>
                
                <Button 
                  variant="ghost" 
                  className="p-1 h-auto bg-transparent hover:bg-zinc-700/50 text-zinc-500"
                  onClick={handleCancel}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Player info */}
              <div className="flex items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
                <div className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center">
                  <User className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-zinc-200 font-medium">{playerData.username}</h3>
                  <p className="text-zinc-500 text-sm">Elo: {playerData.elo}</p>
                </div>
              </div>
              
              {/* Opponent info if available */}
              {opponents.length > 0 && (
                <div className="flex items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
                  <div className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center">
                    <User className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="text-zinc-200 font-medium">{opponents[0].username}</h3>
                    <p className="text-zinc-500 text-sm">Opponent</p>
                  </div>
                </div>
              )}
              
              {/* Game code */}
              <div className="mb-8">
                <p className="text-xs uppercase text-zinc-500 mb-2">Game Code</p>
                <div className="flex items-center gap-2">
                  <div className="bg-zinc-800/70 border border-zinc-700/50 rounded px-4 py-2 text-zinc-300 flex-1 font-mono">
                    {gameCode}
                  </div>
                  <Button 
                    className="bg-transparent border border-zinc-700 hover:bg-zinc-800 text-zinc-300 p-2 h-auto"
                    onClick={copyGameCode}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-zinc-500 mt-1">Copied to clipboard</p>
                )}
              </div>
              
              {/* Waiting animation or Ready message */}
              {opponents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 mb-6">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-zinc-700/50" 
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <Clock className="w-8 h-8 text-zinc-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-zinc-400 text-sm">Waiting time</p>
                    <p className="text-zinc-300 font-mono">{formatTime(elapsedTime)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 mb-6">
                  <p className="text-green-400">Starting game...</p>
                </div>
              )}
              
              <Button 
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-md py-2 transition-all duration-300"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}