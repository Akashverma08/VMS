import React from 'react';
import { motion } from 'framer-motion';

const GridSquare = ({ index }) => {
  return (
    <motion.div
      className="border border-gray-200 group"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: 0.3 }}
      whileHover={{ 
        backgroundColor: 'rgb(75 85 99)',
        opacity: 0.1,
        transition: { duration: 0.2 } 
      }}
      style={{
        width: '80px',
        height: '80px',
      }}
    />
  );
};

const InteractiveBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gray-50">
      <div className="absolute inset-0 grid grid-cols-[repeat(auto-fill,80px)] gap-0">
        {[...Array(200)].map((_, index) => (
          <GridSquare key={index} index={index} />
        ))}
      </div>
    </div>
  );
};

export default InteractiveBackground;
