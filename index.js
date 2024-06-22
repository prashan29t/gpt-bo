import express from 'express';
import OpenAI from 'openai';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

const apiKey = 'sk-proj-HB0Dygq9iGrvk07rUGu5T3BlbkFJ7VHwdZUaemxaU2MAphVL';

if (!apiKey) {
  console.error('Error: OPENAI_API_KEY is not set.');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: apiKey,
});

app.use(bodyParser.json());

app.post('/process-data', async (req, res) => {
  try {
    const inputData = req.body;
    console.log('Received input data:', inputData);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Please segregate Name, Title, Email search from google search engine, Person location, Person LinkedIn Link, Person LinkedIn User ID, Company Name, company website search from google search engine, company location search from google search engine, connections, followers, experience."
        },
        {
          role: "user",
          content: `give me important data from\n${JSON.stringify(inputData)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 512,
      top_p: 1,
    });

    console.log('OpenAI API response:', response);

    if (response && response.choices && response.choices.length > 0) {
      const extractedText = response.choices[0].message.content.trim();
      const extractedData = extractedText.split('\n').map(item => item.trim());

      const getValue = (key) => {
        const line = extractedData.find(item => item.toLowerCase().startsWith(key.toLowerCase()));
        return line ? line.split(': ')[1] : false;
      };

      const customArray = [
        `name: ${getValue('Name')}`,
        `title: ${getValue('Title')}`,
        `email: ${getValue('Email')}`,
        `person_location: ${getValue('Person Location')}`,
        `link: ${getValue('LinkedIn URL')}`,
        `username: ${getValue('Person LinkedIn User ID')}`,
        `company_name: ${getValue('Company Name')}`,
        `company_website: ${getValue('Company website')}`,
        `company_location: ${getValue('Company location')}`,
        `connections: ${getValue('Connections')}`,
        `followers: ${getValue('Followers')}`,
        `experience: ${getValue('Experience')}`
      ];

      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Generate a professional summary using the following details:"
          },
          {
            role: "user",
            content: `Details: ${JSON.stringify(customArray)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
        top_p: 1,
      });

      const summary = summaryResponse.choices[0]?.message?.content?.trim() || "Summary not available";

      customArray.push(`summary: ${summary}`);

      res.json({ data: customArray });
    } else {
      console.error('Unexpected response structure:', response);
      res.status(500).send('Internal Server Error');
    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
