
"use client";

import type { Announcement } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Megaphone, ExternalLink } from "lucide-react";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";

interface AnnouncementBannerProps {
  announcements: Announcement[];
}

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  if (!announcements || announcements.length === 0) {
    return null;
  }

  return (
    <div className="bg-primary/10 py-2">
      <div className="container mx-auto px-4">
        <Carousel
          opts={{ loop: true }}
          plugins={[Autoplay({ delay: 5000 })]}
          className="w-full"
        >
          <CarouselContent>
            {announcements.map((announcement) => (
              <CarouselItem key={announcement.id}>
                <Alert className="border-0 shadow-none bg-transparent">
                  <div className="flex items-center gap-4">
                    <Megaphone className="h-6 w-6 text-primary" />
                    <div className="flex-grow">
                      <AlertTitle className="font-bold text-primary">{announcement.title}</AlertTitle>
                      <AlertDescription className="text-foreground/80">{announcement.message}</AlertDescription>
                    </div>
                    {announcement.link && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={announcement.link} target="_blank">
                          Learn More <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </Alert>
              </CarouselItem>
            ))}
          </CarouselContent>
          {announcements.length > 1 && (
            <>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </>
          )}
        </Carousel>
      </div>
    </div>
  );
}
