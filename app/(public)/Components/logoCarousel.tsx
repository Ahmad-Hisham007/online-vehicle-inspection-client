"use client";
import React, { useEffect } from "react";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import Image from "next/image";

type PropType = {
  slides: string[];
  options?: EmblaOptionsType;
};

const LogoCarousel = (props: PropType) => {
  const { slides, options } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options, [
    AutoScroll({ speed: 1 }),
  ]);
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.plugins().autoScroll?.play();
  }, [emblaApi]);
  return (
    <div className="embla logo-carousel max-w-6xl mx-auto mb-10 relative">
      <div className="w-90 z-999 h-full bg-[linear-gradient(90deg,#02010100_0%,#f4f2f2_80%)] right-0 absolute top-0"></div>
      <div className="w-90 z-999 h-full bg-[linear-gradient(270deg,#02010100_0%,#f4f2f2_80%)] left-0 absolute top-0"></div>
      <div className="embla__viewport overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex items-center">
          {slides.map((slide, index) => (
            <div className="embla__slide" key={index}>
              <Image
                className="embla__slide__img w-full object-contain object-center block"
                src={slide}
                alt="Your alt text"
                width={260}
                height={75}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogoCarousel;
