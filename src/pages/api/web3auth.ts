// pages/api/web3auth.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Web3Auth API called");
  const clientId = process.env.WEB3AUTH_CLIENT_ID;

  // console.log("Web3Auth client ID:", clientId);
  if (!clientId) {
    return res
      .status(500)
      .json({ error: "WEB3AUTH_CLIENT_ID not set in environment variables" });
  }

  res.status(200).json({ clientId });
}
