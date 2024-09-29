// import * as anchor from '@coral-xyz/anchor';
// import { Program, web3 } from '@coral-xyz/anchor';
// import { getAssociatedTokenAddressSync } from '@solana/spl-token';
// import { clusterApiUrl, PublicKey, Connection, Keypair } from '@solana/web3.js';
// import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

// import bs58 from "bs58";
// import "dotenv/config";
// import { keypairPayer } from '@metaplex-foundation/umi';

// // Address of the deployed program.
// // const programId = new PublicKey('HAsE96RGMoeLahbUh8iQ7XF6NmGZyk5bbtoEkG4zE1F1');
// const programId = new PublicKey('9w1KrVJaq6G9ogtLCsiPjKSAC5Ag3DZsbSXkXgdYmsN3');
// const SEED_PROGRAM_ADMIN = "program_admin";
// const SEED_METADATA = "metadata";
// const SEED_EDITION = "edition";
// const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// let wallet: anchor.Wallet;
// let program: Program;
// let provider: anchor.AnchorProvider;

// async function main() {

//   const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
//   // const connection = new Connection("http://127.0.0.1:8899", "confirmed");

//   // Set Wallet that will be the admin of the program
//   const walletKP = Keypair.fromSecretKey(new Uint8Array(bs58.decode(process.env.PRIVATE_KEY)));
//   console.log(walletKP);
//   // wallet = new anchor.Wallet(walletKP);
//   wallet = new anchor.Wallet(Keypair.generate());
//   console.log("Wallet:", wallet.publicKey.toBase58());

//   const airdropSignature = await connection.requestAirdrop(
//     wallet.publicKey,
//     2 * anchor.web3.LAMPORTS_PER_SOL
//   );

//   await connection.confirmTransaction(airdropSignature);

//   // Set provider
//   provider = new anchor.AnchorProvider(connection, wallet, {
//     commitment: 'confirmed',
//   });
//   anchor.setProvider(provider);

//   // Load the program
//   const idl = JSON.parse(
//     require('fs').readFileSync('./target/idl/gemquest.json', 'utf8')
//   );
//   program = new Program(idl, provider);
//   console.log("Program ID:", program.programId.toBase58());



//   //await InitializeProgramAdmin();

//   // const metadataNFT_FreeSnack = {
//   //   name: 'Free Snack V4',
//   //   symbol: 'GQFS',
//   //   uri: 'ipfs://bafybeibb5rh62yfijm7ypoaphsz4rzvf7wlvjucicafu5v3eq2aur3rv3a/GQFS.json',
//   // };
//   // await CreateNFT(metadataNFT_FreeSnack);

//   // const metadataToken_GEM = {
//   //   name: 'Solana GEMS',
//   //   symbol: 'GEMS',
//   //   uri: 'ipfs://QmTNdfcWPYmYHrmDnWvXMyjDMYxApxGSGMA41LEYrz3uG9/gem_1.json',
//   // };
//   // await CreateToken(metadataToken_GEM);


//   // await MintTokensToUser();
// };

// /**
//  * Initialize the program admin
//  */
// async function InitializeProgramAdmin() {

//   const [programAdminAccount] = await anchor.web3.PublicKey.findProgramAddress(
//     [Buffer.from(SEED_PROGRAM_ADMIN)],
//     program.programId
//   );
//   // await program.rpc.initializeProgram({
//   //     accounts: {
//   //         payer: wallet.publicKey,
//   //         programAdmin: programAdminAccount,
//   //         systemProgram: anchor.web3.SystemProgram.programId,
//   //     },
//   //     signers: [wallet.payer],
//   // });

//   await program.methods.initializeProgram()
//     .accounts({
//       payer: wallet.publicKey,
//       programAdmin: programAdminAccount,
//       systemProgram: anchor.web3.SystemProgram.programId,

//     })
//     .signers([wallet.payer])
//     .rpc();
// }

// /**
//  * Create a new NFT with metadata
//  */
// async function CreateNFT(metadata) {

//   // Generate a new keypair for the mint
//   const mintAccount = new Keypair();

//   // Derive the associated token address account for the mint and payer.
//   const associatedNftTokenAccountAddress = getAssociatedTokenAddressSync(mintAccount.publicKey, wallet.publicKey);

//   const [metadataAccount] = await PublicKey.findProgramAddress(
//     [
//       Buffer.from(SEED_METADATA),
//       TOKEN_METADATA_PROGRAM_ID.toBuffer(),
//       mintAccount.publicKey.toBuffer(),
//     ],
//     TOKEN_METADATA_PROGRAM_ID
//   );

//   const [editionAccount] = await PublicKey.findProgramAddress(
//     [
//       Buffer.from(SEED_METADATA),
//       TOKEN_METADATA_PROGRAM_ID.toBuffer(),
//       mintAccount.publicKey.toBuffer(),
//       Buffer.from(SEED_EDITION),
//     ],
//     TOKEN_METADATA_PROGRAM_ID
//   );

