import {
  Program,
  Wallet,
  BN,
  AnchorProvider,
  setProvider,
  workspace,
  web3,
} from "@coral-xyz/anchor";
import { Gemquest } from "../target/types/gemquest";
import { assert, expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getMint,
  getAccount,
  unpackAccount,
  Account,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  createMintToInstruction,
  createApproveInstruction,
} from "@solana/spl-token";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

interface MintTokenAccounts {
  mintAuthority: PublicKey;
  recipient: PublicKey;
  mintAccount: PublicKey;
  associatedTokenAccount: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
  systemProgram: PublicKey;
}

interface CreateNftAccounts {
  payer: PublicKey;
  metadataAccount: PublicKey;
  editionAccount: PublicKey;
  mintNftAccount: PublicKey;
  associatedNftTokenAccount: PublicKey;
  tokenProgram: PublicKey;
  tokenMetadataProgram: PublicKey;
  associatedTokenProgram: PublicKey;
  systemProgram: PublicKey;
  rent: PublicKey;
}

interface BurnTokenTransferNftAccounts {
  mintTokenAccount: PublicKey;
  associatedTokenAccount: PublicKey;
  from: PublicKey;
  to: PublicKey;
  fromAuthority: PublicKey;
  tokenProgram: PublicKey;
  burnTracker: PublicKey;
}

interface ApproveTokenAccounts {
  associatedTokenAccount: PublicKey;
  delegate: PublicKey;
  authority: PublicKey;
  tokenProgram: PublicKey;
}

