"use client";

import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useState,
} from "react";

interface AppContextType {
  hiveUsername: string | null;
  setHiveUsername: Dispatch<SetStateAction<string | null>>;
  // Aquí podrías añadir más estados globales si los necesitas en el futuro
  // por ejemplo: theme, setSettings, etc.
}

// Valor por defecto para el contexto
const defaultContextValue: AppContextType = {
  hiveUsername: null,
  setHiveUsername: () => {}, // Función vacía como placeholder
};

export const AppContext = createContext<AppContextType>(defaultContextValue);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [hiveUsername, setHiveUsername] = useState<string | null>(null);

  return (
    <AppContext.Provider value={{ hiveUsername, setHiveUsername }}>
      {children}
    </AppContext.Provider>
  );
};
