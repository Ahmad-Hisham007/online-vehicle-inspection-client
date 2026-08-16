"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InspectionDetail, MediaTab } from "@/app/lib/types";

const TAB_ORDER: MediaTab[] = ["general", "interior", "exterior", "tires"];

const TAB_LABELS: Record<MediaTab, string> = {
  general: "General",
  interior: "Interior",
  exterior: "Exterior",
  tires: "Tires",
};

interface MediaGalleryProps {
  media: InspectionDetail["media"];
}

export default function MediaGallery({ media }: MediaGalleryProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border md:p-4 p-2.5">
      <Tabs defaultValue="general">
        <TabsList className="flex h-auto w-full flex-nowrap items-stretch overflow-x-auto rounded-xl bg-primary/10 p-1 scrollbar-none md:grid md:grid-cols-4">
          {TAB_ORDER.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-primary"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_ORDER.map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4 pt-4">
            {media[tab].length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No {TAB_LABELS[tab].toLowerCase()} media uploaded
              </p>
            ) : (
              media[tab].map((item) =>
                item.type === "video" ? (
                  <div
                    key={item.url}
                    className="w-full overflow-hidden rounded-xl bg-black"
                  >
                    <video
                      src={item.url}
                      controls
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    key={item.url}
                    className="aspect-video w-full overflow-hidden rounded-xl bg-black"
                  >
                    <Image
                      src={item.url}
                      alt={item.label}
                      width={1280}
                      height={720}
                      className="size-full object-cover"
                    />
                  </div>
                ),
              )
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
