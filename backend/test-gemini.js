const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Test Gemini API
async function testGemini() {
  try {
    console.log('Testing Gemini API...');
    console.log('API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');

    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment');
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });    const prompt = "Hello, this is a test message. Please respond with a simple greeting.";
    
    console.log('Sending test prompt...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini API working!');
    console.log('Response:', text);
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    console.error('Full error:', error);
  }
}

testGemini();
