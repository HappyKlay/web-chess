import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Settings, RotateCcw, Flag, Handshake, AlertTriangle, ChevronLeft, ChevronRight, Menu, X, User } from 'lucide-react';
import { Chess } from 'chess.js';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import websocketService from '../utils/websocketService';
import { cn } from '../utils/tw-utils';
import GameOverWindow from '../components/ui/GameOverWindow';
import DrawOfferDialog from '../components/ui/DrawOfferDialog';

import bishopBlack from '../assets/chess-pieces/bishop-b.svg';
import bishopWhite from '../assets/chess-pieces/bishop-w.svg';
import kingBlack from '../assets/chess-pieces/king-b.svg';
import kingWhite from '../assets/chess-pieces/king-w.svg';
import knightBlack from '../assets/chess-pieces/knight-b.svg';
import knightWhite from '../assets/chess-pieces/knight-w.svg';
import pawnBlack from '../assets/chess-pieces/pawn-b.svg';
import pawnWhite from '../assets/chess-pieces/pawn-w.svg';
import queenBlack from '../assets/chess-pieces/queen-b.svg';
import queenWhite from '../assets/chess-pieces/queen-w.svg';
import rookBlack from '../assets/chess-pieces/rook-b.svg';
import rookWhite from '../assets/chess-pieces/rook-w.svg';

const ChessPieces = {
  w: {
    p: pawnWhite,
    n: knightWhite,
    b: bishopWhite,
    r: rookWhite,
    q: queenWhite,
    k: kingWhite
  },
  b: {
    p: pawnBlack,
    n: knightBlack,
    b: bishopBlack,
    r: rookBlack,
    q: queenBlack,
    k: kingBlack
  }
};

