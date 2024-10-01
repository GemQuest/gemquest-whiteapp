import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { getDefaultExternalAdapters } from "@web3auth/default-solana-adapter";

const getWeb3AuthInstance = async (clientId: string): Promise<Web3Auth> => {
  const chainConfig = {
    chainId: "103",
    chainNamespace: CHAIN_NAMESPACES.SOLANA,
    rpcTarget: "https://api.devnet.solana.com",
    tickerName: "SOLANA",
    ticker: "SOL",
    decimals: 9,
    blockExplorerUrl: "https://explorer.solana.com/?cluster=devnet",
    logo: "https://images.toruswallet.io/sol.svg",
  };

  const solanaPrivateKeyProvider = new SolanaPrivateKeyProvider({
    config: { chainConfig: chainConfig },
  });

  const web3auth = new Web3Auth({
    clientId,
    uiConfig: {
      appName: "GemQuest",
      mode: "dark",
      logoLight: "https://web3auth.io/images/web3authlog.png",
      logoDark: "https://web3auth.io/images/web3authlogodark.png",
      defaultLanguage: "en",
      loginGridCol: 3,
      primaryButton: "externalLogin",
      uxMode: "redirect",
    },
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    privateKeyProvider: solanaPrivateKeyProvider,
  });

  const adapters = await getDefaultExternalAdapters({
    options: {
      clientId,
      chainConfig,
    },
  });
  adapters.forEach((adapter) => {
    web3auth.configureAdapter(adapter);
  });

  return web3auth;
};

export { getWeb3AuthInstance };
