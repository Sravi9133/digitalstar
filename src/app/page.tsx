
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Gift, Tv, Camera } from "lucide-react";
import type { Competition, Announcement } from "@/types";
import { Header } from "@/components/header";
import { getFirestore, collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { AnnouncementBanner } from "@/components/announcement-banner";

const competitions: Competition[] = [
  {
    id: "follow-win",
    name: "Follow & Win (Daily winner)",
    description: "Follow your school's social media and submit a screenshot to win daily prizes. Every day, we’ll pick lucky winners from valid entries for a chance to win LPU goodies!",
    prize: "🎁 25 winners/day (Lucky draw)\n🧧 Reward: LPU Goodie Pack worth Rs. 500\n📣 Winners announced on this platform",
    deadline: new Date("2025-09-30T23:59:59"),
    icon: <Gift className="w-8 h-8 text-primary" />,
  },
  {
    id: "reel-it-feel-it",
    name: "Reel It. Feel It.",
    description: "Create an Instagram Reel about your first days at LPU. Top 3 reels will win premium LPU merchandise and get featured on the official LPU Instagram handle!",
    prize: "🎁 Participation Gift: For valid entries with 500+ views (Worth Rs. 200)\n🏅 Top 3 Reels: Premium LPU Merchandise (Worth Rs. 5,000 each)",
    deadline: new Date("2025-10-15T23:59:59"),
    icon: <Tv className="w-8 h-8 text-primary" />,
  },
  {
    id: "my-first-day",
    name: "My First Day at LPU",
    description: "Take a selfie at LPU’s official Selfie Point, post it on Instagram using the designated hashtag, and tag the official LPU page.",
    prize: "🎁 Participation Gift: For posts with 50+ likes (Worth Rs. 100)",
    deadline: new Date("2025-09-20T23:59:59"),
    icon: <Camera className="w-8 h-8 text-primary" />,
  },
];

async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const db = getFirestore(app);
    const announcementsCol = collection(db, "announcements");
    // Simpler query to avoid needing a composite index immediately.
    // We filter by isActive and then sort in code.
    const q = query(announcementsCol, where("isActive", "==", true));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }
    const announcements = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as Announcement;
    });

    // Sort by creation date descending (newest first)
    return announcements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }
}


export default async function Home() {
  const announcements = await getAnnouncements();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <AnnouncementBanner announcements={announcements} />
        <section className="relative py-20 md:py-32 text-center text-white overflow-hidden">
            <div className="absolute inset-0">
                <Image
                    src="/hero.png"
                    alt="Students collaborating"
                    fill
                    priority
                    className="object-cover"
                    data-ai-hint="students collaboration"
                />
                <div className="absolute inset-0 bg-black/30" />
            </div>
          <div className="relative container mx-auto px-4">
            <div className="bg-black/20 backdrop-blur-md rounded-xl p-8 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4">Compete. Innovate. Succeed.</h1>
                <p className="text-lg md:text-xl max-w-3xl mx-auto text-primary-foreground/90">
                Welcome to Digital Star LPU, the ultimate platform for student competitions. Find your challenge and submit your entry today.
                </p>
            </div>
          </div>
        </section>

        <section id="competitions" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-headline text-foreground">
              Open Competitions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {competitions.map((competition) => (
                <Card key={competition.id} className="flex flex-col transform hover:-translate-y-2 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        {competition.icon}
                      </div>
                      <CardTitle className="font-headline text-2xl">{competition.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <CardDescription>{competition.description}</CardDescription>
                     {competition.prize && (
                        <div className="text-sm text-foreground/90 bg-muted/50 p-3 rounded-md">
                            <h4 className="font-bold mb-2 flex items-center"><Gift className="w-4 h-4 mr-2 text-primary" /> Prize Details</h4>
                            <div className="whitespace-pre-line text-xs pl-2 border-l-2 border-primary/50 ml-2 py-1">
                                {competition.prize}
                            </div>
                        </div>
                     )}
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-4">
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <Calendar className="w-4 h-4" />
                       <span>Deadline: {competition.deadline.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                     </div>
                    <Button asChild className="w-full font-bold">
                      <Link href={`/submit/${competition.id}`}>
                        Submit Entry <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-background/80 py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Digital Star LPU. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
