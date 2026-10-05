import React from "react";
import { ArrowDown, ArrowDownToDot, Plus } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { GiCarWheel } from "react-icons/gi";
import { AutoLineSplitter } from "./AnimateOnScroll";

const FAQ = () => {
  const services = [
    {
      id: "item-1",
      title: "What exactly do I need to pass my inspection?",
      content: `It’s pretty easy, to complete the vehicle inspection you need to register and upload: <br/><br/>

A) Short video showing the front of your vehicle with windshield wipers working on, headlights, and emergency blinker turned on (takes 2-3 seconds)<br/><br/>

B) Short video showing the back of your vehicle moving a few feet back and stopping, with emergency blinker and tail lights turned on (takes 3-5 seconds)<br/><br/>

C) Take 4 pictures of the interior of your vehicle with all seat belts buckled, front seats adjusted forward maximally with backrests fully folded forward. Doors should be opened, break pads and rear view mirror must be visible.<br/><br/>

D) Take 6 pictures - 4 photos of every wheel and 2 photos of both driver and passenger sides.<br/><br/>

That’s all and could not be easier!`,
    },
    {
      id: "item-2",
      title: "Is it a legal service?",
      content:
        "The service we provide is fully legal. We have all the necessary licenses and certificates to operate the business in every state we are represented. Our mechanics stare 24/7 through thousands of photos and videos to make sure that every vehicle is safe to use.",
    },
    {
      id: "item-3",
      title: "Is it so quick and convenient in real?",
      content:
        "Yes, you can be sure that your vehicle inspection will take less than 2 hours (usually 15 minutes) after we received photos and videos. You will get your inspection checklist via email and in your cabinet. It’s ready for upload immediately to any app you need.",
    },
    {
      id: "item-4",
      title: "What if I don’t pass my vehicle inspection?",
      content:
        "No worries, you are eligible for 2 re-inspections without new charges. Our mechanics will provide you with instructions on how to solve any issues they found. After that, just resubmit your application with new photos and videos.",
    },
    {
      id: "item-5",
      title:
        "Is my personal information kept safely so bad guys cannot steal it?",
      content:
        "We use the most effective and actual methods of encryption to keep the data safe. The upload process is secured by SSL encryption so you have nothing to worry about. Any information we receive from our customers cannot be transferred to third-party companies without permission.",
    },
  ];

  return (
    <section className="bg-white py-24 px-6 md:px-12 lg:px-20 min-h-screen flex items-center justify-center font-sans text-stone-900">
      <div className="max-w-5xl w-full mx-auto space-y-16">
        {/* Section Header */}
        <div className="relative text-center">
          {/* Badge Tag on Top Left / Centered relative to design */}
          <div className="inline-flex items-center gap-3">
            <GiCarWheel className="animate-bounce text-red-600 text-xl duration-[20s]" />
            <span className="text-sm font-semibold text-red-700 tracking-wide">
              Answer of your queries
            </span>
          </div>

          <h2 className="font-semibold text-3xl md:text-5xl text-stone-900 leading-tight tracking-tight">
            <AutoLineSplitter
              text="Frequently Asked Questions
"
            />
          </h2>
        </div>

        {/* Accordion List Component */}
        <Accordion
          type="single"
          collapsible
          className="w-full space-y-0 border-0"
        >
          {services.map((service) => (
            <AccordionItem
              key={service.id}
              value={service.id}
              className="border-b border-stone-200 bg-transparent shadow-none rounded-none"
            >
              <AccordionTrigger
                className="hover:no-underline py-8 px-2 flex justify-between items-center group [&[data-state=open]>div>svg]:rotate-180 [&[data-state=open]_.dot]:w-2 [&[data-state=open]_.dot]:h-2"
                icon={<ArrowDownToDot />}
              >
                <div className="flex items-center gap-4">
                  <span className="w-3 h-0.5 bg-[#A82B33] group-hover:w-2 group-hover:h-2 transition-all duration-200 dot shrink-0"></span>
                  <span className="text-2xl md:text-3xl font-normal text-stone-900 tracking-tight text-left">
                    {service.title}
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="border-none pb-6 text-stone-600 text-lg leading-relaxed font-light">
                <div dangerouslySetInnerHTML={{ __html: service.content }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
