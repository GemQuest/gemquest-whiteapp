export const sciFiThemes = [
  "Star Trek",
  "Stargate",
  "Battlestar Galactica",
  "Star Wars",
  "The Expanse",
  "Doctor Who",
  "Babylon 5",
  "Farscape",
  "Firefly",
  "Dune",
  "Blade Runner",
  "The Matrix",
  "Terminator",
  "Alien",
  "Predator",
  "X-Files",
  "Black Mirror",
  "Westworld",
];

export const generateQuizPrompt = (theme, difficulty) => `
Generate an ${difficulty} level quiz on the theme "${theme}" with the following structure. Make sure that the expert level questions are extremely difficult and challenging, requiring deep knowledge of the subject:
{
  provider: "OpenAI",
  topic: "${theme} Quiz with an ${difficulty} difficulty powered by OpenAI",
  quizz: {
    ensign: [
      {
        id: 0,
        question: "Question 1?",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        answer: "Randomly select one of the options"
      },
      {
        id: 1,
        question: "Question 2?",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        answer: "Randomly select one of the options"
      },
      {
        id: 2,
        question: "Question 3?",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        answer: "Randomly select one of the options"
      }
    ],
    captain: [
      {
        id: 0,
        question: "Question 1?",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        answer: "Randomly select one of the options"
      },
      {
        id: 1,
        question: "Question 2?",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        answer: "Randomly select one of the options"
      },
      {
        id: 2,
        question: "Question 3?",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        answer: "Randomly select one of the options"
      }
    ],
    admiral: [
      {
        id: 0,
        question: "Question 1?",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        answer: "Randomly select one of the options"
      },
      {
        id: 1,
        question: "Question 2?",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        answer: "Randomly select one of the options"
      },
      {
        id: 2,
        question: "Question 3?",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        answer: "Randomly select one of the options"
      }
    ]
  }
}`;

export const messageToSign = `
By signing this message, you acknowledge and agree to the following:
You can earn Gems by participating in quizzes while waiting in lines at the amusement park. These Gems can be exchanged for reward NFTs.
Reward NFTs offer perks like Skip the Line passes, VIP access, free drinks, snacks, and exclusive merchandise.
You can purchase entry tickets and other items on the GemQuest Marketplace.
Legal Disclaimer:
The developers of GemQuest are not responsible for any losses incurred during the use of the platform.
All transactions are final and non-refundable.
Ensure the security of your wallet and private keys; the developers are not liable for any unauthorized access.
By signing below, you accept and understand these terms.`;

export const ipfsGateway =
  "https://fuchsia-varying-camel-696.mypinata.cloud/ipfs/";

export const ticketMetadata = {
  uri: "ipfs://QmeqjN9FsMiabCagjWftcuzAaxMiXFgV55Sre23EeF3wcY",
};

export const receiptMetadata = {
  name: "GemQuest Exchange Receipt",
  symbol: "GQRCPT",
  description: "Proof of redemption for a GemQuest NFT",
  image: "ipfs://QmcPnb7D88e2GGhwZF1EmNn6r5ZdLE3L4mrVMwLmbDVxD7",
  attributes: [
    {
      trait_type: "Redeemed NFT",
      value: "{REDEEMED_NFT_SYMBOL}",
    },
    {
      trait_type: "Redemption Date",
      value: "{REDEMPTION_DATE}",
    },
    {
      trait_type: "Merchant",
      value: "GemQuest",
    },
  ],
  properties: {
    creators: [
      {
        address: "8LZsnHCQLu7JtyoTGexrwoNJMkAF8qkHVDeo9AFD4JrV",
      },
    ],
    redeemed_nft_name: "{REDEEMED_NFT_NAME}",
    redeemed_gem_cost: "{REDEEMED_GEM_COST}",
  },
};

export const qrCodeValidity = 2 * 60 * 1000; // 2 minutes

