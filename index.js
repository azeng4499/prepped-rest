require("dotenv").config();
const express = require("express");
const app = express();
const port = 4000;
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
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
      prompt:
        "You are transcribing the response to an interview question from an interviewee.",
    });
    console.log(transcription);
    fs.unlinkSync(tempFilePath);

    res.send({
      transcription: transcription.text,
    });
  } catch (error) {
    console.log("Error:", error.message);
    // res.status(500).send("Internal Server Error");
  }
});

app.post("/completions", cors(), upload.none(), async (req, res) => {
  console.log(req.body.transcript);

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are an AI designed to help users come up with optimal interview answers. Give 3 strengths and 3 areas of improvement of the interviewees response. Respond strictly in a stringified json.",
      },
      {
        role: "user",
        content:
          "I want to work at Google for several reasons. First and foremost, Google's commitment to innovation and its emphasis on creating products that have a genuine impact on billions of users globally resonates with me. I am keen on being part of an environment that not only encourages thinking big but also puts resources behind those ideas to turn them into reality.Secondly, Google's focus on fostering an open and inclusive culture is admirable. From what I've read and heard, the company ensures that employees from diverse backgrounds, be it cultural, educational, or experiential, feel welcomed and valued. Such diversity is essential for sparking novel ideas and perspectives, which is central to innovation.Additionally, Google's dedication to continuous learning and personal development stands out. The opportunity to collaborate with some of the best minds in the industry, combined with the myriad of internal resources available for upskilling, makes Google an ideal place for personal and professional growth.Lastly, Google's efforts in promoting ethical technology and digital well-being demonstrate a sense of responsibility that goes beyond just business metrics. I want to be part of an organization that is not only looking to shape the future but is also considerate about the societal and ethical implications of its actions.",
      },
    ],
    model: "gpt-3.5-turbo",
  });

  const response = completion.choices[0].message;

  console.log(response);
  // console.log(JSON.parse(response));

  res.send({
    strengths: [response.content],
    improvements: ["hey"],
  });
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

// const strengths = [
//   "The response draws on specific initiatives and attributes of JPMorgan Chase, showing that the candidate has done their homework. This demonstrates genuine interest and dedication.",
//   "        By highlighting diversity, innovation, and professional growth, the answer aligns the candidate's personal values with those of the company, building common ground.",
//   "           The response successfully intertwines personal aspirations with professional goals, portraying a holistic view of the candidate's motivations.",
// ];

// const areasOfImprovement = [
//   "The answer, while thorough, can be perceived as lengthy. A more concise response might be more impactful, especially in a time-constrained interview setting.",
//   "While the answer touches on the broad tech initiatives, it doesn't delve into how the specific software engineer role fits into these initiatives or the candidate's expertise in relevant technologies.",
//   "Incorporating past quantifiable achievements or experiences that align with the candidate's motivations to work for JPMorgan Chase could add more credibility to the response.",
// ];