const GameScreen = () => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  const [chess] = useState(new Chess());
  const [currentTurn, setCurrentTurn] = useState('white');
  const [moveHistory, setMoveHistory] = useState([]);
  const [boardPosition, setBoardPosition] = useState(chess.board());
  const [currentMove, setCurrentMove] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [gameMoves, setGameMoves] = useState([]);
  const [gameId, setGameId] = useState('');
  const [userId, setUserId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isWhitePlayer, setIsWhitePlayer] = useState(true);
  const [opponent, setOpponent] = useState(null);
  
  const [whitePlayer, setWhitePlayer] = useState({ name: "PlayerOne", elo: 1450 });
  const [blackPlayer, setBlackPlayer] = useState({ name: "ChessMaster99", elo: 1800 });
  const [gameStatus, setGameStatus] = useState("Waiting for opponent...");
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [showDrawOffer, setShowDrawOffer] = useState(false);
  const [drawOfferFrom, setDrawOfferFrom] = useState(null);
  const [drawOfferPending, setDrawOfferPending] = useState(false);
  
  const [lastTimerUpdate, setLastTimerUpdate] = useState(null);
  
  useEffect(() => {
    const code = location.state?.gameId || params.code;
    if (code) {
      setGameId(code);

      console.log("location.state: ", location.state)
      
      const playerId = location.state?.userId || localStorage.getItem('id') || 
                       "guest-" + Math.random().toString(36).substring(7);
      setUserId(playerId);
      
      const playerColor = location.state?.isWhitePlayer;
      if (playerColor !== undefined) {
        setIsWhitePlayer(playerColor);
      } else {
        setIsWhitePlayer(location.state?.isHost === true);
      }
      
      console.log("Player color assignment:", playerColor ? "white" : "black");
      console.log("isWhitePlayer from location.state: ", location.state?.isWhitePlayer)
      
      const currentUser = {
        id: localStorage.getItem('id'),
        username: localStorage.getItem('username') || "You",
        elo: localStorage.getItem('elo') || 1200
      };
      
      const playerInfo = {
        name: currentUser.username,
        elo: parseInt(currentUser.elo) || 1200
      };
      
      if (playerColor) {
        setWhitePlayer(playerInfo);
        setBlackPlayer({ name: "Waiting for opponent...", elo: "?" }); 
      } else {
        setBlackPlayer(playerInfo);
        setWhitePlayer({ name: "Waiting for opponent...", elo: "?" });
      }
      
      setGameStatus("Waiting for opponent to connect...");
    } else {
      navigate('/lobby');
    }
  }, [location, params, navigate]);
  
  useEffect(() => {
    if (!gameId || !userId) return;

    websocketService.connect(
      () => {
        setIsConnected(true);
        console.log("Connected to WebSocket for game");
        
        websocketService.subscribe(`/topic/game/${gameId}`, handleGameMessage);
        
        try {
          const playerInfo = {
            username: localStorage.getItem('username') || "Guest",
            elo: localStorage.getItem('elo') || 999,
            isWhitePlayer: isWhitePlayer
          };
          
          websocketService.send("/app/game.join", {
            gameId: gameId,
            userId: userId,
            type: "JOIN",
            content: JSON.stringify(playerInfo)
          });
          
          setTimeout(() => {
            sendPlayerInfo();
          }, 1000);
          
          console.log("Sent join message with player info:", playerInfo);
        } catch (err) {
          console.error("Error sending join message:", err);
        }
      },
      (error) => {
        console.error("WebSocket error:", error);
        
        if (websocketService.mockMode) {
          setIsConnected(true);
          console.log("Using mock mode for game");
          websocketService.subscribe(`/topic/game/${gameId}`, handleGameMessage);
        }
      }
    );

    return () => {
      if (isConnected) {
        try {
          websocketService.send("/app/game.leave", {
            gameId: gameId,
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
  }, [gameId, userId, isConnected, isWhitePlayer]);
  
  useEffect(() => {
    if (!isConnected || !gameId || !userId) return;
    
    sendPlayerInfo();
    
    const playerInfoTimer = setInterval(() => {
      if (isConnected) {
        sendPlayerInfo();
      }
    }, 15000);
    
    return () => {
      clearInterval(playerInfoTimer);
    };
  }, [isConnected, gameId, userId, isWhitePlayer]);
  
  const sendPlayerInfo = () => {
    console.log("Sending player info");
    if (isConnected) {
      try {
        const username = localStorage.getItem('username');
        const elo = localStorage.getItem('elo');
        
        const playerData = {
          username: username,
          elo: parseInt(elo),
          isWhitePlayer: isWhitePlayer,
          id: userId
        };
        
        websocketService.sendPlayerInfo(gameId, userId, playerData);
        
        console.log("Sent player info to opponent:", playerData);
        
        const myInfo = {
          name: username,
          elo: parseInt(elo)
        };
        
        if (isWhitePlayer) {
          setWhitePlayer(myInfo);
        } else {
          setBlackPlayer(myInfo);
        }
      } catch (err) {
        console.error("Error sending player info:", err);
      }
    }
  };
  
  const parsePlayerData = (content) => {
    if (!content || !content.includes('{') || !content.includes('}')) {
      return null;
    }

    try {
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      const jsonStr = content.substring(jsonStart, jsonEnd);
      return JSON.parse(jsonStr);
    } catch (error) {
      console.warn("Could not parse player data:", error);
      return null;
    }
  };

  const getCurrentUserInfo = () => {
    const username = localStorage.getItem('username') || "You";
    const elo = parseInt(localStorage.getItem('elo')) || 1200;
    return { username, elo };
  };

  const updatePlayerDisplays = (opponentName, opponentElo, isWhitePlayer) => {
    const playerInfo = {
      name: opponentName,
      elo: opponentElo
    };

    if (isWhitePlayer) {
      setBlackPlayer(playerInfo);
      setGameStatus("Opponent joined. Ready to play!");
    } else {
      setWhitePlayer(playerInfo);
      setGameStatus("Host joined. Ready to play!");
    }
  };

  const handleColorConflict = (opponentIsWhite) => {
    setIsWhitePlayer(!opponentIsWhite);
    console.log("Color conflict detected! Adjusting player color to:", !opponentIsWhite ? "white" : "black");

    const currentUser = getCurrentUserInfo();
    const playerInfo = {
      name: currentUser.username,
      elo: currentUser.elo
    };

    if (!opponentIsWhite) {
      setWhitePlayer(playerInfo);
    } else {
      setBlackPlayer(playerInfo);
    }
  };

  const handleJoinMessage = (message) => {
    if (message.userId === userId) {
      setTimeout(sendPlayerInfo, 500);
      return;
    }

    try {
      let opponentName = "Opponent";
      let opponentElo = 1200;
      let opponentIsWhite = !isWhitePlayer;

      const contentData = parsePlayerData(message.content);
      if (contentData) {
        console.log("Parsed JOIN content data:", contentData);
        
        opponentName = contentData.username || opponentName;
        opponentElo = typeof contentData.elo === 'number' ? 
          contentData.elo : parseInt(contentData.elo) || opponentElo;
        
        if (contentData.isWhitePlayer !== undefined) {
          opponentIsWhite = contentData.isWhitePlayer;
          
          if (opponentIsWhite === isWhitePlayer) {
            handleColorConflict(opponentIsWhite);
          }
        }
      }

      const opponentInfo = {
        id: message.userId,
        name: opponentName,
        elo: opponentElo,
        isWhite: opponentIsWhite
      };

      console.log("Updating opponent info:", opponentInfo);
      setOpponent(opponentInfo);
      updatePlayerDisplays(opponentName, opponentElo, isWhitePlayer);

      setTimeout(sendPlayerInfo, 500);
    } catch (error) {
      console.error("Error processing opponent join:", error);
    }
  };

  const updatePlayerElo = (result, isOpponentMessage) => {
    const currentUserId = localStorage.getItem('id');
    if (!currentUserId) {
      console.log("Cannot update ELO: no user ID found");
      return;
    }
    
    const opponentId = opponent?.id || null;
    if (!opponentId) {
      console.log("Cannot update ELO: no opponent ID found");
      return;
    }
    
    if (currentUserId.startsWith('guest-') || (opponentId && opponentId.startsWith('guest-'))) {
      console.log("Skipping ELO update for guest player game");
      return;
    }
    
    let winnerId, loserId;
    let isDraw = false;
    
    if (result === 'draw') {
      isDraw = true;
    } else if (result === 'win') {
      winnerId = currentUserId;
      loserId = opponentId;
    } else if (result === 'loss') {
      winnerId = opponentId;
      loserId = currentUserId;
    } else if (result === 'resign') {
      if (isOpponentMessage) {
        winnerId = currentUserId;
        loserId = opponentId;
      } else {
        winnerId = opponentId;
        loserId = currentUserId;
      }
    }
    
    console.log(`Updating ELO - Winner: ${winnerId}, Loser: ${loserId}, Draw: ${isDraw}`);
    
    fetch('http://localhost:8080/game/updateElo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include',
      body: JSON.stringify({
        winnerId: winnerId,
        loserId: loserId,
        isDraw: isDraw
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to update ELO ratings');
      }
      console.log('ELO ratings updated successfully');
    })
    .catch(error => {
      console.error('Error updating ELO ratings:', error);
    });
  };

  const handleTimeOut = useCallback((color) => {
    if (showGameOver || gameResult) return;
    
    console.log(`${color} player ran out of time`);
    
    let result;
    let playerName;
    
    if ((isWhitePlayer && color === 'white') || (!isWhitePlayer && color === 'black')) {
      result = 'loss';
      playerName = isWhitePlayer ? whitePlayer.name : blackPlayer.name;
    } else {
      result = 'win';
      playerName = isWhitePlayer ? whitePlayer.name : blackPlayer.name;
    }
    
    if (isConnected) {
      try {
        const gameOverData = {
          result: result,
          playerName: playerName,
          isWhitePlayer: isWhitePlayer,
          reason: 'timeout'
        };
        
        console.log('Sending timeout game over data:', gameOverData);
        
        websocketService.send("/app/game.gameOver", {
          gameId: gameId,
          userId: userId,
          type: "GAME_OVER",
          content: JSON.stringify(gameOverData)
        });
        
        updatePlayerElo(result, false);
      } catch (err) {
        console.error("Error sending timeout game over message:", err);
      }
    }
    
    setGameResult({
      result: result,
      playerName: playerName,
      reason: 'timeout'
    });
    setShowGameOver(true);
    setGameStatus("Game Over - Timeout");
  }, [showGameOver, gameResult, isWhitePlayer, whitePlayer, blackPlayer, isConnected, gameId, userId, setGameResult, setShowGameOver, setGameStatus]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentTurn === 'white') {
        setWhiteTime(prev => {
          const newTime = Math.max(0, prev - 1);
          if (isConnected && prev % 5 === 0) {
            websocketService.sendTimerUpdate(gameId, userId, newTime, blackTime);
          }
          if (newTime === 0) {
            handleTimeOut('white');
          }
          return newTime;
        });
      } else {
        setBlackTime(prev => {
          const newTime = Math.max(0, prev - 1);
          if (isConnected && prev % 5 === 0) {
            websocketService.sendTimerUpdate(gameId, userId, whiteTime, newTime);
          }
          if (newTime === 0) {
            handleTimeOut('black');
          }
          return newTime;
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentTurn, isConnected, gameId, userId, whiteTime, blackTime, handleTimeOut]);

  const handleTimerUpdate = (message) => {
    if (message.userId !== userId) {
      try {
        const timerData = JSON.parse(message.content);
        console.log("Received timer update:", timerData);
        
        if (timerData.timestamp && (!lastTimerUpdate || timerData.timestamp > lastTimerUpdate)) {
          setWhiteTime(timerData.whiteTime);
          setBlackTime(timerData.blackTime);
          setLastTimerUpdate(timerData.timestamp);
        }
      } catch (error) {
        console.error("Error processing timer update:", error);
      }
    }
  };

  const handleStartMessage = (message) => {
    if (isPlayerTurn()) {
      setGameStatus("Game started! Make your move.");
    } else {
      setGameStatus("Game started! Waiting for opponent's move.");
    }
    
    if (isConnected) {
      setTimeout(() => {
        websocketService.sendTimerUpdate(gameId, userId, whiteTime, blackTime);
      }, 500);
    }
    
    console.log("Game has started:", message.content);
  };

  const handleGameMessage = (message) => {
    console.log("Game message received:", message);
    
    switch (message.type) {
      case "JOIN":
        handleJoinMessage(message);
        break;
        
      case "MOVE":
        if (message.userId !== userId) {
          try {
            const moveData = JSON.parse(message.content);
            console.log("Received move from opponent:", moveData);
            
            if (currentMove === moveHistory.length) {
              const move = chess.move({
                from: moveData.from,
                to: moveData.to,
                promotion: moveData.promotion
              });
              
              if (move) {
                setMoveHistory(prev => [...prev, { 
                  notation: moveData.notation || move.san, 
                  id: prev.length + 1 
                }]);
                
                setGameMoves(prev => [...prev, { 
                  from: move.from, 
                  to: move.to, 
                  promotion: move.promotion 
                }]);
                
                setCurrentMove(prev => prev + 1);
                
                setBoardPosition(chess.board());
                
                const newTurn = currentTurn === 'white' ? 'black' : 'white';
                setCurrentTurn(newTurn);
                
                if (isConnected) {
                  websocketService.sendTimerUpdate(gameId, userId, whiteTime, blackTime);
                }
                
                setGameStatus("Your turn to move");
              }
            }
          } catch (error) {
            console.error("Error processing opponent's move:", error);
          }
        }
        break;
        
      case "TIMER_UPDATE":
        handleTimerUpdate(message);
        break;
        
      case "GAME_OVER":
        try {
          const gameOverData = JSON.parse(message.content);
          console.log('Received game over data:', gameOverData);
          
          if (message.userId !== userId) {
            console.log('Processing opponent game over message');
            if (gameOverData.result === 'resign') {
              gameOverData.result = 'win';
              gameOverData.playerName = isWhitePlayer ? whitePlayer.name : blackPlayer.name;
            } else if (gameOverData.result === 'win') {
              gameOverData.result = 'loss';
              gameOverData.playerName = isWhitePlayer ? whitePlayer.name : blackPlayer.name;
            }
            console.log('Processed result:', gameOverData.result);
          }
          
          setGameResult(gameOverData);
          setShowGameOver(true);
          setGameStatus("Game Over");
          
          if (gameOverData.result !== 'draw') {
            updatePlayerElo(gameOverData.result, message.userId !== userId);
          }
        } catch (error) {
          console.error("Error processing game over message:", error);
        }
        break;
        
      case "START":
        handleStartMessage(message);
        break;
        
      case "LEAVE":
        if (message.userId !== userId) {
          console.log("Opponent left the game");
          
          const opponentInfo = isWhitePlayer ? 
            { name: "Opponent left", elo: blackPlayer.elo } : 
            { name: "Opponent left", elo: whitePlayer.elo };
            
          if (isWhitePlayer) {
            setBlackPlayer(opponentInfo);
          } else {
            setWhitePlayer(opponentInfo);
          }
        }
        break;
        
      case "PLAYER_INFO":
        if (message.userId !== userId) {
          try {
            let opponentName = "Opponent";
            let opponentElo = 1200;
            let opponentIsWhite = !isWhitePlayer;
            
            try {
              const playerData = JSON.parse(message.content);
              console.log("Received playerData:", playerData);
              
              if (playerData.username) opponentName = playerData.username;
              if (playerData.elo !== undefined && playerData.elo !== null) {
                opponentElo = typeof playerData.elo === 'number' ? 
                  playerData.elo : parseInt(playerData.elo) || 1200;
              }
              
              if (playerData.isWhitePlayer !== undefined) {
                opponentIsWhite = playerData.isWhitePlayer;
                
                if (opponentIsWhite === isWhitePlayer) {
                  setIsWhitePlayer(!opponentIsWhite);
                  console.log("Color conflict detected in PLAYER_INFO! Adjusting player color to:", !opponentIsWhite ? "white" : "black");
                  
                  const currentUser = {
                    username: localStorage.getItem('username') || "You",
                    elo: localStorage.getItem('elo') || "1200"
                  };
                  
                  const playerInfo = {
                    name: currentUser.username,
                    elo: parseInt(currentUser.elo) || 1200
                  };
                  
                  if (!opponentIsWhite) {
                    setWhitePlayer(playerInfo);
                    setBlackPlayer({ name: opponentName, elo: opponentElo });
                  } else {
                    setBlackPlayer(playerInfo);
                    setWhitePlayer({ name: opponentName, elo: opponentElo });
                  }
                  
                  sendPlayerInfo();
                  
                  return;
                }
              }
              
              const opponentInfo = {
                id: message.userId,
                name: opponentName,
                elo: opponentElo,
                isWhite: opponentIsWhite
              };
              
              console.log("Received player info update:", opponentInfo);
              
              setOpponent(opponentInfo);
              
              if (isWhitePlayer) {
                setBlackPlayer({
                  name: opponentName,
                  elo: opponentElo
                });
                setGameStatus("Game ready. Waiting for moves...");
              } else {
                setWhitePlayer({
                  name: opponentName,
                  elo: opponentElo
                });
                setGameStatus("Game ready. Waiting for moves...");
              }
            } catch (e) {
              console.warn("Failed to parse player info:", e);
            }
          } catch (error) {
            console.error("Error processing player info:", error);
          }
        }
        break;
        
      case "DRAW_OFFER":
        try {
          if (message.userId !== userId) {
            const offerData = JSON.parse(message.content);
            console.log('Received draw offer from opponent:', offerData);
            
            setDrawOfferFrom(offerData.playerName);
            setShowDrawOffer(true);
            
            setGameStatus("Opponent offered a draw");
          } else {
            setDrawOfferPending(true);
            setGameStatus("Draw offer sent. Waiting for opponent response...");
          }
        } catch (error) {
          console.error("Error processing draw offer:", error);
        }
        break;
        
      case "DRAW_RESPONSE":
        try {
          const responseData = JSON.parse(message.content);
          console.log('Received draw response:', responseData);
          
          setDrawOfferPending(false);
          
          if (message.userId !== userId) {
            if (responseData.accepted) {
              console.log('Opponent accepted draw offer');
              
              const gameOverData = {
                result: 'draw',
                playerName: isWhitePlayer ? whitePlayer.name : blackPlayer.name,
                isWhitePlayer: isWhitePlayer
              };
              
              setGameResult(gameOverData);
              setShowGameOver(true);
              setGameStatus("Game Over - Draw Accepted");
              
              updatePlayerElo('draw', false);
            } else {
              console.log('Opponent declined draw offer');
              setGameStatus("Draw offer declined");
            }
          } else if (responseData.accepted) {
            setGameStatus("You accepted the draw offer");
          }
        } catch (error) {
          console.error("Error processing draw response:", error);
        }
        break;
        
      default:
        console.log("Unknown game message type:", message.type);
    }
  };
  
  useEffect(() => {
    const tempChess = new Chess();
    
    for (let i = 0; i < currentMove; i++) {
      if (gameMoves[i]) {
        try {
          tempChess.move(gameMoves[i]);
        } catch (error) {
          console.error("Error applying move:", error);
        }
      }
    }
    
    setBoardPosition(tempChess.board());
    setCurrentTurn(tempChess.turn() === 'w' ? 'white' : 'black');
    
    setSelectedSquare(null);
  }, [currentMove, gameMoves]);
  
  const isPlayerTurn = () => {
    console.log("isWhitePlayer: ", isWhitePlayer)
    return (isWhitePlayer && currentTurn === 'white') || (!isWhitePlayer && currentTurn === 'black');
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  const handleSquareClick = (square) => {
    if (currentMove !== moveHistory.length) {
      return;
    }
    
    const playerColor = isWhitePlayer ? 'white' : 'black';
    if (currentTurn !== playerColor) {
      return;
    }

    if (!selectedSquare) {
      const piece = chess.get(square);
      if (piece && piece.color === (currentTurn === 'white' ? 'w' : 'b')) {
        setSelectedSquare(square);
      }
      return;
    }

    try {
      const move = chess.move({
        from: selectedSquare,
        to: square,
        promotion: 'q'
      });

      if (move) {
        setMoveHistory(prev => [...prev, { notation: move.san, id: prev.length + 1 }]);
        setGameMoves(prev => [...prev, { from: move.from, to: move.to, promotion: move.promotion }]);
        setCurrentMove(moveHistory.length + 1);
        
        setBoardPosition(chess.board());
        
        setCurrentTurn(currentTurn === 'white' ? 'black' : 'white');
        
        if (isConnected) {
          websocketService.sendTimerUpdate(gameId, userId, whiteTime, blackTime);
        }
        
        if (chess.isGameOver()) {
          let result;
          if (chess.isCheckmate()) {
            const moveColor = move.color;
            const playerColor = isWhitePlayer ? 'w' : 'b';
            result = moveColor === playerColor ? 'win' : 'loss';
            console.log(`Game Over - Move Color: ${moveColor}, Player Color: ${playerColor}, Result: ${result}`);
          } else if (chess.isDraw()) {
            result = 'draw';
          }
          
          if (isConnected) {
            try {
              const gameOverData = {
                result: result,
                playerName: isWhitePlayer ? whitePlayer.name : blackPlayer.name,
                isWhitePlayer: isWhitePlayer
              };
              
              console.log('Sending game over data:', gameOverData);
              
              websocketService.send("/app/game.gameOver", {
                gameId: gameId,
                userId: userId,
                type: "GAME_OVER",
                content: JSON.stringify(gameOverData)
              });
              
              updatePlayerElo(result, false);
            } catch (err) {
              console.error("Error sending game over message:", err);
            }
          }
          
          setGameStatus("Game Over");
          return;
        }
        
        setGameStatus("Move sent. Waiting for opponent...");
        
        if (isConnected) {
          try {
            const moveData = {
              from: move.from,
              to: move.to,
              promotion: move.promotion,
              notation: move.san
            };
            
            websocketService.sendMove(gameId, userId, moveData);
          } catch (err) {
            console.error("Error sending move:", err);
          }
        }
      }

      setSelectedSquare(null);
    } catch (error) {
      const piece = chess.get(square);
      if (piece && piece.color === (currentTurn === 'white' ? 'w' : 'b')) {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
    }
  };

  const handleDraw = () => {
    if (!isConnected) return;

    if (drawOfferPending) {
      console.log("Draw offer already pending");
      return;
    }

    try {
      const playerName = isWhitePlayer ? whitePlayer.name : blackPlayer.name;
      console.log("Sending draw offer with player name:", playerName);
      console.log("WebsocketService state:", {
        connected: websocketService.stompClient?.connected,
        gameId,
        userId
      });
      
      const success = websocketService.sendDrawOffer(gameId, userId, playerName);
      console.log("Draw offer send result:", success);
      
      setGameStatus("Draw offer sent. Waiting for opponent...");
      setDrawOfferPending(true);
    } catch (err) {
      console.log("Error sending draw offer:", err);
    }
  };
  
  const handleAcceptDraw = () => {
    if (!isConnected) return;
    
    try {
      setShowDrawOffer(false);
      
      const playerName = isWhitePlayer ? whitePlayer.name : blackPlayer.name;
      websocketService.sendDrawResponse(gameId, userId, true, playerName);
      
      const gameOverData = {
        result: 'draw',
        playerName: playerName,
        isWhitePlayer: isWhitePlayer
      };
      
      console.log('Sending draw acceptance:', gameOverData);
      
      websocketService.send("/app/game.gameOver", {
        gameId: gameId,
        userId: userId,
        type: "GAME_OVER",
        content: JSON.stringify(gameOverData)
      });
      
      setGameResult({
        result: 'draw',
        playerName: playerName
      });
      setShowGameOver(true);
      setGameStatus("Game Over - Draw");
      
      updatePlayerElo('draw', false);
    } catch (err) {
      console.error("Error accepting draw:", err);
    }
  };
  
  const handleDeclineDraw = () => {
    if (!isConnected) return;
    
    try {
      setShowDrawOffer(false);
      
      const playerName = isWhitePlayer ? whitePlayer.name : blackPlayer.name;
      websocketService.sendDrawResponse(gameId, userId, false, playerName);
      
      setGameStatus("Draw declined. Continue playing.");
    } catch (err) {
      console.error("Error declining draw:", err);
    }
  };

  const handleResign = () => {
    if (!isConnected) return;

    try {
      const gameOverData = {
        result: 'resign',
        playerName: isWhitePlayer ? whitePlayer.name : blackPlayer.name,
        isWhitePlayer: isWhitePlayer
      };
      
      console.log('Sending resignation:', gameOverData);
      
      websocketService.send("/app/game.gameOver", {
        gameId: gameId,
        userId: userId,
        type: "GAME_OVER",
        content: JSON.stringify(gameOverData)
      });

      setGameResult({
        result: 'resign',
        playerName: isWhitePlayer ? whitePlayer.name : blackPlayer.name
      });
      setShowGameOver(true);
      setGameStatus("Game Over - You resigned");
      
      updatePlayerElo('resign', false);
    } catch (err) {
      console.error("Error sending resignation:", err);
    }
  };

  const renderPiece = (piece) => {
    if (!piece) return null;
    const PieceImage = ChessPieces[piece.color][piece.type];
    return <img src={PieceImage} alt={`${piece.color} ${piece.type}`} className="w-3/3 h-3/3 object-contain" />;
  };

  const renderChessBoard = () => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    
    const boardToRender = isWhitePlayer ? boardPosition : [...boardPosition].reverse().map(row => [...row].reverse());
    
    return (
      <div className="grid grid-cols-8 border border-zinc-700 rounded-md overflow-hidden shadow-lg">
        {boardToRender.flat().map((piece, index) => {
          let rank, file, square;
          
          if (isWhitePlayer) {
            rank = 8 - Math.floor(index / 8);
            file = files[index % 8];
            square = `${file}${rank}`;
          } else {
            rank = Math.floor(index / 8) + 1;
            file = files[7 - (index % 8)];
            square = `${file}${rank}`;
          }
          
          const isWhiteSquare = (rank + "abcdefgh".indexOf(file)) % 2 === 0;
          const isSelected = selectedSquare === square;
          
          return (
            <div 
              key={square} 
              className={cn(
                "w-full aspect-square flex items-center justify-center cursor-pointer transition-all",
                isWhiteSquare ? "bg-zinc-200" : "bg-zinc-600",
                isSelected && "ring-2 ring-blue-500",
                !isSelected && "hover:opacity-80"
              )}
              onClick={() => handleSquareClick(square)}
            >
              {renderPiece(piece)}
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderPlayerSection = (isBottomPlayer) => {
    const playerData = isBottomPlayer 
      ? (isWhitePlayer ? whitePlayer : blackPlayer) 
      : (isWhitePlayer ? blackPlayer : whitePlayer);
    
    const isThisTurn = isBottomPlayer 
      ? ((isWhitePlayer && currentTurn === 'white') || (!isWhitePlayer && currentTurn === 'black'))
      : ((isWhitePlayer && currentTurn === 'black') || (!isWhitePlayer && currentTurn === 'white'));
    
    const timeDisplay = isBottomPlayer
      ? (isWhitePlayer ? whiteTime : blackTime)
      : (isWhitePlayer ? blackTime : whiteTime);
    
    const isWaiting = !playerData.name || 
                     playerData.name.includes("Waiting") || 
                     playerData.elo === "?" || 
                     playerData.name === "Opponent";

    console.log("Rendering player section:", playerData);

    return (
      <div className={cn(
        "p-4 border-zinc-700/50",
        isBottomPlayer ? "border-t mt-auto" : "border-b",
        isThisTurn && "bg-zinc-700/30"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isWaiting ? "bg-zinc-800" : "bg-zinc-700"
            )}>
              <User size={14} className={cn(
                isWaiting ? "text-zinc-600" : "text-zinc-400"
              )} />
            </div>
            <div>
              <h3 className={cn(
                "font-medium",
                isWaiting ? "text-zinc-500" : "text-zinc-300"
              )}>
                {playerData.name || "Waiting for player..."}
              </h3>
              <p className="text-zinc-500 text-xs">
                Elo: {playerData.elo || "?"}
              </p>
            </div>
          </div>
          <div className={cn(
            "px-3 py-1 rounded flex items-center gap-1",
            isThisTurn ? "bg-zinc-600 text-zinc-200" : "bg-zinc-800/50 text-zinc-500"
          )}>
            <Clock size={14} />
            <span className="font-mono">{formatTime(timeDisplay)}</span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col md:flex-row items-stretch p-4 md:p-6">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-zinc-900/50 pointer-events-none" />
      
      {/* Game Over Window */}
      {showGameOver && gameResult && (
        <GameOverWindow
          result={gameResult.result}
          playerName={gameResult.playerName}
          onRematch={() => {
            chess.reset();
            setMoveHistory([]);
            setGameMoves([]);
            setCurrentMove(0);
            setBoardPosition(chess.board());
            setCurrentTurn('white');
            setShowGameOver(false);
            setGameResult(null);
            setWhiteTime(600);
            setBlackTime(600);
            setGameStatus("Game restarted. Make your move.");
          }}
          onExit={() => {
            // Delete game from database
            fetch(`http://localhost:8080/game/${gameId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              credentials: 'include'
            })
            .then(response => {
              if (!response.ok) {
                throw new Error('Failed to delete game');
              }
              // Navigate back to lobby
              navigate('/lobby');
            })
            .catch(error => {
              console.error('Error deleting game:', error);
              // Still navigate to lobby even if delete fails
              navigate('/lobby');
            });
          }}
        />
      )}
      
      {/* Draw Offer Dialog */}
      {showDrawOffer && (
        <DrawOfferDialog
          opponentName={drawOfferFrom}
          onAccept={handleAcceptDraw}
          onDecline={handleDeclineDraw}
        />
      )}
      
      <div className="relative z-10 flex flex-col md:flex-row w-full gap-4 md:gap-6 max-w-7xl mx-auto">

        {/* Chess Board Section */}
        <div className="w-full md:w-2/3 lg:w-3/4">
          <div className="max-w-2xl mx-auto">
            {renderChessBoard()}
          </div>
        </div>
        
        {/* Game Menu Section */}
        <div className="w-full md:w-1/3 lg:w-1/4">
          <motion.div 
            className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/30 rounded-lg overflow-hidden h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Mobile toggle */}
            <div className="md:hidden flex justify-end p-2">
              <button 
                onClick={() => setMenuOpen(!menuOpen)} 
                className="p-2 text-zinc-400 hover:text-zinc-200"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
            
            <div className={cn("flex flex-col h-full", !menuOpen && "hidden md:flex")}>
              {/* Top player (opponent) */}
              {renderPlayerSection(false)}
              
              {/* Game status */}
              <div className="p-3 bg-zinc-800/50 border-b border-zinc-700/30 text-center">
                <span className={cn(
                  "text-sm font-medium",
                  gameStatus.includes("Waiting") ? "text-zinc-400" : 
                  gameStatus.includes("started") ? "text-green-400" : 
                  "text-blue-400"
                )}>
                  {gameStatus}
                </span>
              </div>
              
              {/* Move history */}
              <div className="flex-grow overflow-auto p-4 border-b border-zinc-700/50">
                <h3 className="text-zinc-400 text-sm mb-1 flex items-center justify-between">
                  <span>Move History</span>
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
                      disabled={currentMove <= 0}
                      onClick={() => setCurrentMove(prev => Math.max(0, prev - 1))}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
                      disabled={currentMove >= moveHistory.length}
                      onClick={() => setCurrentMove(prev => Math.min(moveHistory.length, prev + 1))}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </h3>
                
                <div className="grid grid-cols-2 gap-1 text-sm">
                  {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 w-6">{i+1}.</span>
                        <button 
                          className={cn(
                            "px-2 py-1 rounded", 
                            currentMove === i*2+1 ? "bg-zinc-700 text-zinc-200" : "hover:bg-zinc-800/70 text-zinc-300"
                          )}
                          onClick={() => setCurrentMove(i*2+1)}
                        >
                          {moveHistory[i*2]?.notation}
                        </button>
                      </div>
                      {moveHistory[i*2+1] && (
                        <div className="flex items-center gap-2">
                          <button 
                            className={cn(
                              "px-2 py-1 rounded", 
                              currentMove === i*2+2 ? "bg-zinc-700 text-zinc-200" : "hover:bg-zinc-800/70 text-zinc-300"
                            )}
                            onClick={() => setCurrentMove(i*2+2)}
                          >
                            {moveHistory[i*2+1]?.notation}
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              {/* Game controls */}
              <div className="p-4 border-b border-zinc-700/50">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded text-xs transition-colors",
                      drawOfferPending 
                        ? "bg-blue-900/30 text-blue-300 cursor-not-allowed" 
                        : "bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200"
                    )}
                    onClick={handleDraw}
                    disabled={drawOfferPending}
                  >
                    <Handshake size={16} className={cn("mb-1", drawOfferPending && "text-blue-300")} />
                    <span>{drawOfferPending ? "Offer Pending..." : "Draw"}</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                  onClick={handleResign}>
                    <Flag size={16} className="mb-1" />
                    <span>Resign</span>
                  </button>
                </div>
              </div>
              
              {/* Bottom player (current user) */}
              {renderPlayerSection(true)}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;