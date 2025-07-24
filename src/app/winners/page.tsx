
"use client";

import { useEffect, useState } from "react";
import type { Submission, Competition } from "@/types";
import { Header } from "@/components/header";
import { getFirestore, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Loader2, Trophy, Award, Camera, Gift, Tv, User, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import Image from "next/image";

// We need a version of the competitions data available on the client
// to map icons and other details.
const competitionsData: Omit<Competition, 'deadline'>[] = [
  {
    id: "follow-win",
    name: "Follow & Win",
    description: "Follow your school's social media and submit a screenshot to win daily prizes.",
    icon: <Gift className="w-8 h-8 text-primary" />,
  },
  {
    id: "reel-it-feel-it",
    name: "Reel It. Feel It.",
    description: "Create an Instagram Reel about your first days at LPU.",
    icon: <Tv className="w-8 h-8 text-primary" />,
  },
  {
    id: "my-first-day",
    name: "My First Day at LPU",
    description: "Take a selfie at the official Selfie Point and post it on Instagram.",
    icon: <Camera className="w-8 h-8 text-primary" />,
  },
];

const getCompetitionIcon = (id: string) => {
    const competition = competitionsData.find(c => c.id === id);
    return competition?.icon || <Trophy className="w-8 h-8 text-primary" />;
}

export default function WinnersPage() {
    const [winners, setWinners] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWinners = async () => {
            setIsLoading(true);
            const db = getFirestore(app);
            const submissionsCol = collection(db, "submissions");
            const q = query(submissionsCol, where("isWinner", "==", true));
            const winnerSnapshot = await getDocs(q);
            const winnerList = winnerSnapshot.docs.map(doc => {
                 const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    submittedAt: (data.submittedAt as Timestamp).toDate(),
                } as Submission;
            }).sort((a,b) => b.submittedAt.getTime() - a.submittedAt.getTime());
            setWinners(winnerList);
            setIsLoading(false);
        }
        fetchWinners();
    }, []);

    const groupedWinners = winners.reduce((acc, winner) => {
        const { competitionName } = winner;
        if (!acc[competitionName]) {
            acc[competitionName] = [];
        }
        acc[competitionName].push(winner);
        return acc;
    }, {} as Record<string, Submission[]>);


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <Header />
      <main className="flex-grow">
        <section className="container mx-auto px-4 py-12 md:py-20">
            <div className="text-center mb-12">
                <Trophy className="w-16 h-16 mx-auto text-primary animate-pulse" />
                <h1 className="text-4xl md:text-5xl font-bold font-headline mt-4">Hall of Fame</h1>
                <p className="text-lg text-muted-foreground mt-2">Celebrating the talented winners of our competitions.</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : Object.keys(groupedWinners).length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-xl text-muted-foreground">No winners have been announced yet.</p>
                    <p className="mt-2">Check back soon!</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {Object.entries(groupedWinners).map(([competitionName, competitionWinners]) => (
                        <div key={competitionName}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-card rounded-xl">
                                    {getCompetitionIcon(competitionWinners[0].competitionId)}
                                </div>
                                <h2 className="text-3xl font-bold font-headline">{competitionName}</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {competitionWinners.map(winner => (
                                    <WinnerCard key={winner.id} winner={winner} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
      </main>
    </div>
  );
}

function WinnerCard({ winner }: { winner: Submission }) {
    const identifier = winner.name || winner.registrationId || "Anonymous";
    const avatarFallback = identifier.substring(0, 2).toUpperCase();

    const renderSubmissionLink = () => {
        const link = winner.postLink || winner.redditPostLink;
        const text = winner.postLink ? "View Instagram Post" : "View Reddit Post";
        if (link) {
            return (
                <Link href={link} target="_blank" className="text-sm inline-flex items-center text-primary hover:underline">
                    {text} <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
            )
        }
        if (winner.fileUrl) {
            return (
                 <Link href={winner.fileUrl} target="_blank" className="text-sm inline-flex items-center text-primary hover:underline">
                    View Submission <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
            )
        }
        return null;
    }

    return (
        <Card className="transform hover:-translate-y-1 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-primary/20">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar>
                        {/* If we had profile images, they would go here */}
                        {/* <AvatarImage src="https://github.com/shadcn.png" /> */}
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">{avatarFallback}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-lg">{identifier}</CardTitle>
                        {winner.university && <CardDescription>{winner.university}</CardDescription>}
                        {winner.school && <CardDescription>{winner.school}</CardDescription>}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                    <Award className="w-8 h-8 mx-auto text-primary" />
                    <p className="text-sm font-semibold mt-2 text-foreground">Declared Winner</p>
                    <p className="text-xs text-muted-foreground">{winner.submittedAt.toLocaleDateString()}</p>
                </div>
            </CardContent>
            <CardFooter>
                {renderSubmissionLink()}
            </CardFooter>
        </Card>
    )
}
