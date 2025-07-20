import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { motion } from "framer-motion";
import { Plus, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import CreateWaitingRoomButton from "../components/ui/CreateWaitingRoomButton";

export default function Lobby() {
  const [gameList, setGameList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        if (gameList.length === 0) {
          setLoading(true);
        }
        const response = await axios.get("http://localhost:8080/game/list");
        
        const newGameList = response.data;
        const hasChanged = JSON.stringify(newGameList) !== JSON.stringify(gameList);

        console.log(newGameList);
        
        if (hasChanged) {
          setGameList(newGameList);
        }
        
        setError(null);
      } catch (err) {
        console.error("Failed to fetch games:", err);
        setError("Failed to load games. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
    
    const intervalId = setInterval(fetchGames, 2000);
    
    return () => clearInterval(intervalId);
  }, [gameList]);

  useEffect(() => {
    const userId = localStorage.getItem('id');
    
    const updateUserElo = async () => {
      if (!userId) return;
      
      try {
        const response = await axios.get("http://localhost:8080/users/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data && response.data.elo_rating !== undefined) {
          localStorage.setItem('elo', response.data.elo_rating);
        }
      } catch (err) {
        console.error("Failed to fetch updated user Elo:", err);
      }
    };
    
    updateUserElo();
    
    const eloUpdateInterval = setInterval(updateUserElo, 4000);
    
    return () => clearInterval(eloUpdateInterval);
  }, []);

  const handleJoinGame = async (game) => {
    const currentUsername = localStorage.getItem('username');
    const currentElo = localStorage.getItem('elo');
    const currentId = localStorage.getItem('id');

    try {
      await axios.post(`http://localhost:8080/game/join/${game.gameId}`, {
        blackPlayerId: currentId,
        blackPlayerElo: currentElo,
        blackPlayerName: currentUsername
      });

      navigate(`/waiting-room/${game.gameId}`, { 
        state: { 
          gameCode: game.gameId,
          hostUsername: currentUsername || "Guest",
          hostElo: currentElo || 1000,
          userId: currentId,
          isHost: false,
          isWhitePlayer: false
        }
      });
    } catch (err) {
      console.error("Failed to join game:", err);
      setError("Failed to join game. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center p-6">
      {/* Subtle background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-zinc-900/50 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {/* Header area */}
        <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-light tracking-wide text-zinc-300">Game Lobby</h1>
          <CreateWaitingRoomButton />
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="text-center py-12 text-zinc-400">
            Loading games...
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12 text-red-400">
            {error}
          </div>
        )}
        
        {/* Games grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {gameList.length === 0 ? (
              <div className="col-span-full text-center py-12 text-zinc-400">
                No games available. Create a new game to get started!
              </div>
            ) : (
              gameList.map((game) => (
                <motion.div
                  key={game.gameId || game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  layout="position"
                  layoutId={`game-${game.gameId || game.id}`}
                >
                  <Card className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/30 rounded-lg overflow-hidden hover:bg-zinc-800/40 transition-colors duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center">
                            <User className="w-5 h-5 text-zinc-400" />
                          </div>
                          <div>
                            <h2 className="text-zinc-200 font-medium">{game.whitePlayerName || "Unnamed Player"}</h2>
                            <p className="text-zinc-500 text-sm">Elo: {game.whitePlayerElo}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-md py-2 transition-all duration-300"
                        onClick={() => handleJoinGame(game)}
                      >
                        Join Game
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
