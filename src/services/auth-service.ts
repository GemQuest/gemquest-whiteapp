import { Web3Auth } from "@web3auth/modal";
import { IProvider } from "@web3auth/base";

export default class AuthService {
  private web3auth: Web3Auth;

  constructor(web3authInstance: Web3Auth) {
    this.web3auth = web3authInstance;
  }

  initWeb3authModal = async (): Promise<boolean> => {
    try {
      console.log("Web3Auth modal initialization");
      await this.web3auth.initModal();
      console.log("Web3Auth modal is now initialized");
      console.log(
        "Web3Auth modal user already connected: ",
        this.web3auth.connected
      );
      return this.web3auth.connected;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  login = async (): Promise<
    | {
      isConnected: boolean;
      web3authProvider: IProvider | null;
    }
    | undefined
  > => {
    console.log("Web3Auth login requested");
    if (!this.web3auth) {
      console.log("Web3Auth not initialized yet");
      return;
    }

    const web3authProvider = await this.web3auth.connect();
    const isConnected = this.web3auth.connected;

    console.log("Web3Auth login completed with provider:", web3authProvider);
    return { isConnected, web3authProvider };
  };

  logout = async (): Promise<void> => {
    if (!this.web3auth) {
      console.log("Web3Auth not initialized yet");
      return;
    }
    console.log("Web3Auth logout requested");
    await this.web3auth.logout();
    console.log("Web3Auth logout completed");
  };
}