describe("***** GemQuest Unit TESTS ******", () => {
  let ADMIN: Wallet;
  const USER_1 = Keypair.generate();
  const USER_2 = Keypair.generate();
  let program: Program<Gemquest>;
  let isDevnet: boolean = true;
  let MINT_TOKEN_ACCOUNT: Keypair;
  let MINT_NFT_ACCOUNT: Keypair;

  // const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  //   "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  // );
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    MPL_TOKEN_METADATA_PROGRAM_ID
  );

  before(async () => {
    // Get env from anchor.toml
    const provider = AnchorProvider.env();
    if (
      provider.connection.rpcEndpoint === "http://127.0.0.1:8899" ||
      provider.connection.rpcEndpoint === "localnet"
    ) {
      isDevnet = false;
    }
    setProvider(provider);
    ADMIN = provider.wallet as Wallet;

    console.log("Launching test on: ", provider.connection.rpcEndpoint);
    console.log("Admin wallet:", ADMIN.publicKey.toBase58());
    console.log("User1 wallet:", USER_1.publicKey.toBase58());

    program = workspace.Gemquest as Program<Gemquest>;

    console.log("Program_ID: ", program.programId.toBase58());

    if (isDevnet) {
      // MINT_TOKEN_ACCOUNT = "Ct7Dssm7FNEkzhXteikNtNm9ALtbGr3mMHkHszrrZLGr";
      MINT_TOKEN_ACCOUNT = Keypair.generate();
      MINT_NFT_ACCOUNT = Keypair.generate();
    } else {
      MINT_TOKEN_ACCOUNT = Keypair.generate();
      MINT_NFT_ACCOUNT = Keypair.generate();

      await requestAirdrop(ADMIN.publicKey);
      await requestAirdrop(USER_1.publicKey);
    }
  });

  const requestAirdrop = async (publicKey: PublicKey) => {
    const airdropSignature = await program.provider.connection.requestAirdrop(
      ADMIN.publicKey,
      2 * web3.LAMPORTS_PER_SOL
    );

    await program.provider.connection.confirmTransaction(airdropSignature);
  };

  //     describe("GemQuest User acconts TESTS", () => {

  //         it("- should initialize a new user account", async () => {

  //             // Generate a new keypair for the user
  //             const userKeypair = anchor.web3.Keypair.generate();

  //             // Generate the user account PDA
  //             const [userAccountPda] = await anchor.web3.PublicKey.findProgramAddress(
  //                 [Buffer.from(USER_ACCOUNT_SEED), userKeypair.publicKey.toBuffer()],
  //                 program.programId
  //             );

  //             console.log("User account PDA:", userAccountPda.toBase58());

  //             // Create a transaction to initialize the user account
  //             await program.methods
  //                 .initializeUserAccount()
  //                 .accounts({
  //                     userAccount: userAccountPda,
  //                     admin: provider.wallet.publicKey, // Admin will pays for the transaction
  //                     user: userKeypair.publicKey,
  //                     systemProgram: anchor.web3.SystemProgram.programId,
  //                 })
  //                 .signers([provider.wallet.payer])
  //                 .rpc();

  //             // Fetch the user account and verify its authority
  //             const userAccount = await program.account.userAccount.fetch(userAccountPda);
  //             expect(userAccount.authority.toString()).to.equal(userKeypair.publicKey.toString());
  //         });

  //         it("- should fails when initialize a new user account with an unauthorized admin", async () => {
  //             // Generate a new keypair for the user
  //             const userKeypair = anchor.web3.Keypair.generate();

  //             // Generate the user account PDA
  //             const [userAccountPda] = await anchor.web3.PublicKey.findProgramAddress(
  //                 [Buffer.from(USER_ACCOUNT_SEED), userKeypair.publicKey.toBuffer()],
  //                 program.programId
  //             );

  //             console.log("User account PDA:", userAccountPda.toBase58());

  //             // Create a transaction to initialize the user account with an unauthorized admin
  //             const unauthorizedAdmin = anchor.web3.Keypair.generate();
  //             try {
  //                 await program.methods
  //                     .initializeUserAccount()
  //                     .accounts({
  //                         userAccount: userAccountPda,
  //                         admin: unauthorizedAdmin.publicKey,
  //                         user: userKeypair.publicKey,
  //                         systemProgram: anchor.web3.SystemProgram.programId,
  //                     })
  //                     .signers([unauthorizedAdmin])
  //                     .rpc();

  //                 assert.fail("Expected transaction to fail");
  //             }
  //             catch (error) {

  //                 // console.log((error as AnchorError).message);
  //                 // assert.equal(
  //                 //     error.error.errorMessage,
  //                 //     "",
  //                 //     ""
  //                 // );
  //             }
  //         });
  //     });

  describe("*** GemQuest GEM Token program TESTS ***", () => {
    const metadata = {
      name: "Solana GEMS",
      symbol: "GEMS",
      uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json",
    };

    before(async () => {
      console.log(
        "Mint Token Account",
        MINT_TOKEN_ACCOUNT.publicKey.toBase58()
      );
    });

    it("- should create a new spl-token", async () => {
      await program.methods
        .createToken(metadata.name, metadata.symbol, metadata.uri)
        .accounts({
          payer: ADMIN.publicKey,
          mintAccount: MINT_TOKEN_ACCOUNT.publicKey,
        })
        .signers([MINT_TOKEN_ACCOUNT])
        .rpc();

      // Will throw if the mint account does not exist.
      const mintInfo = await getMint(
        program.provider.connection as any,
        new PublicKey(MINT_TOKEN_ACCOUNT.publicKey)
      );
      assert.isNotNull(mintInfo, "Mint info should not be null");
    });

    it("- should create spl-token with the correct address", async () => {
      const mintInfo = await getMint(
        program.provider.connection as any,
        new PublicKey(MINT_TOKEN_ACCOUNT.publicKey)
      );
      expect(mintInfo.address.toString()).to.equal(
        MINT_TOKEN_ACCOUNT.publicKey.toString()
      );
    });

    it("- should create spl-token with the correct authority address", async () => {
      const mintInfo = await getMint(
        program.provider.connection as any,
        new PublicKey(MINT_TOKEN_ACCOUNT.publicKey)
      );
      expect(mintInfo.mintAuthority.toString()).to.equal(
        ADMIN.publicKey.toString()
      );
    });

    it("- should fail if minting tokens with user wallet signer", async () => {
      try {
        // Derive the associated token address account for the mint and user.
        const associatedTokenAccountAddress = getAssociatedTokenAddressSync(
          MINT_TOKEN_ACCOUNT.publicKey,
          USER_1.publicKey
        );

        // Amount of tokens to mint.
        const invalidAmount = 0;

        await program.methods
          .mintTokensToUser(new BN(invalidAmount))
          .accounts({
            mintAuthority: ADMIN.publicKey,
            recipient: USER_1.publicKey,
            mintAccount: MINT_TOKEN_ACCOUNT.publicKey,
            associatedTokenAccount: associatedTokenAccountAddress,

            // system
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
          } as MintTokenAccounts)
          .rpc();

        assert.fail("Expected transaction to fail");
      } catch (error) {}
    });

    it("- should fail if minting tokens with invalid value", async () => {
      try {
        // Derive the associated token address account for the mint and user.
        const associatedTokenAccountAddress = getAssociatedTokenAddressSync(
          MINT_TOKEN_ACCOUNT.publicKey,
          USER_1.publicKey
        );

        // Amount of tokens to mint.
        const invalidAmount = 0;

        await program.methods
          .mintTokensToUser(new BN(invalidAmount))
          .accounts({
            mintAuthority: USER_1.publicKey,
            recipient: USER_1.publicKey,
            mintAccount: MINT_TOKEN_ACCOUNT.publicKey,
            associatedTokenAccount: associatedTokenAccountAddress,

            // system
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
          } as MintTokenAccounts)
          .rpc();

        assert.fail("Expected transaction to fail");
      } catch (error) {}
    });

    it("- should mint some tokens to the user wallet", async () => {
      // Derive the associated token address account for the mint and user.
      const associatedTokenAccountAddress = getAssociatedTokenAddressSync(
        MINT_TOKEN_ACCOUNT.publicKey,
        USER_1.publicKey
      );

      // Amount of tokens to mint.
      const amount = 100;

      let previousBalance: number;
      try {
        previousBalance = (
          await program.provider.connection.getTokenAccountBalance(
            associatedTokenAccountAddress
          )
        ).value.uiAmount;
      } catch {
        // Will throw if the associated token account does not exist yet.
        previousBalance = 0;
      }

      // Mint the tokens to the associated token account.
      await program.methods
        .mintTokensToUser(new BN(amount))
        .accounts({
          mintAuthority: ADMIN.publicKey,
          recipient: USER_1.publicKey,
          mintAccount: MINT_TOKEN_ACCOUNT.publicKey,
          associatedTokenAccount: associatedTokenAccountAddress,

          // system
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        } as MintTokenAccounts)
        .rpc();

      const postBalance = (
        await program.provider.connection.getTokenAccountBalance(
          associatedTokenAccountAddress
        )
      ).value.uiAmount;

      expect(postBalance.toString()).to.equal(
        (previousBalance + amount).toString()
      );
    });
  });

  describe("*** GemQuest NFT TESTS ***", () => {
    const NFT_PRICE = 10 * web3.LAMPORTS_PER_SOL;
    let userTokenATA: Account;

    // The metadata for our NFT
    const metadata = {
      name: "Free Snack",
      symbol: "GQFS",
      uri: "ipfs://bafybeibb5rh62yfijm7ypoaphsz4rzvf7wlvjucicafu5v3eq2aur3rv3a/GQFS.json",
    };

    before(async () => {
      console.log("Mint NFT Account", MINT_NFT_ACCOUNT.publicKey.toBase58());
      console.log(
        "Mint Token Account",
        MINT_TOKEN_ACCOUNT.publicKey.toBase58()
      );

      userTokenATA = await getOrCreateAssociatedTokenAccount(
        program.provider.connection as any,
        ADMIN.payer, // Payer
        MINT_TOKEN_ACCOUNT.publicKey,
        USER_1.publicKey
      );
      console.log("User Token ATA:", userTokenATA.address.toBase58());
    });

    it("- should fail if approving more tokens than owned", async () => {
      try {
        // Amount of tokens to mint.
        const invalidAmount = 9999999;

        await program.methods
          .approveToken(new BN(invalidAmount))
          .accounts({
            associatedTokenAccount: userTokenATA.address,

            delegate: ADMIN.publicKey,
            authority: USER_1.publicKey,

            // system
            tokenProgram: TOKEN_PROGRAM_ID,
          } as ApproveTokenAccounts)
          .signers([USER_1])
          .rpc();

        assert.fail("Expected transaction to fail");
      } catch (error) {}
    });

    it("- should approve the right amount of delegated token", async () => {
      await program.methods
        .approveToken(new BN(NFT_PRICE))
        .accounts({
          associatedTokenAccount: userTokenATA.address,

          delegate: ADMIN.publicKey,
          authority: USER_1.publicKey,

          // system
          tokenProgram: TOKEN_PROGRAM_ID,
        } as ApproveTokenAccounts)
        .signers([USER_1])
        .rpc();

      const accountInfo = await program.provider.connection.getAccountInfo(
        userTokenATA.address
      );
      const uAccount = unpackAccount(
        userTokenATA.address,
        accountInfo,
        TOKEN_PROGRAM_ID
      );

      expect(uAccount.delegatedAmount.toString()).to.equal(
        NFT_PRICE.toString()
      );
    });

    it("- should fail if creating a NFT without enough token", async () => {
      try {
        const invalidNftAmountToMint = 0;
        const adminNftATA = getAssociatedTokenAddressSync(
          MINT_NFT_ACCOUNT.publicKey,
          ADMIN.publicKey
        );

        const [metadataAccount] = await PublicKey.findProgramAddress(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            MINT_NFT_ACCOUNT.publicKey.toBuffer(),
          ],
          TOKEN_METADATA_PROGRAM_ID
        );

        const [editionAccount] = await PublicKey.findProgramAddress(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            MINT_NFT_ACCOUNT.publicKey.toBuffer(),
            Buffer.from("edition"),
          ],
          TOKEN_METADATA_PROGRAM_ID
        );

        await program.methods
          .createNft(
            metadata.name,
            metadata.symbol,
            metadata.uri,
            new BN(invalidNftAmountToMint)
          )
          .accounts({
            payer: ADMIN.publicKey,

            metadataAccount: metadataAccount,
            editionAccount: editionAccount,

            mintNftAccount: MINT_NFT_ACCOUNT.publicKey,
            associatedNftTokenAccount: adminNftATA,

            // system
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
          } as CreateNftAccounts)
          .signers([MINT_NFT_ACCOUNT])
          .rpc();

        assert.fail("Expected transaction to fail");
      } catch (error) {}
    });

    it("- should create 10 new NFTs in Admin wallet", async () => {
      const nftAmountToMint = 10;
      const adminNftATA = getAssociatedTokenAddressSync(
        MINT_NFT_ACCOUNT.publicKey,
        ADMIN.publicKey
      );

      let nftAmountBefore: number;
      try {
        const nftAccountInfoBefore = await getAccount(
          program.provider.connection as any,
          adminNftATA
        );
        nftAmountBefore = Number(nftAccountInfoBefore.amount);
      } catch {
        // Will throw if the associated NFT token account does not exist yet.
        nftAmountBefore = 0;
      }

      const [metadataAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          MINT_NFT_ACCOUNT.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      const [editionAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          MINT_NFT_ACCOUNT.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      await program.methods
        .createNft(
          metadata.name,
          metadata.symbol,
          metadata.uri,
          new BN(nftAmountToMint)
        )
        .accounts({
          payer: ADMIN.publicKey,

          metadataAccount: metadataAccount,
          editionAccount: editionAccount,

          mintNftAccount: MINT_NFT_ACCOUNT.publicKey,
          associatedNftTokenAccount: adminNftATA,

          // system
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        } as CreateNftAccounts)
        .signers([MINT_NFT_ACCOUNT])
        .rpc();

      const nftAccountInfoAfter = await getAccount(
        program.provider.connection as any,
        adminNftATA
      );
      expect(nftAccountInfoAfter.amount.toString()).to.equal(
        (nftAmountBefore + nftAmountToMint).toString()
      );
    });
  });

  describe("burn_token_transfer_nft", () => {
    let userGemATA: PublicKey;
    let userNftATA: PublicKey;
    let adminNftATA: PublicKey;
    let burnTrackerPDA: PublicKey;
    let metadataAccount: PublicKey;
    let editionAccount: PublicKey;
    let MINT_TOKEN_ACCOUNT: Keypair;
    let MINT_NFT_ACCOUNT: Keypair;
    let metadata = {
      name: "Free Snack",
      symbol: "GQFS",
      uri: "ipfs://bafybeibb5rh62yfijm7ypoaphsz4rzvf7wlvjucicafu5v3eq2aur3rv3a/GQFS.json",
    };
    before(async () => {
      MINT_TOKEN_ACCOUNT = Keypair.generate();
      MINT_NFT_ACCOUNT = Keypair.generate();
      const balanceUser1 = await program.provider.connection.getBalance(
        USER_1.publicKey
      );
      if (balanceUser1 < 0.3 * LAMPORTS_PER_SOL) {
        await fundAccount(
          program.provider.connection,
          ADMIN.payer,
          USER_1.publicKey,
          1 * LAMPORTS_PER_SOL
        );
      }

      // Create gem token
      const accountInfo = await program.provider.connection.getAccountInfo(
        MINT_TOKEN_ACCOUNT.publicKey
      );
      if (accountInfo === null) {
        const uniqueIdentifier = Date.now().toString();
        const tokenName = `${metadata.name}_${uniqueIdentifier}`;
        const tokenSymbol = "xxxx";
        await program.methods
          .createToken(tokenName, tokenSymbol, metadata.uri)
          .accounts({
            payer: ADMIN.publicKey,
            mintAccount: MINT_TOKEN_ACCOUNT.publicKey,
          })
          .signers([MINT_TOKEN_ACCOUNT])
          .rpc();
      } else {
        console.log("MINT_TOKEN_ACCOUNT already exists, skipping creation");
      }

      userGemATA = getAssociatedTokenAddressSync(
        MINT_TOKEN_ACCOUNT.publicKey,
        USER_1.publicKey
      );

      // Create NFT
      await program.methods
        .createNft(metadata.name, metadata.symbol, metadata.uri, new BN(10))
        .accounts({
          payer: ADMIN.publicKey,
          metadataAccount: metadataAccount,
          editionAccount: editionAccount,
          mintNftAccount: MINT_NFT_ACCOUNT.publicKey,
          associatedNftTokenAccount: adminNftATA,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        } as CreateNftAccounts)
        .signers([MINT_NFT_ACCOUNT])
        .rpc();

      userNftATA = getAssociatedTokenAddressSync(
        MINT_NFT_ACCOUNT.publicKey,
        USER_1.publicKey
      );

      // Initialize burn tracker
      [burnTrackerPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("burn_tracker"), USER_1.publicKey.toBuffer()],
        program.programId
      );
      await program.methods
        .initializeBurnTracker()
        .accounts({
          burnTracker: burnTrackerPDA,
          payer: USER_1.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as any)
        .signers([USER_1])
        .rpc();
    });

    it("should burn gem tokens and prepare for NFT transfer", async () => {
      const gemAmount = new BN(5 * LAMPORTS_PER_SOL);

      // Mint gems to user
      await program.methods
        .mintTokensToUser(gemAmount)
        .accounts({
          mintAuthority: ADMIN.publicKey,
          recipient: USER_1.publicKey,
          mintAccount: MINT_TOKEN_ACCOUNT.publicKey,
          associatedTokenAccount: userGemATA,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        } as MintTokenAccounts)
        .rpc();

      // Approve program to burn tokens
      await program.methods
        .approveToken(gemAmount)
        .accounts({
          associatedTokenAccount: userGemATA,
          delegate: program.programId,
          authority: USER_1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as ApproveTokenAccounts)
        .signers([USER_1])
        .rpc();

      // Burn tokens
      await program.methods
        .burnTokenTransferNft(gemAmount, new BN(1))
        .accounts({
          associatedTokenAccount: userGemATA,
          mintTokenAccount: MINT_TOKEN_ACCOUNT.publicKey,
          from: userGemATA,
          to: new PublicKey(new Array(32).fill(1)),
          fromAuthority: USER_1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          burnTracker: burnTrackerPDA,
        } as BurnTokenTransferNftAccounts)
        .signers([USER_1])
        .rpc();

      // Check burn tracker
      const burnTracker = await program.account.burnTracker.fetch(
        burnTrackerPDA
      );
      expect(burnTracker.totalBurned.toString()).to.equal(gemAmount.toString());
    });

    // it("should transfer NFT after sufficient gems are burned", async () => {
    //   const nftPrice = new BN(5 * LAMPORTS_PER_SOL);

    //   // Mint NFT to ADMIN
    //   await mintTo(
    //     program.provider as AnchorProvider,
    //     MINT_NFT_ACCOUNT.publicKey,
    //     adminNftATA,
    //     ADMIN.payer as any,
    //     1
    //   );

    //   // Mint more gems to user if needed
    //   const gemAmount = new BN(10 * LAMPORTS_PER_SOL);
    //   await program.methods
    //     .mintTokensToUser(gemAmount)
    //     .accounts({
    //       mintAuthority: ADMIN.publicKey,
    //       recipient: USER_1.publicKey,
    //       mintAccount: MINT_TOKEN_ACCOUNT.publicKey,
    //       associatedTokenAccount: userGemATA,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    //       systemProgram: web3.SystemProgram.programId,
    //     } as MintTokenAccounts)
    //     .rpc();

    //   // Approve program to burn tokens
    //   await program.methods
    //     .approveToken(nftPrice)
    //     .accounts({
    //       associatedTokenAccount: userGemATA,
    //       delegate: program.programId,
    //       authority: USER_1.publicKey,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //     } as ApproveTokenAccounts)
    //     .signers([USER_1])
    //     .rpc();

    //   // Transfer NFT
    //   await program.methods
    //     .burnTokenTransferNft(nftPrice, new BN(0))
    //     .accounts({
    //       associatedTokenAccount: userGemATA,
    //       mintTokenAccount: MINT_TOKEN_ACCOUNT.publicKey,
    //       from: adminNftATA,
    //       to: userNftATA,
    //       fromAuthority: ADMIN.publicKey,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //       burnTracker: burnTrackerPDA,
    //     } as BurnTokenTransferNftAccounts)
    //     .signers([ADMIN.payer])
    //     .rpc();

    //   // Check NFT balance
    //   const userNftBalance =
    //     await program.provider.connection.getTokenAccountBalance(userNftATA);
    //   expect(userNftBalance.value.uiAmount).to.equal(1);

    //   // Check burn tracker is reset
    //   const burnTracker = await program.account.burnTracker.fetch(
    //     burnTrackerPDA
    //   );

    //   // Add null checks before accessing properties
    //   if (burnTracker && burnTracker.totalBurned && burnTracker.nftPrice) {
    //     expect(burnTracker.totalBurned.toString()).to.equal("0");
    //     expect(burnTracker.nftPrice.toString()).to.equal("0");
    //   } else {
    //     console.log(
    //       "Burn tracker or its properties are undefined:",
    //       burnTracker
    //     );
    //     expect.fail("Burn tracker or its properties are undefined");
    //   }
    // });
  });

  // Helper functions
  async function createMint(
    provider: AnchorProvider,
    payer: Keypair,
    decimals = 9
  ): Promise<PublicKey> {
    const mint = Keypair.generate();
    const instructions = [
      web3.SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: 82,
        lamports: await provider.connection.getMinimumBalanceForRentExemption(
          82
        ),
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mint.publicKey,
        decimals,
        payer.publicKey,
        payer.publicKey
      ),
    ];

    const tx = new web3.Transaction().add(...instructions);
    await provider.sendAndConfirm(tx, [payer, mint]);
    return mint.publicKey;
  }

  async function mintTo(
    provider: AnchorProvider,
    mint: PublicKey,
    destination: PublicKey,
    authority: Keypair,
    amount: number
  ) {
    const tx = new web3.Transaction().add(
      createMintToInstruction(mint, destination, authority.publicKey, amount)
    );
    await provider.sendAndConfirm(tx, [authority]);
  }

  async function approve(
    provider: AnchorProvider,
    account: PublicKey,
    owner: Keypair,
    delegate: PublicKey,
    amount: number
  ) {
    const tx = new web3.Transaction().add(
      createApproveInstruction(account, delegate, owner.publicKey, amount)
    );
    await provider.sendAndConfirm(tx, [owner]);
  }

  async function fundAccount(
    connection: web3.Connection,
    from: web3.Keypair,
    to: web3.PublicKey,
    amount: number
  ) {
    const transaction = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: amount,
      })
    );
    await web3.sendAndConfirmTransaction(connection, transaction, [from]);
  }
});