export const gemTypes = [
  { type: "gem20", value: 20 },
  { type: "gem10", value: 10 },
  { type: "gem5", value: 5 },
  { type: "gem1", value: 1 },
];

/////////////////////////////////// TO UPDATE AFTER EACH DEPLOY AFTER THIS LINE ///////////////////////////////////

export const ticketsCollectionMint =
  "J5H3aBdiEoPCvRQd5D8CPvVXnh5BXd2YKa1K1obszSzf";

export const receiptsCollectionMint =
  "HZ7Y4EPaS3rR1hxBYz1JwV2oF49SQqgqMu1uAduDJRTq";

export const gemAddresses = {
  1: "6bXaRZSMLfY8eMzMJZXFcZnSuC7e6SZa6bxdbPhVQd3Z",
  5: "BBCfSyLoxThPzLTfJfNHxX2cgjE7G3ejPtQ9kmukFDNg",
  10: "8fH76uzdnhn7Je8TJNUkRRp4NTwwrLMwi1krMuzRz3ZT",
  20: "7USZjECPwWV6gNHcZnhKmyQyLmakR7XZ4hdE2sKMWcgd",
};

export const gemMetadataAccounts = {
  1: "uUxnzeSS9NJUE6VA17QC4kP2RzHTmNJhTcRhpUhTY9z",
  5: "EcxjFob6poSwbnhxEHQgDMqXPjwaL2P1PPiNzdVdg3nx",
  10: "F6gt5b8uEcjz99SNS6e4vSMsmP9ZTfThJ5YMfUsrjxMb",
  20: "FvkVudtXYVVBZq3qi25qiHDc1BiTYU3aRQbGUD3Qe9fZ",
};

