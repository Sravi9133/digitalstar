import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Camera, Gift, Tv } from "lucide-react";
import type { Competition } from "@/types";
import { Header } from "@/components/header";

const competitions: Competition[] = [
  {
    id: "follow-win",
    name: "Follow & Win",
    description: "Follow your school's social media and submit a screenshot to win daily prizes. The more you engage, the better your chances!",
    deadline: new Date("2025-09-30T23:59:59"),
    icon: <Gift className="w-8 h-8 text-primary" />,
  },
  {
    id: "reel-it-feel-it",
    name: "Reel It. Feel It.",
    description: "Create an Instagram Reel about your first days at LPU. Top 3 reels win premium merchandise and get featured on our official page.",
    deadline: new Date("2025-10-15T23:59:59"),
    icon: <Tv className="w-8 h-8 text-primary" />,
  },
  {
    id: "my-first-day",
    name: "My First Day at LPU",
    description: "Take a selfie at the official Selfie Point, post it on Instagram with our hashtag, and tag us to win a participation gift.",
    deadline: new Date("2025-09-20T23:59:59"),
    icon: <Camera className="w-8 h-8 text-primary" />,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <section className="relative py-20 md:py-32 text-center text-white bg-gradient-to-br from-accent to-primary">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4">Compete. Innovate. Succeed.</h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-primary-foreground/90">
              Welcome to CompSubmit, the ultimate platform for student competitions. Find your challenge and submit your entry today.
            </p>
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
                  <CardContent className="flex-grow">
                    <CardDescription>{competition.description}</CardDescription>
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
          <p>&copy; {new Date().getFullYear()} CompSubmit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