//   await program.methods
//     .createNft(metadata.name, metadata.symbol, metadata.uri)
//     .accounts({
//       payer: wallet.publicKey,
//       associatedTokenAccount: associatedNftTokenAccountAddress,
//       mintAccount: mintAccount.publicKey,

//       metadataAccount: metadataAccount,
//       editionAccount: editionAccount,

//       tokenProgram: TOKEN_PROGRAM_ID,
//       tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
//       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//       systemProgram: web3.SystemProgram.programId,
//       rent: web3.SYSVAR_RENT_PUBKEY,
//     })
//     .signers([mintAccount])
//     .rpc();

//   console.log("NFTs created with metadata:", metadata);
//   console.log("NFT created at:", mintAccount.publicKey.toBase58());
//   console.log("Associated Token Account:", associatedNftTokenAccountAddress.toBase58());
//   console.log("Metadata Account:", metadataAccount.toBase58());
//   console.log("Edition Account:", editionAccount.toBase58());


//   // Create a transaction to initialize the user account
//   // await program.methods
//   //     .initializeUserAccount()
//   //     .accounts({
//   //         userAccount: userAccountPda,
//   //         admin: provider.wallet.publicKey, // Admin will pays for the transaction
//   //         user: userKeypair.publicKey,
//   //         systemProgram: anchor.web3.SystemProgram.programId,
//   //     })
//   //     .signers([walletKP])
//   //     .rpc();


//   // // Initialize the account.
//   // await program.rpc.initialize(new anchor.BN(0), {
//   //     accounts: {
//   //         baseAccount: baseAccount.publicKey,
//   //         user: provider.wallet.publicKey,
//   //         systemProgram: web3.SystemProgram.programId,
//   //     },
//   //     signers: [baseAccount],
//   // });
//   // console.log('Initialized account with data 0');

//   // // Update the account with a new value.
//   // await program.rpc.update(new anchor.BN(123), {
//   //     accounts: {
//   //         baseAccount: baseAccount.publicKey,
//   //     },
//   // });
//   // console.log('Updated account with data 123');

//   // // Get the current value stored in the account.
//   // const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
//   // console.log('Account data:', account.data.toString());
// }

// /*
// * Create a new token with metadata
// */
// async function CreateToken(metadata) {

//   // Generate a new keypair for the mint
//   const mintAccount = new Keypair();

//   const [metadataAccount] = await PublicKey.findProgramAddress(
//     [
//       Buffer.from(SEED_METADATA),
//       TOKEN_METADATA_PROGRAM_ID.toBuffer(),
//       mintAccount.publicKey.toBuffer(),
//     ],
//     TOKEN_METADATA_PROGRAM_ID
//   );


//   await program.methods
//     .createToken(metadata.name, metadata.symbol, metadata.uri)
//     .accounts({
//       payer: wallet.publicKey,
//       mintAccount: mintAccount.publicKey,

//       metadataAccount: metadataAccount,

//       tokenProgram: TOKEN_PROGRAM_ID,
//       tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
//       systemProgram: web3.SystemProgram.programId,
//       rent: web3.SYSVAR_RENT_PUBKEY,
//     })
//     .signers([mintAccount])
//     .rpc();

//   console.log("Token created with metadata:", metadata);
//   console.log("Token created at:", mintAccount.publicKey.toBase58());
//   console.log("Metadata Account:", metadataAccount.toBase58());
// }

// async function MintTokensToUser() {

//   const MINT_TOKEN_ACCOUNT = new PublicKey("BuLVCNeFRVfPvqj5ov9Vo4CNyWeRDwJa7Lj65bFQd117");
//   const USER_1 = new PublicKey("2PJvDq1EtUovedBc2xcc7FHyZP7AJeuru8D3bhmXm5cZ");

//   const associatedTokenAccountAddress = getAssociatedTokenAddressSync(MINT_TOKEN_ACCOUNT, USER_1);

//   // Amount of tokens to mint.
//   const amount = new anchor.BN(100);

//   // Mint the tokens to the associated token account.
//   const transactionSignature = await program.methods
//     .mintTokensToUser(amount)
//     .accounts({
//       mintAuthority: wallet.publicKey,
//       recipient: USER_1,
//       mintAccount: MINT_TOKEN_ACCOUNT,
//       associatedTokenAccount: associatedTokenAccountAddress,
//       tokenProgram: TOKEN_PROGRAM_ID,
//       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//       systemProgram: web3.SystemProgram.programId,
//     })
//     .rpc();

//   const postBalance = (
//     await provider.connection.getTokenAccountBalance(associatedTokenAccountAddress)
//   ).value.uiAmount;

//   console.log("New balance:", postBalance);
// }


// main().then(
//   () => process.exit(),
//   err => {
//     console.error(err);
//     process.exit(-1);
//   }
// );