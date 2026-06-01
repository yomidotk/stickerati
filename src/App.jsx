import React, { useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import StickerCanvas from './components/StickerCanvas';
import LoadingPage from './components/LoadingPage';
import { exportToPDF } from './utils/pdfExport';

function App() {
  const [showLoading, setShowLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stickers, setStickers] = useState([]);
  const [sheetColor, setSheetColor] = useState('#fef08a');
  const stageRef = useRef(null);

  const handleStickerProcessed = (sticker) => {
    setStickers((prev) => [...prev, sticker]);
  };

  const handleExport = async () => {
    if (stageRef.current) {
      // Deselect all items to remove resize boxes
      stageRef.current.deselectAll();
      
      // Wait for React to re-render without the Transformer
      setTimeout(async () => {
        // Get data URL from Konva stage
        // We use pixelRatio 2 to ensure the PDF looks crisp when printed
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
        await exportToPDF(dataUrl);
      }, 50);
    }
  };

  if (showLoading) {
    return <LoadingPage onComplete={() => setShowLoading(false)} />;
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-grid-pattern font-sans relative">
      <Sidebar 
        onStickerProcessed={handleStickerProcessed} 
        onExport={handleExport} 
        sheetColor={sheetColor}
        setSheetColor={setSheetColor}
        stickerCount={stickers.length}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <StickerCanvas 
        ref={stageRef}
        stickers={stickers}
        setStickers={setStickers}
        sheetColor={sheetColor}
      />
    </div>
  );
}

export default App;
