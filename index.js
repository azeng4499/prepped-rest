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
  console.log("start");
  console.log(req.body.transcript);

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are an AI designed to help users come up with optimal responses to interview questions.",
      },
      {
        role: "user",
        content:
          "Given a response to the question \"Why do you want to work at Google?\",  you must write 2 paragraphs. First, write a paragraph about the strengths of the response. The Strengths paragraph must describe what the candidate did well in answering the question. Then, you must also write a paragraph about areas of improvement. The Areas of improvement paragraph must describe how the candidate could have answered the question better. Both paragraphs must be more than 150 words long. DO NOT LEAVE EITHER PARAGRAPH BLANK. Finally, give the response a rating from 1 to 5 based on how likely you would hire the candidate if you were the interviwer. 1 means that the response was completely off topic from the question. 5 means that the response was almost perfect aside from a few minor areas of improvement. Respond strictly in a stringified JSON in this format: {strengths: “”, areas_of_improvement: “”, rating: #} Response: I want to work at Google for several reasons. First and foremost, Google's commitment to innovation and its emphasis on creating products that have a genuine impact on billions of users globally resonates with me. I am keen on being part of an environment that not only encourages thinking big but also puts resources behind those ideas to turn them into reality.Secondly, Google's focus on fostering an open and inclusive culture is admirable. From what I've read and heard, the company ensures that employees from diverse backgrounds, be it cultural, educational, or experiential, feel welcomed and valued. Such diversity is essential for sparking novel ideas and perspectives, which is central to innovation.Additionally, Google's dedication to continuous learning and personal development stands out. The opportunity to collaborate with some of the best minds in the industry, combined with the myriad of internal resources available for upskilling, makes Google an ideal place for personal and professional growth.Lastly, Google's efforts in promoting ethical technology and digital well-being demonstrate a sense of responsibility that goes beyond just business metrics. I want to be part of an organization that is not only looking to shape the future but is also considerate about the societal and ethical implications of its actions.",
      },
    ],
    model: "gpt-3.5-turbo",
  });

  const response = completion.choices[0].message;
  const responseJSON = JSON.parse(response.content);

  console.log(responseJSON);

  res.send({
    strengths: responseJSON.strengths,
    improvements: responseJSON.areas_of_improvement,
    rating: parseInt(responseJSON.rating),
  });
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
