import React, { createContext } from "react";
import { useEmailData as useEmailDataHook } from "../hooks/useEmailData";

const EmailDataContext = createContext();

export const EmailDataProvider = ({ children }) => {
  const emailData = useEmailDataHook();

  return (
    <EmailDataContext.Provider value={emailData}>
      {children}
    </EmailDataContext.Provider>
  );
};

export { EmailDataContext };
