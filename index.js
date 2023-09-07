const express = require("express");
const app = express();
const port = 4000;
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: "",
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/whisper", cors(), upload.single("audio-file"), async (req, res) => {
  try {
    const tempFilePath = `./temp_${Date.now()}.mp3`;
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1",
    });
    fs.unlinkSync(tempFilePath);

    res.send({
      transcription: transcription.text,
    });
  } catch (error) {
    console.log("Error:", error.message);
    // res.status(500).send("Internal Server Error");
  }
});

const strengths = [
  "The response draws on specific initiatives and attributes of JPMorgan Chase, showing that the candidate has done their homework. This demonstrates genuine interest and dedication.",
  "        By highlighting diversity, innovation, and professional growth, the answer aligns the candidate's personal values with those of the company, building common ground.",
  "           The response successfully intertwines personal aspirations with professional goals, portraying a holistic view of the candidate's motivations.",
];

const areasOfImprovement = [
  "The answer, while thorough, can be perceived as lengthy. A more concise response might be more impactful, especially in a time-constrained interview setting.",
  "While the answer touches on the broad tech initiatives, it doesn't delve into how the specific software engineer role fits into these initiatives or the candidate's expertise in relevant technologies.",
  "Incorporating past quantifiable achievements or experiences that align with the candidate's motivations to work for JPMorgan Chase could add more credibility to the response.",
];

app.post("/completions", cors(), async (req, res) => {
  console.log(req.body.transcript);
  res.send({
    strengths: strengths,
    improvements: areasOfImprovement,
  });
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
