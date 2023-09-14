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
          "Given a response to the question \"Why do you want to work at Google?\", give 6 bullet points (3 strengths and 3 areas of improvement) based on the response. Strengths bullet points must describe what the candidate did well in answering the question. Areas of improvement bullet points must describe how the candidate could have answered the question better. Areas of improvement bullet points must incorporate data from the resume. All bullet point must begin with \"Your reponse...\" followed by either a strength or improvement. All bullet point must be more than 40 words but less than 80 words. Finally, give the response a rating from 1 to 5 based on how likely you would hire the candidate if you were the interviwer. 1 means that the response was completely off topic from the question. 5 means that the response was almost perfect aside from a few minor areas of improvement. Respond strictly in a stringified json in this format: {strengths: [...], areas_of_improvement: [...], rating: #} Resume: { Education: { School: University of Maryland, College Park, Major: Computer Science, Minor: Entrepreneurship, GPA: 3.82, Coursework,: [ Object Oriented Programming, Algorithms, Data Structures, Statistics, Discrete Math ] }, Work_Experience: { JPMorgan_Morgan_Chase_&_Co: { Role: Software Engineer Intern, Start: May 2023, End: Aug 2023, Description,: [ Joined the Finance Risk & Data Controls department working on tools that help the company generate quarterly reports, Consolidated 5+ internal reporting tools into a singular application allowing for a simplified user experience streamlined data analysis and data consistency, Enhanced a Spring Boot backend and SQL database to handle higher loads and new features, Introduced a modern and intuitive user interface employing best design principles to promote user engagement and satisfaction ] }, United_States_Department_of_Agriculture: { Role: Software Engineer Intern, Start: May 2022, End: May 2023, Description,: [ Aided the design and development of a dashboard where farmers participating in USDA research studies can read and write crop data, Added action modals and data tables to help increase the productivity of a user on the site, Leveraged Azure’s cloud database and cloud functions to deliver seamless interaction throughout the application, Consistently communicated with end-users to gather requirements understand their needs and provide updates ] } }, Notable_Projects: { GptGO_Chrome_Extension: { Description,: [ Created a Chrome extension that allows users to access ChatGPT from any webpage without having to switch tabs to the website, Integrated Chrome Developer APIs for native features such a displaying ChatGPT’s responses a notification and running process threads in the background, Used social media platforms to market the extension reaching over 4.75 million viewers, Accumulated over 50 thousand installs within the first 2 months of launch ], technologies_used,: [ React, Chrome Developer APIs ] }, Recover_Pals: { Description,: [ Lead a team in developing a full-stack application to help people who are recovering from a tragic experience match with mentors, Coordinated efforts between 2 developers to create the project in under 4 weeks, Utilized Redux and Firebase to handle data and authenticate over 100 users ], technologies_used,: [ React, Redux, Firebase, Style Components ] }, Rain_Shell: { Description,: [ Designed and built a SAAS that sends users a text every morning with a brief summary of the weather and suggestions on what to wear for the day, Called and parsed data from Open Weather Map’s API and created a framework in which a series of filters sifted through the raw data to identify noteworthy weather events, Set up application on AWS Lambda and used Cloudwatch and Twilio to allow users to pick the time at which they want to the receive message, Handled more than 15 cities and 65 users via a DynamoDB database and caching techniques ], technologies_used,: [ Java, AWS DynamoDB, Twilio ] } } } Response: I want to work at Google for several reasons. First and foremost, Google's commitment to innovation and its emphasis on creating products that have a genuine impact on billions of users globally resonates with me. I am keen on being part of an environment that not only encourages thinking big but also puts resources behind those ideas to turn them into reality.Secondly, Google's focus on fostering an open and inclusive culture is admirable. From what I've read and heard, the company ensures that employees from diverse backgrounds, be it cultural, educational, or experiential, feel welcomed and valued. Such diversity is essential for sparking novel ideas and perspectives, which is central to innovation.Additionally, Google's dedication to continuous learning and personal development stands out. The opportunity to collaborate with some of the best minds in the industry, combined with the myriad of internal resources available for upskilling, makes Google an ideal place for personal and professional growth.Lastly, Google's efforts in promoting ethical technology and digital well-being demonstrate a sense of responsibility that goes beyond just business metrics. I want to be part of an organization that is not only looking to shape the future but is also considerate about the societal and ethical implications of its actions.",
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
