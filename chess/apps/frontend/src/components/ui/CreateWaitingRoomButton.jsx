import { useState } from "react";
import { Button } from "../ui/Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CreateWaitingRoomButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateWaitingRoom = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8080/waiting-room/create', {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser.id || "user-" + Math.random().toString(36).substring(7);
      
      navigate('/waiting-room', { 
        state: { 
          gameCode: response.data.gameCode,
          hostUsername: response.data.hostUsername,
          hostElo: response.data.hostElo,
          waitingSeconds: response.data.waitingSeconds,
          userId: userId,
          isGameCreator: true
        }
      });
    } catch (error) {
      console.error("Failed to create waiting room:", error);
      setLoading(false);
    }
  };

  return (
    <Button
      className="bg-transparent border border-zinc-700 hover:bg-zinc-800 text-zinc-300 flex items-center gap-2 rounded-md px-4 py-2 transition-all duration-300"
      onClick={handleCreateWaitingRoom}
      disabled={loading}
    >
      {loading ? "Creating..." : "Create Game"}
    </Button>
  );
}
