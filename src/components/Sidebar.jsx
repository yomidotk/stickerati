import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { removeBackground, addWhiteBorder } from '../utils/imageUtils';
import { Upload, Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const COLORS = ['#ffffff', '#fef08a', '#ffedd5', '#dcfce7', '#e2e8f0']; // White, Yellow Notepad, Kraft, Mint, Slate

export default function Sidebar({ onStickerProcessed, onExport, sheetColor, setSheetColor, stickerCount, isOpen, onToggle }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setIsProcessing(true);
    try {
      const cols = 3;
      const colWidth = 794 / cols;
      const rowHeight = 280; // approximate height per row

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const url = await removeBackground(file);
        const borderUrl = await addWhiteBorder(url, 20); // 20px thick border
        
        // Determine natural dimensions to avoid stretching
        const img = new window.Image();
        img.src = url;
        await new Promise(r => img.onload = r);
        
        // Uniform size of exactly 200px on the longest side for consistency
        const maxDim = 200; 
        const scale = maxDim / Math.max(img.width, img.height);
        const width = img.width * scale;
        const height = img.height * scale;

        // Grid-based placement using total sticker count to prevent overlapping across separate drops
        const globalIndex = stickerCount + i;
        const col = globalIndex % cols;
        const row = Math.floor(globalIndex / cols);
        
        // Calculate exact base position (perfectly centered in the grid cell)
        let x = (col * colWidth) + (colWidth / 2) - (width / 2);
        let y = (row * rowHeight) + (rowHeight / 2) - (height / 2);
        
        // Keep within canvas bounds just in case
        x = Math.max(20, Math.min(x, 794 - width - 20));
        y = Math.max(20, Math.min(y, 1123 - height - 20));

        onStickerProcessed({
          id: Date.now().toString() + i,
          url,
          borderUrl,
          x,
          y,
          width,
          height,
          rotation: 0,
          border: 1
        });
      }
    } catch (error) {
      alert("Failed to process one or more images. Make sure they are valid images.");
    } finally {
      setIsProcessing(false);
    }
  }, [onStickerProcessed, stickerCount]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true
  });

  return (
    <>
      <div className={`h-screen bg-[#f8fafc] flex flex-col items-center justify-between flex-shrink-0 z-10 relative transition-all duration-300 ${isOpen ? 'w-80 p-8 border-r border-black' : 'w-0 p-0 border-none overflow-hidden'}`}>
        <div className="w-full flex flex-col items-center relative z-10 min-w-[250px]">
          <h1 className="text-4xl font-black italic text-black mb-8 w-full text-center tracking-tighter flex flex-col items-center gap-1 font-helvetica-condensed mt-4 pr-1">
            STICKERATI
          </h1>

          <div 
            {...getRootProps()} 
            className={`w-full p-8 border border-dashed cursor-pointer transition-all duration-300 ease-out flex flex-col items-center justify-center text-center bg-white min-h-[250px]
              ${isDragActive ? 'border-black bg-blue-50 scale-105' : 'border-black hover:bg-neutral-50'}
              ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input {...getInputProps()} />
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-black animate-spin mb-4" strokeWidth={1.5} />
                <p className="font-computer text-xs font-bold uppercase tracking-wider text-black">Processing...</p>
              </div>
            ) : (
              <>
                <Upload className={`w-12 h-12 mb-4 transition-colors duration-300 stroke-[1.5px] text-black`} />
                <p className="font-computer text-xs font-bold text-black uppercase tracking-wider leading-relaxed">
                  {isDragActive ? "Release to begin" : "Drop images here, or click to browse"}
                </p>
              </>
            )}
          </div>
          <p className="text-[10px] text-center mt-6 text-black font-computer font-bold tracking-widest uppercase">
            100% Local Processing
          </p>
        </div>

        <div className="w-full pb-4 relative z-10 flex flex-col gap-8 min-w-[250px]">
          <div className="flex flex-col gap-3">
            <p className="text-xs text-black font-computer font-bold tracking-widest uppercase mb-1">Sheet Canvas Color</p>
            <div className="flex gap-3 justify-between">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSheetColor(c)}
                  className={`w-8 h-8 border border-black transition-all duration-200 ${sheetColor === c ? 'scale-110 shadow-md bg-white' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <button
            onClick={onExport}
            className="w-full bg-[#e5e5e5] hover:bg-[#d4d4d4] text-black border border-black font-computer font-bold py-4 px-6 active:scale-[0.98] transition-all duration-200 uppercase tracking-widest flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" strokeWidth={1.5} />
            Export Canvas
          </button>
        </div>
      </div>
      
      {/* Sidebar Toggle Button */}
      <button 
        onClick={onToggle}
        className={`absolute top-1/2 -translate-y-1/2 z-20 bg-white border border-black shadow-sm flex items-center justify-center transition-all duration-300 ${isOpen ? 'left-[320px] w-6 h-16 border-l-0 rounded-r-md' : 'left-0 w-8 h-16 border-l-0 rounded-r-md'}`}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </>
  );
}
