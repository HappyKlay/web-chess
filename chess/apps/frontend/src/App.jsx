import React from 'react';
// import { Routes, Route, Link } from 'react-router-dom';
import Routes from '../src/Routes'
const App = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Routes />
      </main>
    </div>
  );
};

export default App;