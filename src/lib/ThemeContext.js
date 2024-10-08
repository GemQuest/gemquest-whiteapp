import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "../hook/useAuth";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [nftToBurn, setNftToBurn] = useState(null);
  const [ticketToActivate, setTicketToActivate] = useState(null);
  const [isInQuiz, setIsInQuiz] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userInfos, setUserInfos] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const { getUserInfo, loggedIn } = useAuth();
  
  useEffect(() => {
     const fetchUserInfo = async () => {
       if (loggedIn && isSignedIn) {
         try {
          setUserInfos(null);
           const info = await getUserInfo();
           setUserInfos(info);
         } catch (error) {
           console.error("Error fetching user info:", error);
         }
       } else {
         setUserInfos(null);
       }
     };

     fetchUserInfo();
   }, [loggedIn, isSignedIn, getUserInfo]);

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
        userInfos,
        setUserInfos,
        isRegistered,
        setIsRegistered,
       
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
