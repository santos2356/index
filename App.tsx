import React, { useState } from 'react';
import { MessageSquare, Image, Mic, Sparkles, LayoutGrid } from 'lucide-react';
import { Tab } from './types';
import ChatMode from './components/ChatMode';
import VisionMode from './components/VisionMode';
import ImageGenMode from './components/ImageGenMode';
import LiveMode from './components/LiveMode';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  
  // In a real app, you might want to handle this differently, but per instructions,
  // we assume process.env.API_KEY is available.
  const apiKey = process.env.API_KEY || '';

  const renderContent = () => {
    if (!apiKey) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-400">
            <p className="text-xl font-bold">API Key Missing</p>
            <p className="text-sm opacity-80">Ensure process.env.API_KEY is set.</p>
        </div>
      );
    }

    switch (activeTab) {
      case Tab.CHAT:
        return <ChatMode apiKey={apiKey} />;
      case Tab.VISION:
        return <VisionMode apiKey={apiKey} />;
      case Tab.IMAGE_GEN:
        return <ImageGenMode apiKey={apiKey} />;
      case Tab.LIVE:
        return <LiveMode apiKey={apiKey} />;
      default:
        return <ChatMode apiKey={apiKey} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-200 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
            <LayoutGrid size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Gemini Creative Studio</h1>
        </div>
        <div className="text-xs text-neutral-500 font-mono hidden md:block">
           Using gemini-2.5-flash series
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
            {/* Tabs */}
            <nav className="flex items-center gap-2 mb-6 p-1 bg-neutral-900/50 rounded-xl border border-neutral-800 w-fit mx-auto md:mx-0">
                <button
                    onClick={() => setActiveTab(Tab.CHAT)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${activeTab === Tab.CHAT ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                >
                    <MessageSquare size={16} />
                    Chat
                </button>
                <button
                    onClick={() => setActiveTab(Tab.VISION)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${activeTab === Tab.VISION ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                >
                    <Sparkles size={16} />
                    Vision
                </button>
                <button
                    onClick={() => setActiveTab(Tab.IMAGE_GEN)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${activeTab === Tab.IMAGE_GEN ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                >
                    <Image size={16} />
                    Generate
                </button>
                 <button
                    onClick={() => setActiveTab(Tab.LIVE)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${activeTab === Tab.LIVE ? 'bg-red-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                >
                    <Mic size={16} />
                    Live
                </button>
            </nav>
            
            {/* Dynamic Content */}
            <div className="flex-1 overflow-hidden min-h-0">
                {renderContent()}
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;