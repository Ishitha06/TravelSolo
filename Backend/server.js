import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate-itinerary", async (req, res) => {
  const { city, days, pace, budget, vibe, motivation, food } = req.body;

  try {

    // 🔥 Convert range into fixed number
    let numberOfDays;

    if (days === "1-2") numberOfDays = 2;
    else if (days === "3-5") numberOfDays = 5;
    else if (days === "6-10") numberOfDays = 10;
    else if (days === "10") numberOfDays = 10;
    else numberOfDays = 3;

    // Get coordinates from OpenTripMap
    const geoResponse = await axios.get(
      "https://api.opentripmap.com/0.1/en/places/geoname",
      {
        params: {
          name: city,
          apikey: process.env.OPENTRIPMAP_API_KEY
        }
      }
    );

    const { lat, lon } = geoResponse.data;

    // Get attractions
    const placesResponse = await axios.get(
      "https://api.opentripmap.com/0.1/en/places/radius",
      {
        params: {
          radius: 10000,
          lon,
          lat,
          rate: 2,
          format: "json",
          limit: 10,
          apikey: process.env.OPENTRIPMAP_API_KEY
        }
      }
    );

    const places = placesResponse.data
      .map(p => p.name)
      .filter(name => name)
      .join(", ");

    // 🔥 Stronger Prompt
    const prompt = `
Create a detailed ${numberOfDays}-day solo travel itinerary for ${city}.

User Profile:
- Pace: ${pace}
- Budget: ${budget}
- Vibe: ${vibe}
- Motivation: ${motivation}
- Food Preference: ${food}

Available attractions:
${places}

IMPORTANT:
You MUST generate exactly ${numberOfDays} days.
Do NOT stop early.

Format STRICTLY like this:

Title:
Personality:
Hotel:
Budget Breakdown:

Day 1:
Morning:
Afternoon:
Evening:

Day 2:
Morning:
Afternoon:
Evening:

Continue until Day ${numberOfDays}.
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5000",
          "X-Title": "TravelSoloApp"
        }
      }
    );

    const aiText = response.data.choices[0].message.content;

    res.json({ itinerary: aiText });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate itinerary" });
  }
});

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});