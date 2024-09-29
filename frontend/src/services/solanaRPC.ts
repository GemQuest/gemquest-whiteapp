import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { CustomChainConfig, IProvider } from "@web3auth/base";
import { SolanaWallet } from "@web3auth/solana-provider";
import idl from "../lib/gemquest.json";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  AccountLayout,
  getMint,
} from "@solana/spl-token";
import bs58 from "bs58";
import {
  AnchorProvider,
  BN,
  Program,
  setProvider,
  web3,
} from "@coral-xyz/anchor";
import {
  mplTokenMetadata,
  fetchDigitalAssetByMetadata,
  MPL_TOKEN_METADATA_PROGRAM_ID,
  fetchDigitalAsset,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  gemAddresses,
  gemMetadataAccounts,
  nftMetadata,
  ipfsGateway,
  ticketMetadata,
  ticketsCollectionMint,
  receiptsCollectionMint,
} from "../utils";

interface BurnNFTParams {
  userWallet: string;
  nftMintAddress: string;
}

export default class SolanaRpc {
  private provider: IProvider;
  umi: any;

  constructor(provider: IProvider) {
    this.provider = provider;
    this.umi = createUmi("https://api.devnet.solana.com").use(
      mplTokenMetadata()
    );
  }

  getAccounts = async (): Promise<string[]> => {
    try {
      const solanaWallet = new SolanaWallet(this.provider);
      const acc = await solanaWallet.requestAccounts();
      return acc;
    } catch (error) {
      return error as string[];
    }
  };

  getBalance = async (): Promise<string> => {
    try {
      const solanaWallet = new SolanaWallet(this.provider);
      const connectionConfig = await solanaWallet.request<
        string[],
        CustomChainConfig
      >({
        method: "solana_provider_config",
        params: [],
      });
      const conn = new Connection(connectionConfig.rpcTarget);

      const accounts = await solanaWallet.requestAccounts();
      const balance = await conn.getBalance(new PublicKey(accounts[0]));
      return balance.toString();
    } catch (error) {
      return error as string;
    }
  };

  signMessage = async (message: string): Promise<string> => {
    if (!message) {
      return "";
    }
    try {
      const solanaWallet = new SolanaWallet(this.provider);
      const msg = Buffer.from(message, "utf8");
      const res = await solanaWallet.signMessage(msg as any);
      return res.toString();
    } catch (error) {
      console.error("Sign message error:", error);
      return "";
    }
  };

  getAdminWallet = async (): Promise<Keypair> => {
    try {
      const response = await fetch("/api/getKey", { method: "POST" });
      const data = await response.json();
      // Décodez la clé privée de adminWallet
      const adminWalletSecretKey = bs58.decode(data.privateKey);
      const adminWallet = Keypair.fromSecretKey(
        new Uint8Array(adminWalletSecretKey)
      );
      return adminWallet;
    } catch (error) {
      console.error("Error in getAdminKey:", error);
      throw error;
    }
  };

  getNFTDecimals = async (
    connection: Connection,
    mintAddress: web3.PublicKeyInitData
  ): Promise<number> => {
    try {
      const mintPublicKey = new PublicKey(mintAddress);
      const mintInfo = await getMint(connection, mintPublicKey);
      console.log(`Decimals for NFT: ${mintInfo.decimals}`);
      return Number(mintInfo.decimals);
    } catch (error) {
      console.error("Error fetching NFT decimals:", error);
      throw error;
    }
  };

  getPrice = async (): Promise<number> => {
    try {
      const connection = new Connection("https://api.devnet.solana.com");
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("initial_price")],
        new PublicKey(idl.address)
      );

      const accountInfo = await connection.getAccountInfo(pda);

      if (!accountInfo || !accountInfo.data) {
        throw new Error("Compte non trouvé ou données non disponibles");
      }

      // Décodez les données du compte
      const price = accountInfo.data.readBigUInt64LE(8); // 8 bytes offset pour le discriminator

