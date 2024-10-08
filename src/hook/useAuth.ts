import { useState, useCallback, useEffect, useRef } from "react";
import { OpenloginUserInfo } from "@web3auth/openlogin-adapter";
import { IProvider } from "@web3auth/base";
import { getWeb3AuthInstance } from "../lib/web3-auth";
import AuthService from "../services/auth-service";
import { useRouter } from "next/router";

export const useAuth = () => {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [authService, setAuthService] = useState<AuthService | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<Partial<OpenloginUserInfo> | null>(
    null
  );
  const [isInitializing, setIsInitializing] = useState(false);
  const [loginAttemptInProgress, setLoginAttemptInProgress] = useState(false);
  const clientIdRef = useRef<string | null>(null);
  const initializationPromise = useRef<Promise<void> | null>(null);
  const loginAttemptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loginAttemptCountRef = useRef<number>(0);
  const router = useRouter();

  const resetState = useCallback(() => {
    setProvider(null);
    setLoggedIn(false);
    setUserInfo(null);
    setLoginAttemptInProgress(false);
    if (loginAttemptTimeoutRef.current) {
      clearTimeout(loginAttemptTimeoutRef.current);
      loginAttemptTimeoutRef.current = null;
    }
    if (authService) {
      authService.cleanup();
      setAuthService(null);
    }
    localStorage.removeItem("openlogin_store");
    localStorage.removeItem("Web3Auth-cachedAdapter");
    sessionStorage.clear(); 
    console.log("Auth state reset completed");
  }, [authService]);

  const initAuth = useCallback(async () => {
    if (isInitializing || authService) return;

    if (!initializationPromise.current) {
      initializationPromise.current = (async () => {
        setIsInitializing(true);
        try {
          console.log("Initializing AuthService");
          if (!clientIdRef.current) {
            const response = await fetch("/api/web3auth");
            const data = await response.json();
            clientIdRef.current = data.clientId;
          }
          if (!clientIdRef.current) {
            throw new Error("Client ID not found");
          }
          const web3auth = await getWeb3AuthInstance(clientIdRef.current);
          const authServiceInstance = new AuthService(web3auth);
          setAuthService(authServiceInstance);

          const isConnected = await authServiceInstance.initWeb3authModal();
          setLoggedIn(isConnected);
          if (isConnected) {
            setProvider(web3auth.provider);
            const info = await authServiceInstance.getUserInfo();
            setUserInfo(info);
          }
        } catch (error) {
          console.error("Error during initAuth:", error);
          resetState();
        } finally {
          setIsInitializing(false);
          initializationPromise.current = null;
        }
      })();
    }

    await initializationPromise.current;
  }, [resetState, authService]);

  const handleLogin = useCallback(async () => {
    await initAuth(); // Ensure initialization is complete

    if (!authService) {
      console.error("AuthService not initialized");
      return;
    }

    if (loginAttemptInProgress) {
      console.log("Login attempt already in progress");
      return;
    }

    setLoginAttemptInProgress(true);
    loginAttemptCountRef.current += 1;

    const timeoutDuration = loginAttemptCountRef.current <= 1 ? 5 : 10000;
    console.log(
      `Login attempt ${loginAttemptCountRef.current}: Setting timeout to ${timeoutDuration}ms`
    );

    loginAttemptTimeoutRef.current = setTimeout(() => {
      console.log(`Login attempt ${loginAttemptCountRef.current} timed out`);
      resetState();
    }, timeoutDuration);

    try {
      const result = await authService.login();
      if (result) {
        setLoggedIn(result.isConnected);
        setProvider(result.web3authProvider);
        const info = await authService.getUserInfo();
        setUserInfo(info);
      }
    } catch (error) {
      console.error("Error during login:", error);
      if (loginAttemptCountRef.current === 1) {
        console.log("First attempt failed, retrying...");
        setTimeout(() => {
          loginAttemptCountRef.current = 0; // Reset count for the next attempt
          handleLogin(); // Retry login
        }, 10);
      } else {
        resetState();
      }
    } finally {
      setLoginAttemptInProgress(false);
      if (loginAttemptTimeoutRef.current) {
        clearTimeout(loginAttemptTimeoutRef.current);
        loginAttemptTimeoutRef.current = null;
      }
    }
  }, [authService, loginAttemptInProgress, resetState, initAuth]);

  const handleLogout = useCallback(async () => {
    if (!authService) {
      console.log("AuthService not initialized");
      return;
    }

    try {
      setLoggedIn(false); 
      setUserInfo(null); 
      await authService.logout();
      resetState();
      loginAttemptCountRef.current = 0; // Reset attempt count on logout
      router.reload();
    } catch (error) {
      console.error("Error during logout:", error);
    } 
  }, [authService, resetState]);

  const getUserInfo = useCallback(async () => {
    if (!authService) {
      console.log("AuthService not initialized yet");
      return null;
    }
    try {
      const info = await authService.getUserInfo();
      setUserInfo(info);
      return info;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return null;
    }
  }, [authService]);

  useEffect(() => {
    initAuth();
    return () => {
      resetState();
      // Don't reset loginAttemptCountRef here to persist across re-renders
    };
  }, [initAuth, resetState]);

  return {
    initAuth,
    handleLogin,
    handleLogout,
    getUserInfo,
    provider,
    loggedIn,
    userInfo,
    isInitializing,
    loginAttemptInProgress,
    resetState,
  };
};
