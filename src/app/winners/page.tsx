
"use client";

import { useEffect, useState, useRef } from "react";
import type { Submission, Competition } from "@/types";
import { Header } from "@/components/header";
import { getFirestore, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Loader2, Trophy, Award, Camera, Gift, Tv } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink } from "lucide-react";


const competitionsData: Omit<Competition, 'deadline' | 'status'>[] = [
  {
    id: "follow-win",
    name: "Follow & Win",
    description: "Follow your school's social media and submit a screenshot to win daily prizes.",
    icon: "Gift",
  },
  {
    id: "reel-it-feel-it",
    name: "Reel It. Feel It.",
    description: "Create an Instagram Reel about your first days at LPU.",
    icon: "Tv",
  },
  {
    id: "my-first-day",
    name: "My First Day at LPU",
    description: "Take a selfie at the official Selfie Point and post it on Instagram.",
    icon: "Camera",
  },
];

const getCompetitionIcon = (id: string) => {
    const competition = competitionsData.find(c => c.id === id);
    const iconName = competition?.icon || "Trophy";
    
    switch(iconName) {
        case "Gift": return <Gift className="w-8 h-8 text-primary" />;
        case "Tv": return <Tv className="w-8 h-8 text-primary" />;
        case "Camera": return <Camera className="w-8 h-8 text-primary" />;
        default: return <Trophy className="w-8 h-8 text-primary" />;
    }
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
      <main className="flex-grow flex flex-col">
        <section className="container mx-auto px-4 py-12 md:py-20 flex flex-col flex-grow">
            <div className="text-center mb-12">
                <Trophy className="w-16 h-16 mx-auto text-primary animate-pulse" />
                <h1 className="text-4xl md:text-5xl font-bold font-headline mt-4">Hall of Fame</h1>
                <p className="text-lg text-muted-foreground mt-2">Celebrating the talented winners of our competitions.</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center flex-grow">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : Object.keys(groupedWinners).length === 0 ? (
                <div className="text-center py-20 flex-grow">
                    <p className="text-xl text-muted-foreground">No winners have been announced yet.</p>
                    <p className="mt-2">Check back soon!</p>
                </div>
            ) : (
                <div className="flex flex-1 gap-8 items-stretch -mb-8">
                    {Object.entries(groupedWinners).map(([competitionName, competitionWinners]) => (
                        <AutoScrollingWinnerList 
                            key={competitionName}
                            competitionName={competitionName}
                            winners={competitionWinners}
                        />
                    ))}
                </div>
            )}
        </section>
      </main>
    </div>
  );
}

function AutoScrollingWinnerList({ competitionName, winners }: { competitionName: string, winners: Submission[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const isHovering = useRef(false);
    
    // Only duplicate the list if it's long enough to need scrolling.
    const shouldLoop = winners.length > 3; 
    const displayWinners = shouldLoop ? [...winners, ...winners] : winners;

    useEffect(() => {
        const scrollElement = scrollRef.current;
        const contentElement = contentRef.current;
        if (!scrollElement || !contentElement || !shouldLoop) return;

        let scrollInterval: NodeJS.Timeout;

        const startScrolling = () => {
            scrollInterval = setInterval(() => {
                if (!isHovering.current && scrollElement) {
                    // When the scroll reaches the halfway point (the start of the duplicated content),
                    // reset to the top to create a seamless loop.
                    if (scrollElement.scrollTop >= contentElement.scrollHeight / 2) {
                        scrollElement.scrollTop = 0;
                    } else {
                        scrollElement.scrollTop += 1;
                    }
                }
            }, 50); 
        };

        startScrolling();

        return () => clearInterval(scrollInterval);
    }, [winners, shouldLoop]);

    return (
        <div 
            className="flex flex-col flex-1 min-w-0"
            onMouseEnter={() => { isHovering.current = true; }}
            onMouseLeave={() => { isHovering.current = false; }}
        >
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-card rounded-xl">
                    {getCompetitionIcon(winners[0].competitionId)}
                </div>
                <h2 className="text-3xl font-bold font-headline truncate">{competitionName}</h2>
            </div>
            <ScrollArea className="flex-grow h-0 pr-4" viewportRef={scrollRef}>
                <div className="space-y-4 pb-8" ref={contentRef}>
                    {displayWinners.map((winner, index) => (
                        <WinnerCard key={`${winner.id}-${index}`} winner={winner} />
                    ))}
                </div>
            </ScrollArea>
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
