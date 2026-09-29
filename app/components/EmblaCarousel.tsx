"use client";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  EmblaCarouselType,
  EmblaEventListType,
  EmblaOptionsType,
  EmblaEventModelType,
} from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";

import Image from "next/image";

const TWEEN_FACTOR_BASE = 0.2;

type PropType = {
  slides: string[];
  options?: EmblaOptionsType;
};

const EmblaCarousel = (props: PropType) => {
  const autoplay = useMemo(() => Autoplay({ delay: 3000 }), []);
  const { slides, options } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options, [autoplay]);
  const tweenFactor = useRef(0);
  const tweenNodes = useRef<HTMLElement[]>([]);

  const setTweenNodes = useCallback((emblaApi: EmblaCarouselType): void => {
    tweenNodes.current = emblaApi.slideNodes().map((slideNode) => {
      return slideNode.querySelector(".embla__parallax__layer") as HTMLElement;
    });
  }, []);

  const setTweenFactor = useCallback((emblaApi: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * emblaApi.snapList().length;
  }, []);

  const tweenParallax = useCallback(
    <EventType extends keyof EmblaEventListType>(
      emblaApi: EmblaCarouselType,
      event?: EmblaEventModelType<EventType>,
    ) => {
      const engine = emblaApi.internalEngine();
      const scrollProgress = emblaApi.scrollProgress();
      const slidesInView = emblaApi.slidesInView();
      const isScrollEvent = event?.type === "scroll";

      emblaApi.snapList().forEach((scrollSnap, snapIndex) => {
        let diffToTarget = scrollSnap - scrollProgress;
        const slidesInSnap = engine.scrollSnapList.slidesBySnap[snapIndex];

        slidesInSnap.forEach((slideIndex) => {
          if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

          if (engine.options.loop) {
            engine.slideLooper.loopPoints.forEach((loopItem) => {
              const target = loopItem.target();

              if (slideIndex === loopItem.index && target !== 0) {
                const sign = Math.sign(target);

                if (sign === -1) {
                  diffToTarget = scrollSnap - (1 + scrollProgress);
                }
                if (sign === 1) {
                  diffToTarget = scrollSnap + (1 - scrollProgress);
                }
              }
            });
          }

          const translate = diffToTarget * (-1 * tweenFactor.current) * 100;
          const tweenNode = tweenNodes.current[slideIndex];
          if (tweenNode) {
            tweenNode.style.transform = `translateY(${translate}%)`;
          }
        });
      });
    },
    [],
  );

  useEffect(() => {
    if (!emblaApi) return;

    setTweenNodes(emblaApi);
    setTweenFactor(emblaApi);
    tweenParallax(emblaApi);

    emblaApi
      .on("reinit", setTweenNodes)
      .on("reinit", setTweenFactor)
      .on("reinit", tweenParallax)
      .on("scroll", tweenParallax)
      .on("slidefocus", tweenParallax);
  }, [emblaApi, tweenParallax]);
  useEffect(() => {
    if (!emblaApi) return;
    autoplay.play();
  }, [emblaApi, autoplay]);
  return (
    <div className="embla-hero-carousel z-10">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((slide, index) => (
            <div className="embla__slide" key={index}>
              <div className="embla__parallax">
                <div className="embla__parallax__layer relative">
                  <div className="z-20 bg-black/50 absolute w-full h-full"></div>
                  <Image
                    className="embla__slide__img embla__parallax__img"
                    src={slide}
                    alt="Your alt text"
                    width={1920}
                    height={800}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmblaCarousel;
