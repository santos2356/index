import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
// Fix: Import Bot from lucide-react
import { Upload, Image as ImageIcon, Loader2, Sparkles, X, Bot } from 'lucide-react';
import { fileToBase64 } from '../utils/audio';

interface VisionModeProps {
  apiKey: string;
}

const VisionMode: React.FC<VisionModeProps> = ({ apiKey }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mimeType, setMimeType] = useState('image/png');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type);
      const base64 = await fileToBase64(file);
      setSelectedImage(base64);
      setResult('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage || !apiKey) return;

    setIsLoading(true);
    setResult('');

    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = 'gemini-2.5-flash';

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                data: selectedImage,
                mimeType: mimeType,
              },
            },
            {
              text: prompt || "Describe this image in detail.",
            },
          ],
        },
      });

      setResult(response.text || 'No response text.');
    } catch (error: any) {
      console.error(error);
      setResult(`Error: ${error.message || 'Something went wrong'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setResult('');
    setPrompt('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      {/* Left Panel: Input */}
      <div className="flex flex-col gap-4">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px] relative">
          {!selectedImage ? (
            <>
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="text-neutral-400" size={32} />
              </div>
              <p className="text-neutral-400 mb-4 text-center">Upload an image to analyze</p>
              <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2">
                <Upload size={18} />
                <span>Select Image</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={`data:${mimeType};base64,${selectedImage}`} 
                alt="Preview" 
                className="max-h-[300px] max-w-full rounded-lg shadow-lg object-contain"
              />
              <button 
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ask something about the image (optional)..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={!selectedImage || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            <span>Analyze</span>
          </button>
        </div>
      </div>

      {/* Right Panel: Result */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 overflow-y-auto max-h-[600px]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bot size={20} className="text-emerald-500" />
          Analysis Result
        </h3>
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
            <div className="h-4 bg-neutral-800 rounded w-5/6"></div>
          </div>
        ) : result ? (
          <div className="prose prose-invert prose-sm max-w-none text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {result}
          </div>
        ) : (
          <p className="text-neutral-500 italic">Upload an image and click Analyze to see the magic happen.</p>
        )}
      </div>
    </div>
  );
};

export default VisionMode;