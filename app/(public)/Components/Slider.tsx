import EmblaCarousel from "@/app/components/EmblaCarousel";
import { Button } from "@/components/ui/button";
import { EmblaOptionsType } from "embla-carousel";
import { RiArrowRightLongLine } from "react-icons/ri";

import React from "react";
import Link from "next/link";

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
        <div className="h-auto absolute top-6/12 -translate-y-6/12 pl-30 w-full text-left">
          <h2 className="uppercase text-9xl font-black text-amber-50 max-w-120">
            Ride <span className="text-primary">Share</span> Inspection
          </h2>
          <Link
            href="http://localhost:3000/dashboard/customer/inspection"
            className="mt-16 uppercase rounded-full bg-primary hover:bg-primary/70 text-white shadow-sm text-sm font-light transition-all min-h-[unset] w-max py-4 px-8 h-auto flex items-center gap-2"
          >
            Start Now
            <RiArrowRightLongLine className="w-6! h-6! text-3xl!" />
          </Link>
        </div>
      </div>
      <div className="max-w-185 flex items-stretch divide-x divide-gray-600 gap-10 p-12.5 bg-primary z-999! ml-auto -mt-30 relative">
        <div className="pr-10">
          <h2 className="font-extrabold text-7xl text-black/80">17000+</h2>
          <p className="text-black/60">Total Inspection Approved</p>
        </div>
        <div>
          <h2 className="text-black/80 font-extrabold text-7xl">15000+</h2>
          <p className="text-black/60">Total Happy Customers</p>
        </div>
      </div>
    </section>
  );
};

export default Slider;
