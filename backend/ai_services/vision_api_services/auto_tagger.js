// ⚠️ DEPRECATED: This file contains the old Google Cloud Vision API implementation
// The project now uses Clarifai for image tagging (see clarifai_tagger.js)
// Kept as backup/reference if needed in the future

// To use Google Vision instead of Clarifai, uncomment the code below and:
// 1. Enable billing on Google Cloud project
// 2. Set GOOGLE_APPLICATION_CREDENTIALS in .env
// 3. Update autoTagger.js route to import from here instead of clarifai_tagger.js

/*
import vision from '@google-cloud/vision';
import path from 'path';
import 'dotenv/config';

async function analyzeImage(imagePath) {
    try {
        const client = new vision.ImageAnnotatorClient(); 
        const [response] = await client.annotateImage({
            image: { source: { filename: imagePath } },
            features: [
                { type: 'LABEL_DETECTION', maxResults: 15 },
                { type: 'SAFE_SEARCH_DETECTION' }
            ]
        });
        return {
            labels: response.labelAnnotations || [],
            safeSearch: response.safeSearchAnnotation || {}
        };
    } catch (error) {
        throw new Error(`Google Vision analysis failed: ${error.message}`);
    }
}

export { analyzeImage };
*/