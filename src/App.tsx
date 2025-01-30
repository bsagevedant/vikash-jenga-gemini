import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiKeyRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const fileToGenerativePart = async (file: string) => {
    // Remove the data URL prefix and convert base64 to Uint8Array
    const base64String = file.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    const binaryString = window.atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return {
      inlineData: {
        data: base64String,
        mimeType: 'image/jpeg'
      },
    };
  };

  const analyzeStructure = async () => {
    const apiKey = apiKeyRef.current?.value;
    
    if (!apiKey) {
      setError("Please enter your Gemini API key");
      return;
    }

    if (!image) {
      setError("Please upload an image first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

      const imagePart = await fileToGenerativePart(image);
      
      const prompt = "Analyze this Jenga tower structure. Is it stable or unstable? Explain why in detail, considering the placement of blocks, balance points, and potential weak spots.";

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      setAnalysis(response.text());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jenga Structure Analyzer</h1>
          <p className="text-gray-600">Upload a photo of your Jenga structure to analyze its stability</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key
            </label>
            <input
              ref={apiKeyRef}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Gemini API key"
            />
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              {image ? (
                <div className="space-y-4">
                  <img
                    src={image}
                    alt="Uploaded Jenga structure"
                    className="max-h-64 mx-auto"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Change image
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload image</span>
                </button>
              )}
            </div>

            <button
              onClick={analyzeStructure}
              disabled={loading || !image}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                loading || !image
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Analyzing...' : 'Analyze Structure'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {analysis && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-1" />
              <div className="text-green-700 whitespace-pre-wrap">{analysis}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;