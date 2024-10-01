import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const privateKey = process.env.AUTHORITY_PRIVATE_KEY;
    if (privateKey) {
      res.status(200).json({
        privateKey,
      });
    } else {
      res.status(500).json({ error: "Private key not found" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
