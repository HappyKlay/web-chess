import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flag, 
  Trophy, 
  Crown, 
  X,
  TrendingUp,
  TrendingDown,
  MinusIcon,
  Clock
} from 'lucide-react';
import { Card, CardContent } from './Card'; 

const GameOverWindow = ({ 
  result, 
  playerName, 
  onRematch, 
  onExit 
}) => {
  const getGameOutcomeDetails = () => {
    switch (result) {
      case 'win':
        return {
          icon: <Trophy className="w-6 h-6 text-yellow-400" />,
          title: 'Victory!',
          description: `You won the game`,
          color: 'from-yellow-600/20 to-transparent',
          buttonText: 'Rematch',
          eloChange: '+8',
          eloIcon: <TrendingUp className="w-4 h-4 text-green-400" />,
          eloColor: 'text-green-400'
        };
      case 'draw':
        return {
          icon: <Crown className="w-6 h-6 text-zinc-300" />,
          title: 'Draw',
          description: 'The game ended in a draw',
          color: 'from-blue-600/20 to-transparent',
          buttonText: 'Rematch',
          eloChange: '0',
          eloIcon: <MinusIcon className="w-4 h-4 text-zinc-400" />,
          eloColor: 'text-zinc-400'
        };
      case 'resign':
        return {
          icon: <Flag className="w-6 h-6 text-red-400" />,
          title: 'Game Over',
          description: `${playerName} resigned`,
          color: 'from-red-600/20 to-transparent',
          buttonText: 'Rematch',
          eloChange: playerName === 'You' ? '+8' : '-8',
          eloIcon: playerName === 'You' ? 
            <TrendingUp className="w-4 h-4 text-green-400" /> : 
            <TrendingDown className="w-4 h-4 text-red-400" />,
          eloColor: playerName === 'You' ? 'text-green-400' : 'text-red-400'
        };
      case 'loss':
        return {
          icon: <Flag className="w-6 h-6 text-red-400" />,
          title: 'Game Over',
          description: `You lost the game`,
          color: 'from-red-600/20 to-transparent',
          buttonText: 'Rematch',
          eloChange: '-8',
          eloIcon: <TrendingDown className="w-4 h-4 text-red-400" />,
          eloColor: 'text-red-400'
        };
      case 'timeout':
        return {
          icon: <Clock className="w-6 h-6 text-red-400" />,
          title: "Time's Up",
          description: `${playerName} ran out of time`,
          color: 'from-red-600/20 to-transparent',
          buttonText: 'Rematch',
          eloChange: playerName === 'You' ? '-8' : '+8',
          eloIcon: playerName === 'You' ? 
            <TrendingDown className="w-4 h-4 text-red-400" /> : 
            <TrendingUp className="w-4 h-4 text-green-400" />,
          eloColor: playerName === 'You' ? 'text-red-400' : 'text-green-400'
        };
      default:
        return {
          icon: <Flag className="w-6 h-6 text-zinc-300" />,
          title: 'Game Over',
          description: 'The game has concluded',
          color: 'from-purple-600/20 to-transparent',
          buttonText: 'Rematch',
          eloChange: '0',
          eloIcon: <MinusIcon className="w-4 h-4 text-zinc-400" />,
          eloColor: 'text-zinc-400'
        };
    }
  };

  const { icon, title, description, color, buttonText, eloChange, eloIcon, eloColor } = getGameOutcomeDetails();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onExit}></div>
      
      <AnimatePresence>
        <motion.div
          className="relative z-10 w-full max-w-sm"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Card className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-lg overflow-hidden shadow-2xl">
            <div className={`absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b ${color} opacity-30 pointer-events-none`}></div>
            
            <button 
              onClick={onExit}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-800/70 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors z-20"
            >
              <X size={16} />
            </button>
            
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center pt-2 pb-4">
                <div className="w-14 h-14 rounded-full bg-zinc-800/70 border border-zinc-700/50 flex items-center justify-center mb-4">
                  {icon}
                </div>
                <h2 className="text-lg font-medium text-zinc-200 mb-1">{title}</h2>
                <p className="text-zinc-400 text-sm">{description}</p>
                
                {/* ELO change indicator */}
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-zinc-500 text-xs">ELO</span>
                  <div className={`flex items-center gap-1 ${eloColor} text-sm font-medium px-2 py-1 bg-zinc-800/70 rounded-full`}>
                    {eloIcon}
                    <span>{eloChange}</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 pb-4 px-4 border-t border-zinc-800/50">
                <div className="space-y-3">
                  <motion.button 
                    onClick={onRematch}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 rounded-md transition-all duration-300 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {buttonText}
                  </motion.button>
                  
                  <motion.button 
                    onClick={onExit}
                    className="w-full py-2.5 bg-transparent hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-300 rounded-md transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Exit Game
                  </motion.button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GameOverWindow;

