import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import Takeback from './ui/GameOfferWindows/Takeback'
// import OfferWindow from './OfferWindow'
import { Takeback, DrawOffer } from './ui/OfferWindow'
import GameOverWindow from './ui/GameOverWindow'

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // User is logged in, redirect to lobby
      navigate('/lobby');
    } else {
      // User is not logged in, redirect to register
      navigate('/register');
    }
  }, [navigate]);

  const handleRematch = () => {
    console.log('Rematch requested');
  };

  const handleExit = () => {
    console.log('Exit game');
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-6">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4 text-zinc-200">Welcome to MyApp</h1>
        <p className="text-lg text-zinc-400">This is the home page of our application.</p>
        {/* <Takeback playerName="PlayerOne" /> */}
        {/* <DrawOffer playerName="PlayerTwo" /> */}
        <GameOverWindow 
          result="win" 
          playerName="PlayerOne" 
          onRematch={handleRematch}
          onExit={handleExit}
        />
      </div>
    </div>
  );
};

export default Home;