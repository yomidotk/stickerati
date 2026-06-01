import React, { useRef, useEffect, useImperativeHandle } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from 'react-konva';
import useImage from 'use-image';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const Sticker = ({ shapeProps, onSelect, onChange }) => {
  const shapeRef = useRef();

  // Dynamically load either the bordered image or the original image
  const imageUrl = shapeProps.border ? shapeProps.borderUrl : shapeProps.url;
  const [image] = useImage(imageUrl);

  return (
    <KonvaImage
      image={image}
      onClick={onSelect}
      onTap={onSelect}
      ref={shapeRef}
      id={shapeProps.id}
      name="sticker-image"
      x={shapeProps.x}
      y={shapeProps.y}
      width={shapeProps.width}
      height={shapeProps.height}
      rotation={shapeProps.rotation}
      draggable
      shadowColor="rgba(0,0,0,0.4)"
      shadowBlur={10}
      shadowOffsetX={4}
      shadowOffsetY={4}
      onDragEnd={(e) => {
        onChange({
          ...shapeProps,
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={(e) => {
        const node = shapeRef.current;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        onChange({
          ...shapeProps,
          x: node.x(),
          y: node.y(),
          width: Math.max(5, shapeProps.width * scaleX),
          height: Math.max(5, shapeProps.height * scaleY),
          rotation: node.rotation(),
        });
      }}
    />
  );
};

export default React.forwardRef(function StickerCanvas({ stickers, setStickers, sheetColor }, ref) {
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [selectionRect, setSelectionRect] = React.useState({ visible: false, x1: 0, y1: 0, x2: 0, y2: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [isSpaceDown, setIsSpaceDown] = React.useState(false);
  const [panState, setPanState] = React.useState({ isPanning: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });
  
  const scrollContainerRef = useRef(null);
  const stageRef = useRef(null);
  const trRef = useRef(null);

  useImperativeHandle(ref, () => ({
    toDataURL: (opts) => {
      // Regardless of zoom level, export at a consistent resolution
      // Base canvas width is 794. If opts.pixelRatio is 2, we want 1588px wide output.
      // Since the stage is already scaled by `zoom`, we adjust pixelRatio.
      const adjustedOpts = {
        ...opts,
        pixelRatio: (opts.pixelRatio || 1) / zoom
      };
      return stageRef.current.toDataURL(adjustedOpts);
    },
    deselectAll: () => {
      setSelectedIds([]);
    }
  }));

  // Bind transformer to selected nodes
  useEffect(() => {
    if (trRef.current && stageRef.current) {
      const nodes = selectedIds.map(id => stageRef.current.findOne('#' + id)).filter(Boolean);
      trRef.current.nodes(nodes);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, stickers]);

  // Global keyboard shortcuts for selected stickers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsSpaceDown(true);
        }
      }
      if (selectedIds.length > 0) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          setStickers(prev => prev.filter(s => !selectedIds.includes(s.id)));
          setSelectedIds([]);
        }
        if (e.key === 'b' || e.key === 'B') {
          setStickers(prev => prev.map(s => {
            if (selectedIds.includes(s.id)) {
              return { ...s, border: s.border ? 0 : 1 };
            }
            return s;
          }));
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);
        setPanState(prev => ({ ...prev, isPanning: false }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, setStickers]);

  const onMouseDown = (e) => {
    // Check for middle mouse button (button 1) or Spacebar panning
    if (e.evt.button === 1 || isSpaceDown) {
      e.evt.preventDefault();
      if (!scrollContainerRef.current) return;
      setPanState({
        isPanning: true,
        startX: e.evt.clientX,
        startY: e.evt.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop
      });
      return;
    }

    // If clicked on empty area or background
    const isBackground = e.target === e.target.getStage() || e.target.name() === 'background';
    if (isBackground) {
      if (!e.evt.shiftKey) {
        setSelectedIds([]);
      }
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      // Adjust pointer position for zoom
      const x = pointer.x / zoom;
      const y = pointer.y / zoom;
      setSelectionRect({ visible: true, x1: x, y1: y, x2: x, y2: y });
    }
  };

  const onMouseMove = (e) => {
    if (panState.isPanning) {
      const dx = e.evt.clientX - panState.startX;
      const dy = e.evt.clientY - panState.startY;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = panState.scrollLeft - dx;
        scrollContainerRef.current.scrollTop = panState.scrollTop - dy;
      }
      return;
    }

    if (!selectionRect.visible) return;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    // Adjust pointer position for zoom
    const x = pointer.x / zoom;
    const y = pointer.y / zoom;
    setSelectionRect(prev => ({ ...prev, x2: x, y2: y }));
  };

  const onMouseUp = (e) => {
    if (panState.isPanning) {
      setPanState(prev => ({ ...prev, isPanning: false }));
      return;
    }

    if (!selectionRect.visible) return;
    const stage = e.target.getStage();

    // Calculate true rect safely resolving negative width/height if dragged backwards
    const trueBox = {
      x: Math.min(selectionRect.x1, selectionRect.x2),
      y: Math.min(selectionRect.y1, selectionRect.y2),
      width: Math.abs(selectionRect.x2 - selectionRect.x1),
      height: Math.abs(selectionRect.y2 - selectionRect.y1)
    };

    const shapes = stage.find('.sticker-image');
    const newSelected = shapes.filter((shape) => {
      // Shape position in absolute/unscaled coordinates
      const x = shape.x();
      const y = shape.y();
      const width = shape.width() * shape.scaleX();
      const height = shape.height() * shape.scaleY();
      
      // Check for overlap using unscaled coordinates
      return (
        trueBox.x <= x + width &&
        trueBox.x + trueBox.width >= x &&
        trueBox.y <= y + height &&
        trueBox.y + trueBox.height >= y
      );
    }).map(s => s.id());

    if (e.evt.shiftKey) {
      setSelectedIds(Array.from(new Set([...selectedIds, ...newSelected])));
    } else {
      setSelectedIds(newSelected);
    }

    setSelectionRect(prev => ({ ...prev, visible: false }));
  };

  const onStickerSelect = (id, e) => {
    if (isSpaceDown) return;
    const isShift = e.evt.shiftKey;
    if (isShift) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(selId => selId !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      setSelectedIds([id]);
    }
  };

  return (
    <div 
      ref={scrollContainerRef}
      className={`flex-1 w-full h-full bg-transparent overflow-auto relative ${isSpaceDown || panState.isPanning ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="absolute top-4 right-8 z-20 bg-white px-5 py-3 border border-black text-black text-xs font-computer font-bold tracking-widest uppercase shadow-sm">
        <strong className="text-black bg-yellow-200 px-1 mx-1">Space+Drag</strong> to pan • <strong className="text-black bg-yellow-200 px-1 mx-1">Shift+Drag</strong> to multi-select • <strong className="text-black bg-yellow-200 px-1 mx-1">B</strong> to toggle border • <strong className="text-white bg-black px-1 mx-1">Del</strong> to remove
      </div>

      <div className="w-max mx-auto p-12 relative flex flex-col items-center justify-start">
        {/* Zoom Controls */}
        <div className="flex items-center gap-4 bg-white border border-black shadow-sm px-4 py-2 font-computer text-sm font-bold mb-6 mt-[27px]">
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} className="p-1 hover:bg-neutral-100 transition-colors">
            <ZoomOut size={16} />
          </button>
          <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 3))} className="p-1 hover:bg-neutral-100 transition-colors">
            <ZoomIn size={16} />
          </button>
          <div className="w-px h-4 bg-neutral-300 mx-2"></div>
          <button onClick={() => setZoom(1)} className="p-1 hover:bg-neutral-100 transition-colors" title="Reset Zoom">
            <Maximize size={16} />
          </button>
        </div>

        <div 
          className={`bg-white relative transition-all duration-300 transform-gpu shrink-0 mb-12 border border-black shadow-md box-content ${isSpaceDown || panState.isPanning ? 'pointer-events-none' : ''}`}
          style={{
            width: `${794 * zoom}px`,
            height: `${1123 * zoom}px`,
          }}
        >
          <Stage
            width={794 * zoom}
            height={1123 * zoom}
            scaleX={zoom}
            scaleY={zoom}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onTouchStart={onMouseDown}
            onTouchMove={onMouseMove}
            onTouchEnd={onMouseUp}
            ref={stageRef}
          >
            <Layer>
              {/* Colored background so it exports correctly and serves as hit area for deselection */}
              <Rect x={0} y={0} width={794} height={1123} fill={sheetColor} name="background" />

              {stickers.map((sticker) => {
                return (
                  <Sticker
                    key={sticker.id}
                    shapeProps={sticker}
                    onSelect={(e) => onStickerSelect(sticker.id, e)}
                    onChange={(newAttrs) => {
                      const rects = stickers.slice();
                      const index = stickers.findIndex((s) => s.id === sticker.id);
                      rects[index] = newAttrs;
                      setStickers(rects);
                    }}
                  />
                );
              })}

              {selectionRect.visible && (
                <Rect
                  x={Math.min(selectionRect.x1, selectionRect.x2)}
                  y={Math.min(selectionRect.y1, selectionRect.y2)}
                  width={Math.abs(selectionRect.x2 - selectionRect.x1)}
                  height={Math.abs(selectionRect.y2 - selectionRect.y1)}
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth={1 / zoom}
                  name="selectionBox"
                />
              )}

              <Transformer
                ref={trRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
});
