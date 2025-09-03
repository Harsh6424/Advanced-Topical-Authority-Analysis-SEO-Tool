import React, { useState } from 'react';

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApiKeySubmit(apiKey);
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-2 text-white">Enter Your API Key</h2>
      <p className="text-gray-400 mb-6">
        Please enter your Google Gemini API key to proceed. Your key is used only for this session and is not stored.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="api-key" className="sr-only">
            Google Gemini API Key
          </label>
          <input
            type="password"
            id="api-key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API Key here"
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm p-3 focus:ring-cyan-500 focus:border-cyan-500"
            required
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
        >
          Start Analysis
        </button>
      </form>
       <p className="text-xs text-gray-500 mt-4">
        You can get a key from {' '}
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
          Google AI Studio
        </a>.
      </p>
    </div>
  );
};

export default ApiKeyInput;
