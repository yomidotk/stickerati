import React, { useEffect } from 'react';

// Using a robust CSS filter chain to simulate a thick solid white sticker border
// and a subtle drop shadow on the final shape.
const stickerFilter = `
  drop-shadow(2px 0px 0px white) 
  drop-shadow(-2px 0px 0px white) 
  drop-shadow(0px 2px 0px white) 
  drop-shadow(0px -2px 0px white) 
  drop-shadow(1px 1px 0px white)
  drop-shadow(-1px -1px 0px white)
  drop-shadow(1px -1px 0px white)
  drop-shadow(-1px 1px 0px white)
  drop-shadow(0px 4px 6px rgba(0,0,0,0.15))
`;

const stickers = [
  // Top row
  { src: '/assets/1.png', top: '10%', left: '12%', size: 'w-24', anim: 'animate-float-1', delay: '0s' },
  { src: '/assets/2.png', top: '5%', left: '30%', size: 'w-28', anim: 'animate-float-2', delay: '0.5s' },
  { src: '/assets/3.png', top: '15%', left: '55%', size: 'w-32', anim: 'animate-float-3', delay: '1s' },
  { src: '/assets/4.png', top: '10%', left: '80%', size: 'w-28', anim: 'animate-float-1', delay: '0.2s' },
  
  // Middle row
  { src: '/assets/5.png', top: '40%', left: '10%', size: 'w-32', anim: 'animate-float-2', delay: '1.2s' },
  { src: '/assets/6.png', top: '40%', left: '75%', size: 'w-24', anim: 'animate-float-3', delay: '0.8s' },
  
  // Lower row
  { src: '/assets/7.png', top: '58%', left: '28%', size: 'w-28', anim: 'animate-float-1', delay: '1.5s' },
  { src: '/assets/8.png', top: '62%', left: '65%', size: 'w-24', anim: 'animate-float-2', delay: '0.3s' },
  
  // Bottom row
  { src: '/assets/9.png', top: '75%', left: '48%', size: 'w-32', anim: 'animate-float-3', delay: '0.7s' },
  { src: '/assets/10.png', top: '82%', left: '70%', size: 'w-28', anim: 'animate-float-1', delay: '1.1s' },
  { src: '/assets/11.png', top: '65%', left: '88%', size: 'w-24', anim: 'animate-float-2', delay: '0.9s' },
];

export default function LoadingPage({ onComplete }) {
  useEffect(() => {
    // Automatically transition to the main app after 4.5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="w-full h-screen bg-grid-pattern relative overflow-hidden flex items-center justify-center cursor-default select-none">
      
      {/* Decorative scattered stickers */}
      {stickers.map((st, i) => (
        <img 
          key={i}
          src={`${import.meta.env.BASE_URL}${st.src.replace('^/?', '')}`.replace('//', '/')}
          className={`absolute ${st.size} ${st.anim} object-contain transition-transform hover:scale-110 z-0`}
          style={{ 
            top: st.top, 
            left: st.left, 
            filter: stickerFilter,
            animationDelay: st.delay
          }}
          alt=""
        />
      ))}

      {/* Main Center Text */}
      <div className="z-10 flex flex-col items-center mt-[-5%] mix-blend-multiply">
        <h2 className="text-5xl font-helvetica-condensed tracking-tight text-neutral-800 mb-[-10px] ml-[-120px] font-light">
          welcome to my
        </h2>
        <h1 className="text-8xl font-helvetica-condensed font-black italic tracking-tighter text-black">
          STICKERATI
        </h1>
      </div>

      {/* Bottom Left Instructional Text */}
      <div className="absolute bottom-16 left-16 z-10 max-w-md">
        <p className="font-computer text-sm text-neutral-700 leading-relaxed uppercase tracking-wider">
          A STICKER SHEET MAKER , JUST DROP IMAGES AND<br/>
          TOOL WILL REMOVE BACKGROUND AND FIX BORDERS
        </p>
      </div>

      {/* Loading progress bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-neutral-900 w-full origin-left animate-[scale-x_4.5s_linear_forwards]" 
           style={{ animationName: 'scaleX' }} />
           
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scaleX {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}} />
    </div>
  );
}
