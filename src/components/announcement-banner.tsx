
"use client";

import type { Announcement } from "@/types";
import { Megaphone, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AnnouncementBannerProps {
  announcements: Announcement[];
}

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  if (!announcements || announcements.length === 0) {
    return null;
  }

  const duplicatedAnnouncements = announcements.length === 1 ? [...announcements, ...announcements] : announcements;

  return (
    <div className="bg-primary/10 py-3 relative flex overflow-hidden">
        <div className="animate-marquee-infinite flex min-w-full shrink-0 items-center justify-around gap-12">
            {duplicatedAnnouncements.map((announcement, index) => (
              <div key={`${announcement.id}-${index}`} className="flex items-center gap-4 mx-6">
                <Megaphone className="h-5 w-5 text-primary shrink-0" />
                <div className="flex items-baseline gap-4">
                  <p className="font-semibold text-primary text-sm whitespace-nowrap">{announcement.title}</p>
                  <p className="text-foreground/80 text-sm whitespace-nowrap">{announcement.message}</p>
                </div>
                {announcement.link && (
                  <Button asChild variant="link" size="sm" className="whitespace-nowrap -ml-2">
                    <Link href={announcement.link} target="_blank">
                      Learn More <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
        </div>
        <div className="absolute top-0 animate-marquee-infinite-2 flex min-w-full shrink-0 items-center justify-around gap-12">
            {duplicatedAnnouncements.map((announcement, index) => (
              <div key={`${announcement.id}-${index}-2`} className="flex items-center gap-4 mx-6">
                <Megaphone className="h-5 w-5 text-primary shrink-0" />
                <div className="flex items-baseline gap-4">
                  <p className="font-semibold text-primary text-sm whitespace-nowrap">{announcement.title}</p>
                  <p className="text-foreground/80 text-sm whitespace-nowrap">{announcement.message}</p>
                </div>
                {announcement.link && (
                  <Button asChild variant="link" size="sm" className="whitespace-nowrap -ml-2">
                    <Link href={announcement.link} target="_blank">
                      Learn More <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
        </div>
    </div>
  );
}
