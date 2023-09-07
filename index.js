const express = require("express");
const app = express();
const port = 4000;
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: "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",
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
    console.log(transcription.text);
    fs.unlinkSync(tempFilePath);

    // res.send(response.data);
  } catch (error) {
    console.log("Error:", error.message);
    // res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
