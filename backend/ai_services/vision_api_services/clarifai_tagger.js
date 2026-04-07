import fs from 'fs';
import 'dotenv/config';

if (!process.env.CLARIFAI_PAT) {
    throw new Error("FATAL ERROR: CLARIFAI_PAT is not set in .env. Get it from https://clarifai.com/settings/security");
}

async function analyzeImageWithClarifai(imagePath) {
    try {
        console.log('🔍 Initializing Clarifai API client...');
        const startTime = Date.now();

        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found at path: ${imagePath}`);
        }

        // Read image file and convert to base64
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');

        console.log('🔄 Analyzing image:', imagePath);
        console.log('⏱️ Starting Clarifai API call at:', new Date().toISOString());

        // Make REST API request to Clarifai
        const response = await fetch('https://api.clarifai.com/v2/models/aaa03c23b3724a16a56b629203edc62c/outputs', {
            method: 'POST',
            headers: {
                'Authorization': `Key ${process.env.CLARIFAI_PAT}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_app_id: {
                    user_id: 'clarifai',
                    app_id: 'main'
                },
                inputs: [
                    {
                        data: {
                            image: {
                                base64: base64Image
                            }
                        }
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Clarifai API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const duration = Date.now() - startTime;
        console.log(`✅ Clarifai API call completed in ${duration}ms`);

        // Extract concepts (tags) from response
        if (data.outputs && data.outputs[0] && data.outputs[0].data && data.outputs[0].data.concepts) {
            const concepts = data.outputs[0].data.concepts;
            
            // Sort by score (relevance) and get top 6
            const topConcepts = concepts
                .sort((a, b) => (b.value || 0) - (a.value || 0))
                .slice(0, 6);
            
            console.log(`✅ Analysis complete. Found ${concepts.length} concepts. Using top 6.`);
            console.log('📊 Top concepts:', topConcepts.map(c => `${c.name}(${(c.value * 100).toFixed(1)}%)`).join(', '));

            // Convert to labels format similar to Google Vision
            const labels = topConcepts.map(concept => ({
                description: concept.name,
                score: concept.value
            }));

            return {
                labels: labels,
                safeSearch: {
                    adult: 'VERY_UNLIKELY',
                    violence: 'VERY_UNLIKELY',
                    medical: 'UNLIKELY',
                    spoof: 'UNLIKELY',
                    racy: 'UNLIKELY'
                },
                provider: 'clarifai'
            };
        } else {
            throw new Error('No concepts found in Clarifai response');
        }

    } catch (error) {
        console.error('❌ Clarifai API Error:', error.message);
        
        // Check for specific errors
        if (error.message && error.message.includes('authentication')) {
            console.error('❌ Authentication failed - check your CLARIFAI_PAT');
        }
        if (error.message && error.message.includes('401')) {
            console.error('❌ Invalid API Key - check your CLARIFAI_PAT in .env');
        }
        
        throw new Error(`Clarifai analysis failed: ${error.message}`);
    }
}

export { analyzeImageWithClarifai };