      return Number(price);
    } catch (error) {
      console.error("Error in getInitialPrice:", error);
      throw error;
    }
  };

  waitForFinalization = async (
    connection: Connection,
    signature: string,
    maxRetries: number = 30,
    interval: number = 5000
  ): Promise<void> => {
    let retries = 0;
    while (retries < maxRetries) {
      const status = await connection.getSignatureStatus(signature);

      if (status.value?.confirmationStatus === "finalized") {
        console.log(`Transaction ${signature} finalized`);

        // Vérifier si la transaction a réussi
        const tx = await connection.getTransaction(signature, {
          commitment: "finalized",
        });

        if (tx?.meta?.err) {
          throw new Error(
            `Transaction ${signature} failed: ${JSON.stringify(tx.meta.err)}`
          );
        }

        return;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
      retries++;
    }

    throw new Error(
      `Transaction ${signature} failed to finalize after ${maxRetries} attempts`
    );
  };

  updateInitialPrice = async (newPrice: number): Promise<string> => {
    try {
      const adminWallet = await this.getAdminWallet();
      const connection = new Connection("https://api.devnet.solana.com");
      const provider = new AnchorProvider(connection, adminWallet as any, {
        preflightCommitment: "confirmed",
      });
      const program: Program = new Program(idl as any, provider);

      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("initial_price")],
        new PublicKey(idl.address)
      );

      const instruction = program.instruction.updateInitialPrice(
        new BN(newPrice),
        {
          accounts: {
            initialPriceAccount: pda,
            admin: adminWallet.publicKey,
          },
        }
      );

      const latestBlockhash = await connection.getLatestBlockhash("finalized");
      const transaction = new Transaction({
        feePayer: adminWallet.publicKey,
        ...latestBlockhash,
      }).add(instruction);

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [adminWallet],
        { commitment: "confirmed" }
      );

      await this.waitForFinalization(connection, signature);

      console.log(
        "Prix initial mis à jour et finalisé. Transaction:",
        signature
      );
      return signature;
    } catch (error) {
      console.error("Error in updateInitialPrice:", error);
      throw error;
    }
  };

  activateTicket = async (mintAddress: string): Promise<string> => {
    try {
      const connectionConfig = { rpcTarget: "https://api.devnet.solana.com" };
      const conn = new Connection(connectionConfig.rpcTarget);
      const adminWallet = await this.getAdminWallet();
      const provider = new AnchorProvider(conn, adminWallet as any, {
        preflightCommitment: "finalized",
      });
      const program = new Program(idl as any, provider);
      setProvider(provider);

      const mintPublicKey = new PublicKey(mintAddress);

      const [ticketStatusPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("ticket_status"), mintPublicKey.toBuffer()],
        program.programId
      );

      const instruction = program.instruction.activateTicket({
        accounts: {
          ticketStatusAccount: ticketStatusPDA,
          mint: mintPublicKey,
          admin: adminWallet.publicKey,
        },
      });

      const latestBlockhash = await conn.getLatestBlockhash("finalized");

      const transaction = new Transaction({
        feePayer: adminWallet.publicKey,
        ...latestBlockhash,
      }).add(instruction);

      const signature = await sendAndConfirmTransaction(
        conn,
        transaction,
        [adminWallet],
        {
          commitment: "finalized",
        }
      );

      console.log("Ticket activated. Transaction signature:", signature);

      return signature;
    } catch (error) {
      console.error("Error activating ticket:", error);
      throw error;
    }
  };

  getTicketStatus = async (
    mintAddress: string
  ): Promise<{ status: string; expiration: number }> => {
    try {
      const connection = new Connection("https://api.devnet.solana.com");
      const mintPublicKey = new PublicKey(mintAddress);
      const [ticketStatusPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("ticket_status"), mintPublicKey.toBuffer()],
        new PublicKey(idl.address)
      );
      const accountInfo = await connection.getAccountInfo(ticketStatusPDA);
      if (!accountInfo || !accountInfo.data) {
        throw new Error("Account not found or data not available");
      }

      // Les 8 premiers octets sont généralement réservés pour le discriminant
      const status = accountInfo.data.readUInt8(8); // Lire un seul octet pour le statut
      const expiration = accountInfo.data.readBigInt64LE(9); // Lire 8 octets pour l'expiration, commençant à l'index 9

      console.log("Raw ticket status:", status);
      console.log("Raw ticket expiration:", expiration);

      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      let statusString;

      if (status === 0) {
        statusString = "Not activated";
      } else if (status === 1) {
        statusString = expiration > currentTime ? "Activated" : "Expired";
      } else {
        statusString = "Unknown";
      }

      return {
        status: statusString,
        expiration: Number(expiration),
      };
    } catch (error) {
      console.error("Error in getTicketStatus:", error);
      throw error;
    }
  };

  mintGems = async (amount: number, mintAddress: string): Promise<string> => {
    if (amount <= 0 || !mintAddress) {
      return "";
    }
    try {
      const users = await this.getAccounts();
      const userWallet = users[0];
      const connectionConfig = {
        rpcTarget: "https://api.devnet.solana.com",
      };
      const conn = new Connection(connectionConfig.rpcTarget);
      // Récupérez la clé privée de l'API
      const adminWallet = await this.getAdminWallet();
      const provider = new AnchorProvider(conn, adminWallet as any, {
        preflightCommitment: "finalized",
      });
      setProvider(provider);
      const program = new Program(idl as any, provider);

      const mint = new PublicKey(mintAddress);

      const associatedTokenAccount = getAssociatedTokenAddressSync(
        mint,
        new PublicKey(userWallet as string)
      );
      const instruction = program.instruction.mintTokensToUser(new BN(amount), {
        accounts: {
          mintAuthority: provider.wallet.publicKey,
          recipient: userWallet,
          mintAccount: mint,
          associatedTokenAccount: associatedTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
      });

      const { blockhash } = await conn.getRecentBlockhash("finalized");

      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: adminWallet.publicKey,
      }).add(instruction);

      const signature = await sendAndConfirmTransaction(conn, transaction, [
        adminWallet,
      ]);
      await this.waitForFinalization(conn, signature);
      console.log("Transaction confirmed:", signature);
      return signature;
    } catch (error) {
      console.error("Error in mintGems:", error);
      throw error;
    }
  };

  fetchGems = async (): Promise<{ [key: string]: number }> => {
    try {
      const users = await this.getAccounts();
      const connectionConfig = {
        rpcTarget: "https://api.devnet.solana.com",
      };
      const conn = new Connection(connectionConfig.rpcTarget);
      const userWallet = new PublicKey(users[0]);

      const getTokenBalance = async (mintAddress: PublicKey) => {
        const associatedTokenAccount = await PublicKey.findProgramAddress(
          [
            userWallet.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintAddress.toBuffer(),
          ],
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const tokenAccountInfo = await conn.getAccountInfo(
          associatedTokenAccount[0]
        );
        if (!tokenAccountInfo) return 0;

        const amount = tokenAccountInfo.data.readUIntLE(64, 8);
        return amount / LAMPORTS_PER_SOL;
      };

      const gem1Balance = await getTokenBalance(new PublicKey(gemAddresses[1]));
      const gem5Balance = await getTokenBalance(new PublicKey(gemAddresses[5]));
      const gem10Balance = await getTokenBalance(
        new PublicKey(gemAddresses[10])
      );
      const gem20Balance = await getTokenBalance(
        new PublicKey(gemAddresses[20])
      );

      return {
        gem1: gem1Balance,
        gem5: gem5Balance,
        gem10: gem10Balance,
        gem20: gem20Balance,
      };
    } catch (error) {
      console.error("Failed to fetch user gems:", error);
      throw error;
    }
  };

  fetchGemsMetadata = async (): Promise<{ [key: string]: any }> => {
    try {
      const getMetadata = async (metadataAccount: string) => {
        const metadataPDA: any = [new PublicKey(metadataAccount), 0];
        const asset = await fetchDigitalAssetByMetadata(this.umi, metadataPDA);
        return asset;
      };
      const fetchJsonFromIpfs = async (url: string) => {
        const response = await fetch(url.replace("ipfs://", ipfsGateway));
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
      };

      const gem1Metadata = await getMetadata(gemMetadataAccounts[1]);
      const gem5Metadata = await getMetadata(gemMetadataAccounts[5]);
      const gem10Metadata = await getMetadata(gemMetadataAccounts[10]);
      const gem20Metadata = await getMetadata(gemMetadataAccounts[20]);

      const gemsMetadataUrls = {
        gem1: gem1Metadata.metadata.uri,
        gem5: gem5Metadata.metadata.uri,
        gem10: gem10Metadata.metadata.uri,
        gem20: gem20Metadata.metadata.uri,
      };

      const gem1Data = await fetchJsonFromIpfs(gemsMetadataUrls.gem1);
      const gem5Data = await fetchJsonFromIpfs(gemsMetadataUrls.gem5);
      const gem10Data = await fetchJsonFromIpfs(gemsMetadataUrls.gem10);
      const gem20Data = await fetchJsonFromIpfs(gemsMetadataUrls.gem20);

      return {
        gem1: gem1Data,
        gem5: gem5Data,
        gem10: gem10Data,
        gem20: gem20Data,
      };
    } catch (error) {
      console.error("Failed to fetch gems metadata:", error);
      throw error;
    }
  };

  fetchNFT = async (): Promise<{ [key: string]: any }> => {
    try {
      const getMetadata = async (metadataAccount: string) => {
        const metadataPDA: any = [new PublicKey(metadataAccount), 0];
        const asset = await fetchDigitalAssetByMetadata(this.umi, metadataPDA);
        return asset;
      };

      const fetchJsonFromIpfs = async (url: string) => {
        const response = await fetch(url.replace("ipfs://", ipfsGateway));
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
      };

      const metadata = await Promise.all(
        nftMetadata.map(async (nft) => {
          const metadataInfo = await getMetadata(nft.metadataAccount);
          const metadataUri = metadataInfo.metadata.uri;
          const metadataJson = await fetchJsonFromIpfs(metadataUri);
          return { ...nft, metadata: metadataJson };
        })
      );

      const metadataMap: { [key: string]: any } = {};
      metadata.forEach((nft) => {
        metadataMap[nft.symbol] = {
          metadata: nft.metadata,
          address: nft.address,
        };
      });

      return metadataMap;
    } catch (error) {
      console.error("Failed to fetch NFT metadata:", error);
      throw error;
    }
  };

  approveTokenBurn = async (
    amount: number,
    mintAddress: PublicKey
  ): Promise<string> => {
    if (amount <= 0 || !mintAddress) {
      return "";
    }
    try {
      console.log("Starting approveTokenBurn: mint adress", mintAddress);
      const solanaWallet = new SolanaWallet(this.provider);
      const users = await this.getAccounts();
      const userWallet = users[0];
      const connectionConfig = {
        rpcTarget: "https://api.devnet.solana.com",
      };
      const conn = new Connection(connectionConfig.rpcTarget);
      const adminWallet = await this.getAdminWallet();
      const provider = new AnchorProvider(conn, adminWallet as any, {
        preflightCommitment: "finalized",
      });
      const program = new Program(idl as any, provider);
      setProvider(provider);
      const decimals = await this.getNFTDecimals(conn, mintAddress);
      const AMOUNT = new BN(amount).mul(new BN(10).pow(new BN(decimals)));

      console.log("AMOUNT", AMOUNT);

      console.log("Creating/getting user token account");
      const userTokenATA = await getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        adminWallet, // Payer
        mintAddress,
        new PublicKey(userWallet)
      );
      console.log("Creating approve token instruction");
      // Give allowance to admin to burn user token
      const instructionApproveToken = program.instruction.approveToken(AMOUNT, {
        accounts: {
          associatedTokenAccount: userTokenATA.address,
          delegate: adminWallet.publicKey,
          authority: userWallet,
          // system
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      });

      console.log("Fetching latest blockhash");
      const latestBlockhashInfo = await conn.getLatestBlockhash("finalized");

      console.log("Creating transaction");
      const transactionApprove = new Transaction({
        blockhash: latestBlockhashInfo.blockhash,
        feePayer: new PublicKey(userWallet),
        lastValidBlockHeight: latestBlockhashInfo.lastValidBlockHeight,
      }).add(instructionApproveToken);

      console.log("Signing and sending transaction");
      // Using web3auth wallet to sign the transaction
      const signedTx = await solanaWallet.signAndSendTransaction(
        transactionApprove
      );

      if (signedTx?.signature) {
        await this.waitForFinalization(conn, signedTx.signature);
      }

      console.log("Approve Token Transaction confirmed:", signedTx);

      // Fetch the updated token account info
      const accountInfo = await conn.getAccountInfo(userTokenATA.address);
      if (accountInfo) {
        const tokenAccountInfo = AccountLayout.decode(
          Uint8Array.from(accountInfo.data)
        );
        const delegatedAmount = tokenAccountInfo.delegatedAmount;
        console.log(
          `Updated number of ${decimals === 0 ? "NFT" : "Gems"} delegated:`,
          delegatedAmount.toString()
        );
      } else {
        console.log("Failed to fetch updated token account info.");
      }

      return signedTx?.signature;
    } catch (error) {
      console.error("Error in approveTokenBurn:", error);
      throw error;
    }
  };

  checkApproveToken = async (userWallet: PublicKey, mintAddress: PublicKey) => {
    if (!userWallet || !mintAddress) {
      return 0;
    }
    try {
      const connectionConfig = {
        rpcTarget: "https://api.devnet.solana.com",
      };
      const conn = new Connection(connectionConfig.rpcTarget);
      const adminWallet = await this.getAdminWallet();

      const provider = new AnchorProvider(conn, adminWallet as any, {
        preflightCommitment: "finalized",
      });
      const program = new Program(idl as any, provider);
      setProvider(provider);

      const userTokenATA = await getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        adminWallet, // Payer
        mintAddress,
        userWallet
      );

      const accountInfo = await program.provider.connection.getAccountInfo(
        userTokenATA.address
      );

      if (accountInfo) {
        const tokenAccount = AccountLayout.decode(
          new Uint8Array(accountInfo.data)
        );
        const delegatedAmount = tokenAccount.delegatedAmount;
        console.log("Token delegated of user wallet:", delegatedAmount);
        return delegatedAmount;
      } else {
        console.log("Token account does not exist or has no delegated tokens.");
        return 0;
      }
    } catch (error) {
      console.error("Error in checkApproveToken:", error);
      throw error;
    }
  };

  refundGems = async (amount: number, gemValue: string = "1") => {
    const gemValues = [20, 10, 5, 1];
    const currentGemValue = parseInt(gemValue);

    for (const value of gemValues) {
      if (value >= currentGemValue) {
        while (amount >= value) {
          await this.mintGems(
            1,
            gemAddresses[value.toString() as "1" | "5" | "10" | "20"]
          );
          amount -= value;
          console.log(`Refunded 1 gem of value ${value}`);
        }
      }
    }

    if (amount > 0) {
      console.log(`Unable to refund remaining ${amount} of ${gemValue} gem`);
    }
  };

  burnTokenTransferNFT = async (
    nftTokenAddr: string,
    nft_price: number,
    gemAmounts: { [key: string]: number }
  ): Promise<string> => {
    const maxRetries = 10;
    const retryDelay = 2000; // 2 secondes

    const retryOperation = async <T>(
      operation: () => Promise<T>,
      retryCount = 0
    ): Promise<T> => {
      try {
        return await operation();
      } catch (error) {
        if (retryCount < maxRetries) {
          console.log(`Retry attempt ${retryCount + 1}`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return retryOperation(operation, retryCount + 1);
        } else {
          throw error;
        }
      }
    };

    if (
      nft_price <= 0 ||
      Object.keys(gemAmounts).length === 0 ||
      !nftTokenAddr
    ) {
      return "";
    }

    try {
      const users = await this.getAccounts();
      const userWallet = users[0];
      const connectionConfig = { rpcTarget: "https://api.devnet.solana.com" };
      const conn = new Connection(connectionConfig.rpcTarget);
      const adminWallet = await this.getAdminWallet();
      const provider = new AnchorProvider(conn, adminWallet as any, {
        preflightCommitment: "finalized",
      });
      const program = new Program(idl as any, provider);
      setProvider(provider);

      let totalGems = 0;
      for (const [gemValue, gemAmount] of Object.entries(gemAmounts)) {
        if (gemValue !== "refund") {
          totalGems += gemAmount * parseInt(gemValue);
        }
      }
      console.log("Total gems amount:", totalGems, "NFT price:", nft_price);
      if (totalGems < nft_price) {
        throw new Error("Total gems amount is less than NFT price");
      } else if (totalGems > nft_price) {
        const refund = totalGems - nft_price;
        if (gemAmounts["refund"] !== refund) {
          throw new Error("Refund amount does not match the difference");
        }
      }

      const [burnTrackerPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("burn_tracker"), adminWallet.publicKey.toBuffer()],
        program.programId
      );

      const accountInfo = await conn.getAccountInfo(burnTrackerPDA);
      if (!accountInfo) {
        await retryOperation(async () => {
          const initInstruction = program.instruction.initializeBurnTracker({
            accounts: {
              burnTracker: burnTrackerPDA,
              payer: adminWallet.publicKey,
              systemProgram: SystemProgram.programId,
            },
          });

          const blockhash = await conn.getLatestBlockhash("finalized");
          const initTx = new Transaction({
            blockhash: blockhash.blockhash,
            lastValidBlockHeight: blockhash.lastValidBlockHeight,
            feePayer: adminWallet.publicKey,
          }).add(initInstruction);

          const initTransaction = await sendAndConfirmTransaction(
            conn,
            initTx,
            [adminWallet]
          );
          console.log("Burn Tracker Initialized:", initTransaction);
        });
      }

      const specialKey = new PublicKey(new Array(32).fill(1));
      const gemEntries = Object.entries(gemAmounts).filter(
        ([gemValue, gemAmount]) => gemValue !== "refund" && gemAmount > 0
      );
      let lastMint: PublicKey;
      let burnedGems: { [key: string]: number } = {};

      try {
        for (const [gemValue, gemAmount] of gemEntries) {
          await retryOperation(async () => {
            const gemPublicKey = new PublicKey(
              gemAddresses[gemValue as "1" | "5" | "10" | "20"]
            );
            const userTokenATA = await getOrCreateAssociatedTokenAccount(
              program.provider.connection,
              adminWallet,
              gemPublicKey,
              new PublicKey(userWallet)
            );

            const burnInstruction = program.instruction.burnTokenTransferNft(
              new BN(gemAmount).mul(new BN(web3.LAMPORTS_PER_SOL)),
              new BN(gemValue),
              {
                accounts: {
                  payer: adminWallet.publicKey,
                  mintTokenAccount: gemPublicKey,
                  associatedTokenAccount: userTokenATA.address,
                  from: userTokenATA.address,
                  to: specialKey,
                  fromAuthority: adminWallet.publicKey,
                  tokenProgram: TOKEN_PROGRAM_ID,
                  burnTracker: burnTrackerPDA,
                },
              }
            );

            const blockhashInfo = await conn.getLatestBlockhash("finalized");
            const transaction = new Transaction({
              blockhash: blockhashInfo.blockhash,
              lastValidBlockHeight: blockhashInfo.lastValidBlockHeight,
              feePayer: adminWallet.publicKey,
            }).add(burnInstruction);

            const burnTx = await sendAndConfirmTransaction(conn, transaction, [
              adminWallet,
            ]);
            console.log(`Burned ${gemAmount} of ${gemValue} gem:`, burnTx);
            lastMint = gemPublicKey;
          });
        }

        const MINT_NFT_ACCOUNT = new PublicKey(nftTokenAddr);
        const userNftATA = await getOrCreateAssociatedTokenAccount(
          program.provider.connection,
          adminWallet,
          MINT_NFT_ACCOUNT,
          new PublicKey(userWallet)
        );
        const adminNftATA = getAssociatedTokenAddressSync(
          MINT_NFT_ACCOUNT,
          adminWallet.publicKey
        );

        const signature = await retryOperation(async () => {
          const transferInstruction = program.instruction.burnTokenTransferNft(
            new BN(nft_price).mul(new BN(web3.LAMPORTS_PER_SOL)),
            new BN(0),
            {
              accounts: {
                payer: adminWallet.publicKey,
                mintTokenAccount: lastMint,
                associatedTokenAccount: adminNftATA,
                from: adminNftATA,
                to: userNftATA.address,
                fromAuthority: adminWallet.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                burnTracker: burnTrackerPDA,
              },
            }
          );

          const blockhashInfo = await conn.getLatestBlockhash("finalized");
          const transaction = new Transaction({
            blockhash: blockhashInfo.blockhash,
            lastValidBlockHeight: blockhashInfo.lastValidBlockHeight,
            feePayer: adminWallet.publicKey,
          }).add(transferInstruction);

          const sig = await sendAndConfirmTransaction(conn, transaction, [
            adminWallet,
          ]);
          console.log("Mint NFT Transaction confirmed:", sig);
          return sig;
        });

        let refund = gemAmounts.refund;
        if (refund > 0) {
          await this.refundGems(refund);
        }
        console.log("Refunded amount:", gemAmounts.refund);
        await this.waitForFinalization(conn, signature);
        return signature;
      } catch (error) {
        console.error("Error in burnTokenTransferNFT:", error);

        // Remboursement des gems burnées en cas d'échec
        console.log("Minting failed. Refunding burned gems...");
        for (const [gemValue, burnedAmount] of Object.entries(burnedGems)) {
          await this.refundGems(burnedAmount, gemValue);
        }
        console.log("All burned gems have been refunded.");

        throw error;
      }
    } catch (error) {
      console.error("Error in burnTokenTransferNFT:", error);
      throw error;
    }
  };

  burnUserNFT = async (qrCodeData: string): Promise<string> => {
    try {
      // Parser les données du QR code
      const parsedData: BurnNFTParams = JSON.parse(qrCodeData);
      const { userWallet, nftMintAddress } = parsedData;

      const connectionConfig = { rpcTarget: "https://api.devnet.solana.com" };
      const conn = new Connection(connectionConfig.rpcTarget);
      const adminWallet = await this.getAdminWallet();
      const provider = new AnchorProvider(conn, adminWallet as any, {
        preflightCommitment: "finalized",
      });
      const program = new Program(idl as any, provider);
      setProvider(provider);

      const MINT_NFT_ACCOUNT = new PublicKey(nftMintAddress);
      const userPublicKey = new PublicKey(userWallet);

      // Obtenir l'ATA de l'utilisateur pour le NFT
      const userNftATA = await getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        adminWallet,
        MINT_NFT_ACCOUNT,
        userPublicKey
      );

      const burnInstruction = program.instruction.burnTokenOnly({
        accounts: {
          associatedTokenAccount: userNftATA.address,
          mintTokenAccount: MINT_NFT_ACCOUNT,
          fromAuthority: adminWallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      });

      const latestBlockhash = await conn.getLatestBlockhash("finalized");
      const transaction = new Transaction({
        feePayer: adminWallet.publicKey,
        ...latestBlockhash,
      }).add(burnInstruction);

      // Signer et envoyer la transaction avec le portefeuille admin
      const signature = await sendAndConfirmTransaction(conn, transaction, [
        adminWallet,
      ]);
      await this.waitForFinalization(conn, signature);
      console.log("NFT burned successfully. Transaction signature:", signature);
      return signature;
    } catch (error) {
      console.error("Error in burnNFT:", error);
      throw error;
    }
  };

  createReceipt = async (
    userWallet: string,
    burnedNftMintAddress: string
  ): Promise<string> => {
    try {
      const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
        MPL_TOKEN_METADATA_PROGRAM_ID
      );
      const connectionConfig = { rpcTarget: "https://api.devnet.solana.com" };
      const conn = new Connection(connectionConfig.rpcTarget);
      const adminWallet = await this.getAdminWallet();
      const provider = new AnchorProvider(conn, adminWallet as any, {
        preflightCommitment: "finalized",
      });
      const program = new Program(idl as any, provider);
      setProvider(provider);

      const userPublicKey = new PublicKey(userWallet);

      // Trouver le NFT correspondant dans le tableau nftMetadata
      const burnedNft = nftMetadata.find(
        (nft) => nft.address === burnedNftMintAddress
      );
      if (!burnedNft) {
        throw new Error("Burned NFT not found in metadata");
      }

      // Construire l'URI du reçu à partir des informations du NFT brûlé
      const receiptUri = burnedNft.uriReceipt;

      // Générer un nouveau keypair pour le reçu NFT
      const receiptMintKeypair = Keypair.generate();

      // Dériver les comptes nécessaires
      const [metadataAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          receiptMintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      const associatedReceiptTokenAccount = getAssociatedTokenAddressSync(
        receiptMintKeypair.publicKey,
        userPublicKey
      );

      // Récupérer les informations de la collection pour les reçus
      const collectionMint = new PublicKey(receiptsCollectionMint);
      const [collectionMetadata] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          collectionMint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      const [collectionMasterEdition] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          collectionMint.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      // Préparer les données du reçu
      const receiptName = `Receipt for ${burnedNft.name}`;
      const receiptSymbol = `${burnedNft.symbol}R`;

      const createReceiptInstruction = program.instruction.createReceipt(
        receiptName,
        receiptSymbol,
        receiptUri,
        {
          accounts: {
            user: userPublicKey,
            admin: adminWallet.publicKey,
            metadataAccount,
            mintReceiptAccount: receiptMintKeypair.publicKey,
            associatedReceiptTokenAccount,
            collectionMint,
            collectionMetadata,
            collectionMasterEdition,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
          },
        }
      );

      const latestBlockhash = await conn.getLatestBlockhash("finalized");
      const transaction = new Transaction({
        feePayer: adminWallet.publicKey,
        ...latestBlockhash,
      }).add(createReceiptInstruction);

      transaction.partialSign(receiptMintKeypair);

      const signature = await sendAndConfirmTransaction(conn, transaction, [
        adminWallet,
        receiptMintKeypair,
      ]);
      await this.waitForFinalization(conn, signature);
      console.log(
        "Receipt created successfully. Transaction signature:",
        signature
      );
      return signature;
    } catch (error) {
      console.error("Error in createReceipt:", error);
      throw error;
    }
  };

  fetchReceipt = async (): Promise<any[]> => {
    try {
      const users = await this.getAccounts();
      const userWallet = new PublicKey(users[0]);
      const conn = new Connection("https://api.devnet.solana.com");

      // Adresse de la collection des reçus
      const RECEIPT_COLLECTION_ADDRESS = new PublicKey(receiptsCollectionMint);

      const tokenAccounts = await conn.getParsedTokenAccountsByOwner(
        userWallet,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      const receipts: any[] = [];

      for (const account of tokenAccounts.value) {
        const tokenInfo = account.account.data.parsed.info;
        if (
          tokenInfo.tokenAmount.decimals === 0 &&
          tokenInfo.tokenAmount.amount === "1"
        ) {
          const mintPublicKey = new PublicKey(tokenInfo.mint);
          const nftMetadata = await fetchDigitalAsset(
            this.umi,
            mintPublicKey as any
          );

          // Vérifier si le NFT appartient à la collection des reçus
          if (
            nftMetadata.metadata.collection?.__option === "Some" &&
            nftMetadata.metadata.collection?.value.key ===
              RECEIPT_COLLECTION_ADDRESS.toBase58()
          ) {
            // Récupérer la signature de transaction du mint
            const signatures = await conn.getSignaturesForAddress(
              mintPublicKey,
              { limit: 1 }
            );
            const txDetails = await conn.getTransaction(
              signatures[0]?.signature
            );
            const mintTimestamp = txDetails?.blockTime
              ? txDetails.blockTime * 1000
              : null;

            // Récupérer les métadonnées du reçu
            const uri = nftMetadata.metadata.uri.replace(
              "ipfs://",
              ipfsGateway
            );
            const response = await fetch(uri);
            const metadata = await response.json();

            receipts.push({
              name: nftMetadata.metadata.name,
              image: metadata.image.replace("ipfs://", ipfsGateway),
              description: metadata.description,
              mintTimestamp,
              mint: nftMetadata.metadata.mint,
            });
          }
        }
      }

      return receipts;
    } catch (error) {
      console.error("Erreur lors de la récupération des reçus:", error);
      throw error;
    }
  };

  CreateTicketNFT = async () => {
    const SEED_METADATA = "metadata";
    const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
      MPL_TOKEN_METADATA_PROGRAM_ID
    );
    const httpMetadataUri = ticketMetadata.uri.replace("ipfs://", ipfsGateway);
    const jsonData = await fetch(httpMetadataUri);
    const fetched = (await jsonData.json()) as {
      symbol: any;
      name: string;
    };
    const dataNFT = {
      name: fetched.name,
      symbol: fetched.symbol,
      uri: ticketMetadata.uri,
    };
    const solanaWallet = new SolanaWallet(this.provider);
    const users = await this.getAccounts();
    const userWallet = users[0];
    const connectionConfig = await solanaWallet.request<
      string[],
      CustomChainConfig
    >({
      method: "solana_provider_config",
      params: [],
    });
    const conn = new Connection(connectionConfig.rpcTarget);
    const adminWallet = await this.getAdminWallet();
    const provider = new AnchorProvider(conn, adminWallet as any, {
      preflightCommitment: "finalized",
    });
    const program = new Program(idl as any, provider);
    setProvider(provider);
    const buyer = new PublicKey(userWallet);
    // Generate a new keypair for the mint
    const mintNftTokenAccount = new Keypair();
    // Derive the associated token address account for the mint and payer.
    const associatedNftTokenAccountAddress = getAssociatedTokenAddressSync(
      mintNftTokenAccount.publicKey,
      buyer
    );

    const [metadataAccount] = await PublicKey.findProgramAddress(
      [
        Buffer.from(SEED_METADATA),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintNftTokenAccount.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const [initialPricePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("initial_price")],
      program.programId
    );

    const [ticketStatusPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("ticket_status"), mintNftTokenAccount.publicKey.toBuffer()],
      program.programId
    );

    // Ajout des nouvelles adresses pour la collection
    // const [collectionAuthorityPDA] = PublicKey.findProgramAddressSync(
    //   [Buffer.from("collection")],
    //   program.programId
    // );

    const collectionMint = new PublicKey(ticketsCollectionMint);

    const [collectionMetadata] = await PublicKey.findProgramAddress(
      [
        Buffer.from(SEED_METADATA),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const [collectionMasterEdition] = await PublicKey.findProgramAddress(
      [
        Buffer.from(SEED_METADATA),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        collectionMint.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    const buyerInstruction = program.instruction.createTicketNft(
      dataNFT.name,
      dataNFT.symbol,
      dataNFT.uri,
      {
        accounts: {
          payer: buyer,
          admin: adminWallet.publicKey,
          // updateAuthority: adminWallet.publicKey,
          initialPriceAccount: initialPricePDA,
          metadataAccount,
          mintNftAccount: mintNftTokenAccount.publicKey,
          associatedNftTokenAccount: associatedNftTokenAccountAddress,
          ticketStatusAccount: ticketStatusPDA,
          //collectionAuthority: adminWallet.publicKey,
          collectionMint,
          collectionMetadata,
          collectionMasterEdition,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        },
      }
    );
    try {
      const latestBlockhashInfo = await conn.getLatestBlockhash("finalized");
      const transaction = new Transaction({
        blockhash: latestBlockhashInfo.blockhash,
        feePayer: adminWallet.publicKey,
        lastValidBlockHeight: latestBlockhashInfo.lastValidBlockHeight,
      }).add(buyerInstruction);

      transaction.partialSign(adminWallet);
      transaction.partialSign(mintNftTokenAccount);
      const userSignedTransaction = await solanaWallet.signTransaction(
        transaction
      );
      const signature = await conn.sendRawTransaction(
        userSignedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        }
      );

      // await conn.confirmTransaction(signature, "confirmed");
      await this.waitForFinalization(conn, signature);
      console.log("Ticket NFT created. Signature:", signature);
      return signature;
    } catch (error) {
      if (error instanceof web3.SendTransactionError) {
        console.error("Transaction failed. Error details:", error);
        console.error("Error logs:", error.logs);
      } else {
        console.error("Error creating ticket NFT:", error);
      }
      throw error;
    }
  };

  getUserTickets = async () => {
    try {
      const users = await this.getAccounts();
      const userWallet = new PublicKey(users[0]);
      const conn = new Connection("https://api.devnet.solana.com");
      const tokenAccounts = await conn.getParsedTokenAccountsByOwner(
        userWallet,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );
      const tickets: any[] = [];
      for (const account of tokenAccounts.value) {
        const tokenInfo = account.account.data.parsed.info;
        if (
          tokenInfo.tokenAmount.decimals === 0 &&
          tokenInfo.tokenAmount.amount === "1"
        ) {
          const mintPublicKey = new PublicKey(tokenInfo.mint);
          const nftMetadata = await fetchDigitalAsset(
            this.umi,
            mintPublicKey as any
          );
          if (
            nftMetadata.metadata.collection?.__option === "Some" &&
            nftMetadata.metadata.collection?.value.key === ticketsCollectionMint
          ) {
            const mintAddress = new PublicKey(nftMetadata.metadata.mint);
            const signatures = await conn.getSignaturesForAddress(mintAddress, {
              limit: 1,
            });
            const txDetails = await conn.getTransaction(
              signatures[0]?.signature
            );
            const mintTimestamp = txDetails?.blockTime
              ? txDetails.blockTime * 1000
              : null;

            const uri = nftMetadata.metadata.uri.replace(
              "ipfs://",
              ipfsGateway
            );
            const jsonData = await fetch(uri);
            const image = (await jsonData.json()).image;
            tickets.push({
              mint: nftMetadata.metadata.mint,
              name: nftMetadata.metadata.name,
              image: image.replace("ipfs://", ipfsGateway),
              mintTimestamp,
            });
          }
        }
      }
      return tickets;
    } catch (error) {
      console.error("Erreur lors de la récupération des NFTs:", error);
      return [];
    }
  };

  fetchNFTByUser = async (): Promise<{ [key: string]: number }> => {
    try {
      const users = await this.getAccounts();
      const userWallet = new PublicKey(users[0]);
      const connectionConfig = {
        rpcTarget: "https://api.devnet.solana.com",
      };
      const conn = new Connection(connectionConfig.rpcTarget);

      const getNFTBalance = async (mintAddress: PublicKey) => {
        const associatedTokenAccount = await PublicKey.findProgramAddress(
          [
            userWallet.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintAddress.toBuffer(),
          ],
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const tokenAccountInfo = await conn.getAccountInfo(
          associatedTokenAccount[0]
        );
        if (!tokenAccountInfo) return 0;

        const amount = tokenAccountInfo.data.readUIntLE(64, 8);
        return amount;
      };

      const nftBalances: { [key: string]: number } = {};

      for (const nft of nftMetadata) {
        const mintAddress = new PublicKey(nft.address);
        const balance = await getNFTBalance(mintAddress);
        nftBalances[nft.symbol] = balance;
      }

      return nftBalances;
    } catch (error) {
      console.error("Failed to fetch user NFTs:", error);
      throw error;
    }
  };
}
