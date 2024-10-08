import { Web3Auth } from "@web3auth/modal";
import { IProvider } from "@web3auth/base";

export default class AuthService {
  private web3auth: Web3Auth;
  private initialized: boolean = false;

  constructor(web3authInstance: Web3Auth) {
    this.web3auth = web3authInstance;
  }

  initWeb3authModal = async (): Promise<boolean> => {
    if (this.initialized) return this.web3auth.connected;

    try {
      console.log("Web3Auth modal initialization");
      await this.web3auth.initModal();
      this.initialized = true;
      console.log("Web3Auth modal is now initialized");
      console.log(
        "Web3Auth modal user already connected:",
        this.web3auth.connected
      );
      return this.web3auth.connected;
    } catch (error) {
      console.error("Error initializing Web3Auth modal:", error);
      throw error;
    }
  };

  login = async (): Promise<
    | {
        isConnected: boolean;
        web3authProvider: IProvider | null;
      }
    | undefined
  > => {
    if (!this.initialized) {
      await this.initWeb3authModal();
    }

    console.log("Web3Auth login requested");
    try {
      const web3authProvider = await this.web3auth.connect();
      const isConnected = this.web3auth.connected;
      console.log("Web3Auth login completed with provider:", web3authProvider);
      return { isConnected, web3authProvider };
    } catch (error) {
      console.error("Error during Web3Auth login:", error);
      throw error;
    }
  };

  getUserInfo = async () => {
    if (!this.web3auth) {
      console.error("Web3Auth not initialized");
      return null;
    }
    try {
      const userInfo = await this.web3auth.getUserInfo();
      return userInfo;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return null;
    }
  };

  logout = async (): Promise<void> => {
    if (!this.web3auth) {
      console.log("Web3Auth not initialized yet");
      return;
    }
    console.log("Web3Auth logout requested");
    try {
      await this.web3auth.logout();
      await this.cleanup();
      console.log("Web3Auth logout completed");
    } catch (error) {
      console.error("Error during Web3Auth logout:", error);
      throw error;
    }
  };

  cleanup = async (): Promise<void> => {
    if (this.web3auth) {
      console.log("Cleaning up Web3Auth");
      this.web3auth.clearCache();
      this.web3auth.removeAllListeners();
      // Force clear local storage
      localStorage.removeItem("openlogin_store");
      localStorage.removeItem("Web3Auth-cachedAdapter");
      // Clear session storage
      sessionStorage.clear();
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("Web3Auth") || key.startsWith("openlogin")) {
          localStorage.removeItem(key);
        }
      });
      // Reset the initialization state
      this.initialized = false;

      console.log("Web3Auth cleanup completed");
    }
  };
}
