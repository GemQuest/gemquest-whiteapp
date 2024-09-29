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

  const collectionInfo = await initializeReceiptCollection();

  const utilContent = `
// GemQuest Receipt Utility File

// Program ID
export const PROGRAM_ID = "${program.programId.toBase58()}";

// Receipt Collection Information
export const receiptsCollectionMint = "${collectionInfo.mint}";
export const receiptsCollectionMetadata = "${collectionInfo.metadata}";

// Other Constants
export const TOKEN_METADATA_PROGRAM_ID = "${TOKEN_METADATA_PROGRAM_ID.toBase58()}";
  `;

  fs.writeFileSync(path.join(__dirname, "util4Receipt.js"), utilContent);
  console.log("util4Receipt.js file created successfully.");
}

async function initializeReceiptCollection() {
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
        "GemQuest Exchanges Receipts",
        "GQRER",
        "ipfs://QmewwXMsbitwo4U5akfRdsy3uafM9AdKAi6ZdgJU26ZqX7"
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

    console.log("Receipt Collection initialized successfully.");
    console.log(
      "Receipt Collection Mint:",
      collectionMint.publicKey.toBase58()
    );
    console.log("Receipt Collection Metadata:", collectionMetadata.toBase58());

    return {
      mint: collectionMint.publicKey.toBase58(),
      metadata: collectionMetadata.toBase58(),
    };
  } catch (error) {
    console.error("Error initializing receipt collection:", error);
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
