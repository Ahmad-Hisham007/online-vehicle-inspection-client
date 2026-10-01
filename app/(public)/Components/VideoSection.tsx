"use client";
import React, { useState } from "react";
import { AnimateOnScroll } from "./AnimateOnScroll";
import { scaleIn } from "./animations";

const VideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-10 px-4">
      <AnimateOnScroll variants={scaleIn} duration={1.0} delay={0.6}>
        <div className="relative max-w-325 mx-auto md:h-175 h-[40vh] w-full rounded-[18px] overflow-hidden">
          {isPlaying ? (
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/MoFPlMDIjcA?autoplay=1"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-full rounded-[18px]"
            ></iframe>
          ) : (
            <div
              className="relative w-full h-full bg-cover bg-center flex items-center justify-center cursor-pointer group"
              style={{
                backgroundImage: `url('/maxresdefault.jpg')`,
              }}
              onClick={() => setIsPlaying(true)}
            >
              {/* Dark Overlay as Default -> Lightens/Softens on Hover */}
              <div className="absolute inset-0 bg-black/60 group-hover:bg-gradient-to-t group-hover:from-black/40 group-hover:via-black/20 group-hover:to-transparent transition-all duration-300"></div>

              {/* Modern Animated Play Button */}
              <div className="relative group flex items-center justify-center z-20">
                {/* Outer Pulsing Glow: Full Opacity & Scale by Default -> Shrinks & Fades on Hover */}
                <div className="absolute -inset-3 rounded-full bg-red-200/50 blur-xl opacity-100 scale-125 group-hover:opacity-30 group-hover:scale-100 transition-all duration-500 animate-pulse"></div>

                {/* Glassmorphic / Mirror Background Button Body: Scaled & Highlighted by Default */}
                <div className="relative w-24 h-24 rounded-full bg-white/20 backdrop-blur-md border border-red-400/50 shadow-2xl flex items-center justify-center scale-105 group-hover:scale-100 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                  {/* Spinning Circular Text Around the Button */}
                  <svg
                    className="absolute inset-0 w-full h-full animate-[spin_12s_linear_infinite] pointer-events-none p-1"
                    viewBox="0 0 100 100"
                  >
                    <path
                      id="textPath"
                      d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                      fill="none"
                    />
                    <text className="text-[9.5px] uppercase tracking-[2.5px] fill-mauve-800 font-semibold opacity-100 transition-opacity duration-300">
                      <textPath href="#textPath">
                        • PLAY VIDEO • WATCH NOW • PLAY VIDEO
                      </textPath>
                    </text>
                  </svg>

                  {/* Center Play Icon Circle: Bright Gold & Enlarged by Default */}
                  <div className="w-12 h-12 rounded-full bg-red-300 text-black flex items-center justify-center shadow-lg shadow-mauve-400/50 scale-110 group-hover:scale-100 group-hover:bg-red-500 transition-all duration-300">
                    <svg
                      className="w-6 h-6 fill-current ml-1"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AnimateOnScroll>
    </section>
  );
};

export default VideoSection;
