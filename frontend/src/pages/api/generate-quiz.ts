// pages/api/generate-quiz.ts
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { generateQuizPrompt } from "../../utils";

function cleanJSONString(str: string) {
  return str
    .replace(/```json/g, "") // Remove ```json if present
    .replace(/```/g, "") // Remove closing ```
    .replace(/\\n/g, "") // Remove new lines
    .replace(/\\/g, ""); // Remove backslashes
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { theme, difficulty } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;
  const testPrompt = {
    provider: "OpenAI",
    topic: "Stargate Quiz with an intermediate difficulty powered by OpenAI",
    quizz: {
      ensign: [
        {
          id: 0,
          question:
            "What is the name of the alien race that built the Stargates?",
          options: ["Asgard", "Goa'uld", "Ancients", "Wraith"],
          answer: "Ancients",
        },
        {
          id: 1,
          question: "Which character is known as 'the first prime of Apophis'?",
          options: ["Bra'tac", "Teal'c", "Heru'ur", "Daniel Jackson"],
          answer: "Teal'c",
        },
        {
          id: 2,
          question:
            "What is the home planet of the Goa'uld System Lord Anubis?",
          options: ["Abydos", "Dakara", "Chulak", "Delmak"],
          answer: "Delmak",
        },
      ],
      captain: [
        {
          id: 0,
          question:
            "Which alien race is known for their advanced technology and served as protectors of humanity?",
          options: ["Nox", "Asgard", "Tok'ra", "Replicators"],
          answer: "Asgard",
        },
        {
          id: 1,
          question:
            "What is the name of the city-ship that serves as the base of operations in 'Stargate Atlantis'?",
          options: ["Atlantis", "Prometheus", "Daedalus", "Destiny"],
          answer: "Atlantis",
        },
        {
          id: 2,
          question:
            "Which device allows users to travel through the Stargate network?",
          options: ["ZPM", "DHD", "Naquadah generator", "Puddle Jumper"],
          answer: "DHD",
        },
      ],
      admiral: [
        {
          id: 0,
          question:
            "What is the name of the ancient device that can control and destroy the Replicators?",
          options: [
            "Dakara Superweapon",
            "Antarctic Weapon",
            "Attero Device",
            "Sangraal",
          ],
          answer: "Dakara Superweapon",
        },
        {
          id: 1,
          question:
            "Which System Lord used a Harcesis child to gain the genetic memory of the Goa'uld?",
          options: ["Apophis", "Anubis", "Heru'ur", "Osiris"],
          answer: "Apophis",
        },
        {
          id: 2,
          question:
            "What is the name of the Asgard scientist who assisted SG-1 with various technological challenges?",
          options: ["Loki", "Thor", "Heimdall", "Freyr"],
          answer: "Thor",
        },
      ],
    },
  };

  // if (!apiKey) {
  //   return res
  //     .status(500)
  //     .json({ error: "OPENAI_API_KEY not set in environment variables" });
  // }

  try {
    //  const openai = new OpenAI({
    //    apiKey,
    //    dangerouslyAllowBrowser: false,
    //  });
    // console.log("prompting:", theme, difficulty);
    //  const prompt = generateQuizPrompt(theme, difficulty);

    //  const aiResponse = await openai.chat.completions.create({
    //    model: "gpt-4o",
    //    messages: [
    //     {
    //        role: "system",
    //       content: "You are a quiz generator. Respond with a JSON object only.",
    //      },
    //      {
    //        role: "user",
    //        content: prompt,
    //      },
    //    ],
    //    max_tokens: 1500,
    //    temperature: 0.7,
    //  });

    //  const messageContent = aiResponse?.choices[0]?.message?.content?.trim();
    //  console.log("OpenAI gave a response");
    //  if (!messageContent) {
    //    return res.status(500).json({ error: "Failed to generate quiz" });
    //  }
    // Clean the message content before parsing
    //  const cleanedContent = cleanJSONString(messageContent);
    //  console.log("Cleaned content");

    const cleanedContent = cleanJSONString(JSON.stringify(testPrompt));
    // console.log("Cleaned content");
    let quiz;
    try {
      quiz = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return res.status(500).json({ error: "Failed to parse quiz data" });
    }

    res.status(200).json({ quiz });
  } catch (error) {
    console.error("Error generating quiz:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
}
