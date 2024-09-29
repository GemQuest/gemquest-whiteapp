import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import {
  clusterApiUrl,
  PublicKey,
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import bs58 from "bs58";
import "dotenv/config";
import fs from "fs";
import path from "path";

let wallet: anchor.Wallet;
let program: any;
let gemAddresses: Record<string, string>;

try {
  const util1GemsPath = path.join(__dirname, "util1Gems.js");
  const util1GemsContent = fs.readFileSync(util1GemsPath, "utf8");

  // Utiliser une expression régulière pour extraire le contenu de gemAddresses
  const gemAddressesMatch = util1GemsContent.match(
    /export const gemAddresses = ({[\s\S]*?});/
  );

  if (gemAddressesMatch && gemAddressesMatch[1]) {
    // Évaluer le contenu extrait pour obtenir l'objet gemAddresses
    gemAddresses = eval(`(${gemAddressesMatch[1]})`);

    if (!gemAddresses) {
      console.log("Gem addresses not found in util1Gems.js");
      process.exit(-1);
    }
  } else {
    console.log("Could not parse gemAddresses from util1Gems.js");
    process.exit(-1);
  }
} catch (error) {
  console.error("Error reading or parsing util1Gems.js:", error);
  process.exit(-1);
}

// Vous pouvez maintenant utiliser gemAddresses dans votre code
console.log("Gem addresses loaded:", gemAddresses);

const GEM_20_MINT_ADDRESS = gemAddresses["20"];
const userWallet = new PublicKey(
  "J283MSa9G3rzz9VBM931VSZaSAyk57tJGtjs7LpC1vtu"
);

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

  await mintGemsToUser(15);
}

async function mintGemsToUser(amount: number) {
  const mint = new PublicKey(GEM_20_MINT_ADDRESS);
  const adminPublicKey = wallet.publicKey;

  const associatedTokenAccountAddress = getAssociatedTokenAddressSync(
    mint,
    userWallet
  );

  const instruction = await program.methods
    .mintTokensToUser(new BN(amount))
    .accounts({
      mintAuthority: adminPublicKey,
      recipient: userWallet,
      mintAccount: mint,
      associatedTokenAccount: associatedTokenAccountAddress,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    })
    .instruction();

  const { blockhash } = await program.provider.connection.getRecentBlockhash(
    "confirmed"
  );

  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: adminPublicKey,
  }).add(instruction);

  const signature = await sendAndConfirmTransaction(
    program.provider.connection,
    transaction,
    [wallet.payer]
  );

  console.log(`${amount} gems of 20 minted to admin: ${userWallet.toBase58()}`);
  console.log("Transaction signature:", signature);

  const postBalance = (
    await program.provider.connection.getTokenAccountBalance(
      associatedTokenAccountAddress
    )
  ).value.uiAmount;

  console.log("Admin balance of 20-value gems:", postBalance);
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
