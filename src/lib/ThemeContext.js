import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [nftToBurn, setNftToBurn] = useState(null);
  const [ticketToActivate, setTicketToActivate] = useState(null);
  const [isInQuiz, setIsInQuiz] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        difficulty,
        setDifficulty,
        isSignedIn,
        setIsSignedIn,
        nftToBurn,
        setNftToBurn,
        ticketToActivate,
        setTicketToActivate,
        isInQuiz,
        setIsInQuiz,
        isAdmin,
        setIsAdmin,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
