import React from 'react'

import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Lobby from './screens/Lobby';
import Game from './components/Game/Game';
import WaitingRoom from './screens/WaitingRoom';
import GameScreen from './screens/GameScreen';
const routes = () => {
  return (
    <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game" element={<Game />} />
          <Route path="/waiting-room" element={<WaitingRoom />} />
          <Route path="/waiting-room/:code" element={<WaitingRoom />} />
          <Route path="/game-screen" element={<GameScreen />} />
          <Route path="/game/:code" element={<GameScreen />} />
        </Routes>
    </>
  )
}

export default routes