import { useContext } from "react";
import { EmailDataContext } from "../contexts/EmailDataContext";

export const useEmailDataContext = () => {
  const context = useContext(EmailDataContext);
  if (!context) {
    throw new Error(
      "useEmailDataContext must be used within an EmailDataProvider"
    );
  }
  return context;
};
