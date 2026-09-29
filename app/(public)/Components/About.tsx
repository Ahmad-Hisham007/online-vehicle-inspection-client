import React from "react";
import LogoCarousel from "./logoCarousel";
import { EmblaOptionsType } from "embla-carousel";
import { TbSteeringWheel } from "react-icons/tb";
import { GiCarWheel } from "react-icons/gi";

const Slides = [
  "/veyo.png",
  "/uber.png",
  "/turo.png",
  "/lyft.png",
  "/hopskipdrive.png",
  "/zum.png",
  "/getaround.png",
  "/everdriven.png",
  "/carepool.png",
];
const OPTIONS: EmblaOptionsType = {
  dragFree: true,
  loop: true,
};
const About = () => {
  return (
    <section className="bg-muted py-20 text-center">
      <h2 className="flex mx-auto text-center text-gray-500/80 font-semibold text-lg justify-center items-center gap-7 mb-6">
        <span className="after:contnet-[''] relative after:absolute after:h-0.5 after:bg-destructive/50 after:left-3.5 after:w-5 after:top-2">
          <GiCarWheel className="animate-spin duration-20000 text-destructive/50" />
        </span>
        Inspected With Top Certification Companies
      </h2>
      <LogoCarousel slides={Slides} options={OPTIONS} />
      <div className=" w-125 mx-auto h-0.5 bg-destructive relative">
        <div className="w-90 z-999 h-full bg-[linear-gradient(90deg,#02010100_0%,#f4f2f2_80%)] right-0 absolute top-0"></div>
        <div className="w-90 z-999 h-full bg-[linear-gradient(270deg,#02010100_0%,#f4f2f2_80%)] left-0 absolute top-0"></div>
      </div>
    </section>
  );
};

export default About;
