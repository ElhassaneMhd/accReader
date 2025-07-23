import React, { createContext } from "react";
import { useConnection as useConnectionHook } from "@/hooks/useConnection";

const ConnectionContext = createContext();

export const ConnectionProvider = ({ children }) => {
  const connectionData = useConnectionHook();

  return (
    <ConnectionContext.Provider value={connectionData}>
      {children}
    </ConnectionContext.Provider>
  );
};

export { ConnectionContext };
