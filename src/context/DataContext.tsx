import React, { createContext, useState, useContext, ReactNode } from 'react';
import { LottoDraw } from '../types';

interface DataContextType {
  draws: LottoDraw[];
  setDraws: (draws: LottoDraw[]) => void;
  fileName: string;
  setFileName: (name: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [draws, setDraws] = useState<LottoDraw[]>([]);
  const [fileName, setFileName] = useState<string>('');

  return (
    <DataContext.Provider value={{ draws, setDraws, fileName, setFileName }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};