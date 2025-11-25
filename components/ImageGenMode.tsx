import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ImagePlus, Download, Loader2, Wand2 } from 'lucide-react';

interface ImageGenModeProps {
  apiKey: string;
}

const ImageGenMode: React.FC<ImageGenModeProps> = ({ apiKey }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Using gemini-2.5-flash-image as per instructions for general image generation
      // This model uses generateContent with text prompt to produce image parts
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
      });

      // Iterate through parts to find the image
      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        setError("No image data found in response. The model might have refused the prompt.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 h-full max-w-4xl mx-auto">
      <div className="w-full space-y-4">
        <label className="block text-sm font-medium text-neutral-400 mb-1">
          Describe the image you want to create
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic city with flying cars at sunset, cyberpunk style..."
            className="flex-1 bg-neutral-900 border border-neutral-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
            Generate
          </button>
        </div>
      </div>

      <div className="flex-1 w-full flex items-center justify-center bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 text-purple-400">
            <Loader2 size={48} className="animate-spin" />
            <p className="animate-pulse">Dreaming up your image...</p>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center max-w-md">
            <p className="font-bold mb-2">Generation Failed</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        ) : generatedImage ? (
          <div className="relative group">
            <img 
              src={generatedImage} 
              alt="Generated" 
              className="max-h-[500px] w-auto rounded-lg shadow-2xl border border-neutral-700"
            />
            <a 
              href={generatedImage} 
              download={`gemini-gen-${Date.now()}.png`}
              className="absolute bottom-4 right-4 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Download size={24} />
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center text-neutral-600">
            <ImagePlus size={64} className="mb-4 opacity-50" />
            <p>Your imagination is the limit</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenMode;