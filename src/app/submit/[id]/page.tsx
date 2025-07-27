
import { ArrowLeft, Camera, Gift, Tv } from "lucide-react";
import type { Competition } from "@/types";
import { SubmissionForm } from "./submission-form";
import { FollowWinForm } from "./follow-win-form";
import { ReelItFeelItForm } from "./reel-it-feel-it-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";

const competitionsData: Omit<Competition, 'deadline'>[] = [
  {
    id: "follow-win",
    name: "Follow & Win (Daily winner)",
    description: "Follow your school's social media and submit a screenshot to win daily prizes.",
    prize: "🎁 25 winners/day (Lucky draw)\n🧧 Reward: LPU Goodie Pack worth Rs. 500\n📣 Winners will be announced on this platform",
    icon: <Gift className="w-8 h-8 text-primary" />,
  },
  {
    id: "reel-it-feel-it",
    name: "Reel It. Feel It.",
    description: "Create an Instagram Reel about your first days at LPU.",
    prize: "🎁 Participation Gift: For valid entries with 500+ views (Worth Rs. 200)\n🏅 Top 3 Reels: Premium LPU Merchandise (Worth Rs. 5,000 each)",
    icon: <Tv className="w-8 h-8 text-primary" />,
  },
  {
    id: "my-first-day",
    name: "My First Day at LPU",
    description: "Take a selfie at the official Selfie Point and post it on Instagram.",
    prize: "🎁 Participation Gift: For posts with 50+ likes (Worth Rs. 100)",
    icon: <Camera className="w-8 h-8 text-primary" />,
  },
];

function getCompetition(id: string): Omit<Competition, 'deadline'> | undefined {
  return competitionsData.find(c => c.id === id);
}

export default async function SubmissionPage({ params }: { params: { id: string } }) {
  const competition = getCompetition(params.id);

  if (!competition) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-4xl font-bold mb-4">Competition Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The competition you are looking for does not exist or has been moved.
        </p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Competitions
          </Link>
        </Button>
      </div>
    );
  }

  const getForm = () => {
    switch (competition.id) {
      case 'follow-win':
        return <FollowWinForm competitionId={competition.id} competitionName={competition.name} />;
      case 'reel-it-feel-it':
        return <ReelItFeelItForm competitionId={competition.id} competitionName={competition.name} />;
      case 'my-first-day':
        return <ReelItFeelItForm competitionId={competition.id} competitionName={competition.name} postType="Post" />;
      default:
        return <SubmissionForm competitionId={competition.id} competitionName={competition.name} />;
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-accent/20 via-background to-primary/20">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12 md:py-24">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                    <div className="inline-block p-4 bg-card rounded-xl mb-4">
                        {competition.icon}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold font-headline mb-2">{competition.name}</h1>
                    <p className="text-lg text-muted-foreground">{competition.id === 'follow-win' ? "Fill in your details to enter the lucky draw" : "Submission Form"}</p>
                    {competition.prize && (
                        <div className="mt-4 text-sm text-foreground/90 bg-card/80 p-4 rounded-md border">
                            <h4 className="font-bold mb-2 flex items-center justify-center"><Gift className="w-4 h-4 mr-2 text-primary" /> Prize Details</h4>
                            <div className="whitespace-pre-line text-xs">
                                {competition.prize}
                            </div>
                        </div>
                    )}
                    <Button asChild variant="link" className="mt-4 block">
                        <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to all competitions</Link>
                    </Button>
                </div>
            {getForm()}
            </div>
        </div>
      </main>
    </div>
  );
}