export const nftMetadata = [
  {
    name: "Exclusive Event Access",
    symbol: "GQEEA",
    address: "CkUCAQSBW4PBveoKnQnGL7hU9gPBQEEE6HrTekATE9xW",
    metadataAccount: "CZbKBkgKJ9D5fZdT2KpHCzbftHkFbF3NfwvpUb6xR62b",
    uri: "ipfs://QmQd5AC6BMf7RLZQubVZ7kqkFLeffPWwhsERLVj2wXMbEX/GQEEA.json",
    uriReceipt:
      "ipfs://QmZ8v7JT5nXAj1JHDEgY9ojgSEBsiYYk6dd5y4iihUV1sp/GQEEAR.json",
  },
  {
    name: "Free Drink",
    symbol: "GQFD",
    address: "29WxGQMy4iToS5pjRX2kdYacN4gBAwknv41LsjkvrHVN",
    metadataAccount: "DnUDLciMfTiesonLHpYCgeWVGMMp4m1AhvyhWcNQ99sP",
    uri: "ipfs://QmQd5AC6BMf7RLZQubVZ7kqkFLeffPWwhsERLVj2wXMbEX/GQFD.json",
    uriReceipt:
      "ipfs://QmZ8v7JT5nXAj1JHDEgY9ojgSEBsiYYk6dd5y4iihUV1sp/GQFDR.json",
  },
  {
    name: "Free Snack",
    symbol: "GQFS",
    address: "9KhXoiuwBECL1Zxmyw9Xx61V1qRZCxVgkkZtDBrcWDvo",
    metadataAccount: "3GiKeD9ULfu6LcycYhfZ4DPYGDCxV7ZFa4Bh68yEtQQE",
    uri: "ipfs://QmQd5AC6BMf7RLZQubVZ7kqkFLeffPWwhsERLVj2wXMbEX/GQFS.json",
    uriReceipt:
      "ipfs://QmZ8v7JT5nXAj1JHDEgY9ojgSEBsiYYk6dd5y4iihUV1sp/GQFSR.json",
  },
  {
    name: "Gift Cap",
    symbol: "GQGC",
    address: "649NYs2fHYu5V3baWr6vJGy8NqghFSAgCHkCCAzsuby4",
    metadataAccount: "6DAGfog4U5pMY6DfQQasUqLNCshCWopqaoTUGWvHiEmv",
    uri: "ipfs://QmQd5AC6BMf7RLZQubVZ7kqkFLeffPWwhsERLVj2wXMbEX/GQGC.json",
    uriReceipt:
      "ipfs://QmZ8v7JT5nXAj1JHDEgY9ojgSEBsiYYk6dd5y4iihUV1sp/GQGCR.json",
  },
  {
    name: "Gift Photo",
    symbol: "GQGP",
    address: "EAxyMKRTVq8zGyLwh6nSRHNvt91mVjXkVZ2RaSNkXVag",
    metadataAccount: "AsxMvp3b7uYXRVEgNzCBug2Fjonqa4putVbNxi2Bxaz9",
    uri: "ipfs://QmQd5AC6BMf7RLZQubVZ7kqkFLeffPWwhsERLVj2wXMbEX/GQGP.json",
    uriReceipt:
      "ipfs://QmZ8v7JT5nXAj1JHDEgY9ojgSEBsiYYk6dd5y4iihUV1sp/GQGPR.json",
  },
  {
    name: "Gift Shop",
    symbol: "GQGS",
    address: "AqHcvkidPwopJWApqT2oAqTKcJfnR9YzPTF7VWWF1rFb",
    metadataAccount: "EhdGYxSBTXjrfwmCNqMCFXwDJoTkdW1pXLCKktyVcdX4",
    uri: "ipfs://QmQd5AC6BMf7RLZQubVZ7kqkFLeffPWwhsERLVj2wXMbEX/GQGS.json",
    uriReceipt:
      "ipfs://QmZ8v7JT5nXAj1JHDEgY9ojgSEBsiYYk6dd5y4iihUV1sp/GQGSR.json",
  },
  {
    name: "Skip the Line",
    symbol: "GQSKL",
    address: "HrVPcGc5MvK9rKP16sAsszqwwwecm9CCLHrTVJKqctom",
    metadataAccount: "9oC7S11UM9wfoAUK4jm2TfndQAEkHaKGqFdGxFjHy5rg",
    uri: "ipfs://QmQd5AC6BMf7RLZQubVZ7kqkFLeffPWwhsERLVj2wXMbEX/GQSKL.json",
    uriReceipt:
      "ipfs://QmZ8v7JT5nXAj1JHDEgY9ojgSEBsiYYk6dd5y4iihUV1sp/GQSKLR.json",
  },
  {
    name: "Gift T-shirt",
    symbol: "GQTS",
    address: "HtprGRbDXVShfKZpeGRb3UUeATgVTWX5t4XLMYEncKQj",
    metadataAccount: "HR9Nm7sFmJNFde7dg7dEHmrarV8tnWXsrJtafQZYdq7v",
    uri: "ipfs://QmQd5AC6BMf7RLZQubVZ7kqkFLeffPWwhsERLVj2wXMbEX/GQTS.json",
    uriReceipt:
      "ipfs://QmZ8v7JT5nXAj1JHDEgY9ojgSEBsiYYk6dd5y4iihUV1sp/GQTSR.json",
  },
  {
    name: "VIP Access",
    symbol: "GQVIP",
    address: "8Y7kc2cKTXu5YGM9pEA7J4tTRdNxZLwQZoLRnMinxRup",
    metadataAccount: "2AtNzH1XE5FzArCTJ19dmbbepoD16zG5Aq4Qp4WB2ZAJ",
    uri: "ipfs://QmQd5AC6BMf7RLZQubVZ7kqkFLeffPWwhsERLVj2wXMbEX/GQVIP.json",
    uriReceipt:
      "ipfs://QmZ8v7JT5nXAj1JHDEgY9ojgSEBsiYYk6dd5y4iihUV1sp/GQVIPR.json",
  },
];
