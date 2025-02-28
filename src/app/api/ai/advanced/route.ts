import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Validate environment variables
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const isEnabled = process.env.NEXT_PUBLIC_AI_FEATURES_ENABLED === 'true';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(apiKey as string);

export async function POST(request: NextRequest) {
  try {
    // Verify that AI features are enabled
    if (!isEnabled) {
      return NextResponse.json({ error: 'AI features are disabled' }, { status: 403 });
    }

    // Check API key
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { prompt, action, model, responseFormat } = body;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    // Default model is pro for these advanced features
    const modelToUse = model || 'gemini-2.0-pro';
    
    // Initialize the model
    const geminiModel = genAI.getGenerativeModel({ model: modelToUse });

    // Configure generation
    const generationConfig = {
      temperature: 0.1, // Low temperature for more deterministic responses
      topK: 16,
      topP: 0.9,
    };

    // Execute the generation
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    const generatedText = response.text();

    // Handle JSON response format
    if (responseFormat === 'json') {
      try {
        // Parse the response as JSON
        const jsonResponse = JSON.parse(generatedText);
        return NextResponse.json(jsonResponse);
      } catch (error) {
        console.error('Failed to parse AI response as JSON:', error);
        
        // Attempt to extract JSON from the text response
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[0]);
            return NextResponse.json(extractedJson);
          } catch (e) {
            // If extraction also fails, return error
            return NextResponse.json({ 
              error: 'Failed to parse AI response as JSON', 
              text: generatedText 
            }, { status: 500 });
          }
        }
        
        return NextResponse.json({ 
          error: 'Invalid JSON in AI response', 
          text: generatedText 
        }, { status: 500 });
      }
    }

    // Return text response
    return NextResponse.json({ text: generatedText });
  } catch (error: any) {
    console.error('AI Advanced API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
} 