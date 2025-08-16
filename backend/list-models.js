require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        console.log('Listing available Gemini models...');
        console.log('API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // List all models
        const models = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Try with a known working model first
        console.log('✅ API connection successful with gemini-1.5-flash');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('Full error:', error);
    }
}

listModels();
