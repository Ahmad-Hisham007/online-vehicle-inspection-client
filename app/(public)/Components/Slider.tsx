import EmblaCarousel from "@/app/components/EmblaCarousel";
import { EmblaOptionsType } from "embla-carousel";
import React from "react";

const OPTIONS: EmblaOptionsType = {
  dragFree: true,
  loop: true,
  axis: "y",
  duration: 50,
};
const SLIDES = [
  "/home-slider-1.jpg",
  "/home-slider-2.jpg",
  "/home-slider-3.jpg",
];

const Slider = () => {
  return (
    <section className="relative bg-muted">
      <div className="auto relative z-10!">
        <EmblaCarousel slides={SLIDES} options={OPTIONS} />
        <div className="h-auto absolute top-6/12 -translate-y-6/12 pl-30 flex items-center w-full">
          <h2 className="uppercase text-9xl font-black text-amber-50 max-w-120">
            Ride <span className="text-primary">Share</span> Inspection
          </h2>
        </div>
      </div>
      <div className="max-w-185 flex items-stretch divide-x divide-gray-600 gap-10 p-12.5 bg-primary z-999! ml-auto -mt-30 relative">
        <div className="pr-10">
          <h2 className="font-extrabold text-7xl text-black/80">7382+</h2>
          <p>Total Project Completed</p>
        </div>
        <div>
          <h2 className="text-black/80 font-extrabold text-7xl">7382+</h2>
          <p>Total Project Completed</p>
        </div>
      </div>
    </section>
  );
};

export default Slider;
