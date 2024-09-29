import {
  AnchorProvider,
  web3,
  setProvider,
  Wallet,
  Program,
} from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl, PublicKey, Connection, Keypair } from "@solana/web3.js";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";
import "dotenv/config";
import fs from "fs";
import path from "path";

const METADATA_SEED = Buffer.from("metadata");
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);

let wallet: any;
let program: Program;

const gemAddresses: { [key: number]: string } = {};
const gemMetadataAccounts: { [key: number]: string } = {};

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const walletKP = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
  wallet = new Wallet(walletKP as any);
  console.log("Wallet:", wallet.publicKey.toBase58());

  const provider = new AnchorProvider(connection as any, wallet, {
    preflightCommitment: "processed",
    commitment: "confirmed",
  });
  setProvider(provider);

  const idl = JSON.parse(
    require("fs").readFileSync("./target/idl/gemquest.json", "utf8")
  );

  program = new Program(idl, provider as any);
  console.log("Program ID:", program.programId.toBase58());

  async function convertIpfsToHttp(ipfsUrl: string) {
    const httpMetadataUri = ipfsUrl.replace(
      "ipfs://",
      "https://fuchsia-varying-camel-696.mypinata.cloud/ipfs/"
    );
    const response = await fetch(httpMetadataUri);
    const fetched = (await response.json()) as {
      symbol: any;
      name: string;
    };
    return {
      name: fetched.name,
      symbol: fetched.symbol,
      uri: ipfsUrl,
    };
  }

  const metadata_gem_1 = await convertIpfsToHttp(
    "ipfs://QmTNdfcWPYmYHrmDnWvXMyjDMYxApxGSGMA41LEYrz3uG9/gem_1.json"
  );

  const metadata_gem_5 = await convertIpfsToHttp(
    "ipfs://QmTNdfcWPYmYHrmDnWvXMyjDMYxApxGSGMA41LEYrz3uG9/gem_5.json"
  );
  const metadata_gem_10 = await convertIpfsToHttp(
    "ipfs://QmTNdfcWPYmYHrmDnWvXMyjDMYxApxGSGMA41LEYrz3uG9/gem_10.json"
  );

  const metadata_gem_20 = await convertIpfsToHttp(
    "ipfs://QmTNdfcWPYmYHrmDnWvXMyjDMYxApxGSGMA41LEYrz3uG9/gem_20.json"
  );

  await CreateToken(metadata_gem_1, 1);
  await CreateToken(metadata_gem_5, 5);
  await CreateToken(metadata_gem_10, 10);
  await CreateToken(metadata_gem_20, 20);

  // Create gems.js file
  const convertKeysToNumbers = (obj: any) => {
    // covert key string to number
    const newObj: any = {};
    for (const key in obj) {
      newObj[parseInt(key)] = obj[key];
    }
    return newObj;
  };

  const gemsContent = `export const gemAddresses = ${JSON.stringify(
    convertKeysToNumbers(gemAddresses),
    null,
    2
  ).replace(/"(\d+)":/g, "$1:")};

export const gemMetadataAccounts = ${JSON.stringify(
    convertKeysToNumbers(gemMetadataAccounts),
    null,
    2
  ).replace(/"(\d+)":/g, "$1:")};
`;

  fs.writeFileSync(path.join(__dirname, "util1Gems.js"), gemsContent);
  console.log("gems.js file created successfully.");
}

async function CreateToken(
  metadata: {
    name: string;
    symbol: any;
    uri: string;
  },
  gemValue: number
) {
  const mintAccount = Keypair.generate();

  const [metadataAccount] = await PublicKey.findProgramAddress(
    [
      METADATA_SEED,
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintAccount.publicKey.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  await program.methods
    .createToken(metadata.name, metadata.symbol, metadata.uri)
    .accounts({
      payer: wallet.publicKey,
      mintAccount: mintAccount.publicKey,
      metadataAccount: metadataAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    })
    .signers([mintAccount])
    .rpc();

  console.log("Token créé avec les métadonnées:", metadata);
  console.log("Token créé à l'adresse:", mintAccount.publicKey.toBase58());
  console.log("Compte de métadonnées:", metadataAccount.toBase58());

  // Store addresses for gems.js
  gemAddresses[gemValue] = mintAccount.publicKey.toBase58();
  gemMetadataAccounts[gemValue] = metadataAccount.toBase58();
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
