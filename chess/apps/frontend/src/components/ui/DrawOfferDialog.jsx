import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Handshake, X, Check, X as XIcon } from 'lucide-react';
import { Card, CardContent } from './Card';

const DrawOfferDialog = ({ opponentName, onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      
      <AnimatePresence>
        <motion.div
          className="relative z-10 w-full max-w-sm"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Card className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-lg overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-blue-600/20 to-transparent opacity-30 pointer-events-none"></div>
            
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center pt-2 pb-4">
                <div className="w-14 h-14 rounded-full bg-zinc-800/70 border border-zinc-700/50 flex items-center justify-center mb-4">
                  <Handshake className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-lg font-medium text-zinc-200 mb-3">Draw Offer</h2>
                <p className="text-zinc-400 text-sm">
                  {opponentName} has offered a draw. 
                  Do you accept?
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-2">
                <motion.button 
                  onClick={onDecline}
                  className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 rounded-md transition-all duration-300 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <XIcon size={16} className="text-red-400" />
                  <span>Decline</span>
                </motion.button>
                
                <motion.button 
                  onClick={onAccept}
                  className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 rounded-md transition-all duration-300 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check size={16} className="text-green-400" />
                  <span>Accept</span>
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DrawOfferDialog; 