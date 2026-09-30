import Image from "next/image";
import Slider from "./Components/Slider";
import About from "./Components/About";
import VideoSection from "./Components/VideoSection";
import HowItWorks from "./Components/HowItWorks";
import WhyChooseUs from "./Components/WhyChooseUs";
import PricingSection from "./Components/PricingSection";

export default function Home() {
  return (
    <>
      <Slider />
      <About />
      <VideoSection />
      <HowItWorks />
      <PricingSection />
      <WhyChooseUs />
    </>
  );
}
