import { createContext, useContext, useState } from 'react';
import { NOTE_COLORS } from '../../app/constants';

const ColorContext = createContext();

export function ColorProvider({ children }) {
  const [selectedColor, setSelectedColor] = useState('default');

  const updateColor = (colorId) => {
    const color = NOTE_COLORS.find(c => c.id === colorId);
    if (color) {
      setSelectedColor(colorId);
    }
  };

  const getColorValue = (colorId) => {
    return NOTE_COLORS.find(c => c.id === colorId)?.color || '#FFFFFF';
  };

  return (
    <ColorContext.Provider value={{ selectedColor, updateColor, getColorValue }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColor() {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error('useColor must be used within a ColorProvider');
  }
  return context;
}
