import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "./Card";
import { HeartHandshake, RotateCcw, X, Clock } from 'lucide-react';

const OfferWindow = ({ children, type, playerName, onAccept, onDecline }) => {
  // Determine icon and text based on offer type
  const getOfferDetails = () => {
    switch (type) {
      case 'draw':
        return {
          icon: <HeartHandshake className="w-6 h-6 text-zinc-300" />,
          title: 'Draw Offer',
          description: `${playerName} offers a draw`,
          acceptText: 'Accept Draw',
          color: 'from-emerald-600/20 to-transparent'
        };
      case 'takeback':
        return {
          icon: <RotateCcw className="w-6 h-6 text-zinc-300" />,
          title: 'Takeback Request',
          description: `${playerName} requests to take back their last move`,
          acceptText: 'Allow Takeback',
          color: 'from-blue-600/20 to-transparent'
        };
      default:
        return {
          icon: <Clock className="w-6 h-6 text-zinc-300" />,
          title: 'Game Offer',
          description: `${playerName} made an offer`,
          acceptText: 'Accept',
          color: 'from-purple-600/20 to-transparent'
        };
    }
  };

  const { icon, title, description, acceptText, color } = getOfferDetails();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDecline}></div>
      
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
              onClick={onDecline}
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
              </div>
              
              <div className="pt-2 pb-4 px-4 border-t border-zinc-800/50">
                <div className="text-sm text-zinc-500 text-center mb-4">
                  This offer will expire in <span className="text-zinc-300 font-mono">0:15</span>
                </div>
                
                <div className="space-y-3">
                  <motion.button 
                    onClick={onAccept}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 rounded-md transition-all duration-300 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {type === 'draw' ? <HeartHandshake className="w-4 h-4" /> : 
                     type === 'takeback' ? <RotateCcw className="w-4 h-4" /> : null}
                    {acceptText}
                  </motion.button>
                  
                  <motion.button 
                    onClick={onDecline}
                    className="w-full py-2.5 bg-transparent hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-300 rounded-md transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Decline
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

export default OfferWindow;

// Example usage in TakeBack component
export const Takeback = ({ playerName, onAccept, onDecline }) => {
  return (
    <OfferWindow 
      type="takeback" 
      playerName={playerName}
      onAccept={onAccept}
      onDecline={onDecline}
    />
  );
};

// Example usage in DrawOffer component
export const DrawOffer = ({ playerName, onAccept, onDecline }) => {
  return (
    <OfferWindow 
      type="draw" 
      playerName={playerName}
      onAccept={onAccept}
      onDecline={onDecline}
    />
  );
};