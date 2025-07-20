import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-black/80 backdrop-blur-sm text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">MyApp</Link>
        <div className="space-x-4">
          <Link to="/" className="hover:text-gray-300 transition-colors">Home</Link>
          <Link to="/login" className="hover:text-gray-300 transition-colors">Login</Link>
          <Link to="/register" className="hover:text-gray-300 transition-colors">Register</Link>
          <Link to="/lobby" className="hover:text-gray-300 transition-colors">Lobby</Link>
          <Link to="/waiting-room" className="hover:text-gray-300 transition-colors">Waiting Room</Link>
          <Link to="/game-screen" className="hover:text-gray-300 transition-colors">Game Screen</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;