import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { clusterApiUrl, PublicKey, Connection, Keypair } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";
import "dotenv/config";
import fs from "fs";
import path from "path";

const INITIAL_PRICE_SEED = "initial_price";
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);

let wallet: anchor.Wallet;
let program: any;

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const walletKPSecretKey = bs58.decode(process.env.PRIVATE_KEY);
  const walletKP = Keypair.fromSecretKey(walletKPSecretKey);

  wallet = new anchor.Wallet(walletKP as any);
  console.log("Wallet:", wallet.publicKey.toBase58());

  const provider = new anchor.AnchorProvider(connection as any, wallet, {
    preflightCommitment: "processed",
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const idl = JSON.parse(
    require("fs").readFileSync("./target/idl/gemquest.json", "utf8")
  );
  program = new Program(idl, provider);
  console.log("Program ID:", program.programId.toBase58());

  const initialPriceInfo = await initializeInitialPrice();
  const collectionInfo = await initializeCollection();

  const utilContent = `
// GemQuest Ticket Utility File

// Program ID
export const PROGRAM_ID = "${program.programId.toBase58()}";

// Initial Price Information
export const INITIAL_PRICE_PDA = "${initialPriceInfo.pda}";
export const INITIAL_PRICE = "${initialPriceInfo.price}";

// Collection Information
export const ticketsCollectionMint = "${collectionInfo.mint}";
export const ticketsCollectionMetadata = "${collectionInfo.metadata}";

// Seeds
export const INITIAL_PRICE_SEED = "${INITIAL_PRICE_SEED}";

// Other Constants
export const TOKEN_METADATA_PROGRAM_ID = "${TOKEN_METADATA_PROGRAM_ID.toBase58()}";
  `;

  fs.writeFileSync(path.join(__dirname, "util3Ticket.js"), utilContent);
  console.log("utilTicket.js file created successfully.");
}

async function initializeInitialPrice() {
  const [initialPricePDA] = await PublicKey.findProgramAddress(
    [Buffer.from(INITIAL_PRICE_SEED)],
    program.programId
  );

  try {
    const account = await program.account.initialPriceAccount
      .fetch(initialPricePDA)
      .catch(() => null);

    if (!account) {
      await program.methods
        .initializeInitialPrice()
        .accounts({
          initialPriceAccount: initialPricePDA,
          admin: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Initial price initialized successfully.");
    } else {
      console.log("Initial price account already exists.");
    }

    console.log("Initial Price PDA:", initialPricePDA.toBase58());

    const fetchedAccount = await program.account.initialPriceAccount.fetch(
      initialPricePDA
    );
    console.log("Initial Price:", fetchedAccount.price.toString());

    return {
      pda: initialPricePDA.toBase58(),
      price: fetchedAccount.price.toString(),
    };
  } catch (error) {
    console.error("Error initializing initial price:", error);
    throw error;
  }
}

async function initializeCollection() {
  const collectionMint = Keypair.generate();
  const collectionTokenAccount = await getAssociatedTokenAddress(
    collectionMint.publicKey,
    wallet.publicKey
  );
  const collectionMetadata = await getMetadataAddress(collectionMint.publicKey);
  const collectionMasterEdition = await getMasterEditionAddress(
    collectionMint.publicKey
  );

  try {
    await program.methods
      .initializeCollection(
        "GemQuest Tickets Collection",
        "GQT",
        "ipfs://QmWGuL3UFv3wNbuzWGzeod2LDVMjhspL6Qq86ZpzWMaWWU"
      )
      .accounts({
        admin: wallet.publicKey,
        collectionMint: collectionMint.publicKey,
        collectionTokenAccount: collectionTokenAccount,
        collectionMetadata: collectionMetadata,
        collectionMasterEdition: collectionMasterEdition,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([collectionMint])
      .rpc();

    console.log("Collection initialized successfully.");
    console.log("Collection Mint:", collectionMint.publicKey.toBase58());
    console.log("Collection Metadata:", collectionMetadata.toBase58());

    return {
      mint: collectionMint.publicKey.toBase58(),
      metadata: collectionMetadata.toBase58(),
    };
  } catch (error) {
    console.error("Error initializing collection:", error);
    throw error;
  }
}

async function getMetadataAddress(mint: PublicKey): Promise<PublicKey> {
  return (
    await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
}

async function getMasterEditionAddress(mint: PublicKey): Promise<PublicKey> {
  return (
    await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
