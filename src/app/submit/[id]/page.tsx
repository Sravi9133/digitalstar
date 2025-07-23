import { ArrowLeft, Code, Lightbulb, Trophy } from "lucide-react";
import type { Competition } from "@/types";
import { SubmissionForm } from "./submission-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const competitionsData: Omit<Competition, 'deadline'>[] = [
  {
    id: "codeclash-2024",
    name: "CodeClash 2024",
    description: "An intense coding competition to challenge the brightest minds.",
    icon: <Code className="w-8 h-8 text-primary" />,
  },
  {
    id: "designminds-challenge",
    name: "DesignMinds Challenge",
    description: "A creative challenge for UI/UX designers.",
    icon: <Lightbulb className="w-8 h-8 text-primary" />,
  },
  {
    id: "startup-pitchfest",
    name: "Startup PitchFest",
    description: "The ultimate platform for aspiring entrepreneurs.",
    icon: <Trophy className="w-8 h-8 text-primary" />,
  },
];

function getCompetition(id: string): Omit<Competition, 'deadline'> | undefined {
  return competitionsData.find(c => c.id === id);
}

export default function SubmissionPage({ params }: { params: { id: string } }) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-primary/20">
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
                 <div className="inline-block p-4 bg-card rounded-xl mb-4">
                    {competition.icon}
                 </div>
                 <h1 className="text-4xl md:text-5xl font-bold font-headline mb-2">{competition.name}</h1>
                 <p className="text-lg text-muted-foreground">Submission Form</p>
                 <Button asChild variant="link" className="mt-4">
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to all competitions</Link>
                 </Button>
            </div>
          <SubmissionForm competitionName={competition.name} />
        </div>
      </div>
    </div>
  );
}
