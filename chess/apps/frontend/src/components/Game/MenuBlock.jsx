import React from "react";
import { Button } from "../../utils/tw-utils";
import { Clock, Flag, Undo, Settings, Info } from "lucide-react";

const MatchMenu = ({ player1, player2, time1, time2, onResign, onDraw }) => {
  return (
    <div className="bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-lg w-72">
      {/* Player 1 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold">{player1.name}</span>
        <span className="text-sm text-gray-400">{player1.elo}</span>
      </div>
      <div className="bg-gray-800 p-2 rounded text-center text-xl font-semibold">{time1}</div>
      
      {/* Controls */}
      <div className="flex justify-around my-3 text-gray-300">
        <Undo className="cursor-pointer hover:text-white" />
        <Clock className="cursor-pointer hover:text-white" />
        <Settings className="cursor-pointer hover:text-white" />
      </div>

      {/* Turn Indicator */}
      <div className="flex items-center bg-gray-700 p-2 rounded-lg text-sm">
        <Info className="mr-2 text-blue-400" /> Ваш ход!
      </div>

      {/* Match Actions */}
      <div className="flex justify-around mt-3">
        <Button className="bg-red-600 hover:bg-red-700 w-1/3" onClick={onResign}>Resign</Button>
        <Button className="bg-gray-500 hover:bg-gray-600 w-1/3" onClick={onDraw}>Draw</Button>
        <Flag className="text-gray-400 hover:text-white cursor-pointer" />
      </div>
      
      {/* Player 2 */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-bold">{player2.name}</span>
        <span className="text-sm text-gray-400">{player2.elo}</span>
      </div>
      <div className="bg-gray-800 p-2 rounded text-center text-xl font-semibold">{time2}</div>
    </div>
  );
};

export default MatchMenu;