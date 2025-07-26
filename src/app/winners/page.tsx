
"use client";

import { useEffect, useState, useRef } from "react";
import type { Submission, Competition } from "@/types";
import { Header } from "@/components/header";
import { getFirestore, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Loader2, Trophy, Award, Camera, Gift, Tv, ChevronLeft, ChevronRight, Users, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { format, startOfDay, addDays, subDays, isToday } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";


const competitionsData: Omit<Competition, 'deadline' | 'icon'>[] = [
  {
    id: "follow-win",
    name: "Follow & Win (Daily winner)",
    description: "Follow your school's social media and submit a screenshot to win daily prizes.",
  },
  {
    id: "reel-it-feel-it",
    name: "Reel It. Feel It.",
    description: "Create an Instagram Reel about your first days at LPU.",
  },
  {
    id: "my-first-day",
    name: "My First Day at LPU",
    description: "Take a selfie at the official Selfie Point and post it on Instagram.",
  },
];

const getCompetitionIcon = (id: string) => {
    const competition = competitionsData.find(c => c.id === id);
    const iconName = (competition as any)?.icon || "Trophy";
    
    switch(id) {
        case "follow-win": return <Gift className="w-8 h-8 text-primary" />;
        case "reel-it-feel-it": return <Tv className="w-8 h-8 text-primary" />;
        case "my-first-day": return <Camera className="w-8 h-8 text-primary" />;
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

    const followWinWinners = winners.filter(w => w.competitionId === 'follow-win');
    const otherWinners = winners.filter(w => w.competitionId !== 'follow-win' && w.competitionId !== 'my-first-day');

    const groupedOtherWinners = otherWinners.reduce((acc, winner) => {
        const competition = competitionsData.find(c => c.id === winner.competitionId);
        const competitionName = competition?.name || winner.competitionName;
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
        <section className="container mx-auto px-4 py-12 md:py-20 flex-grow flex flex-col">
            <div className="text-center mb-12">
                <Trophy className="w-16 h-16 mx-auto text-primary animate-pulse" />
                <h1 className="text-4xl md:text-5xl font-bold font-headline mt-4">Hall of Fame</h1>
                <p className="text-lg text-muted-foreground mt-2">Celebrating the talented winners of our competitions.</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center flex-grow">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : winners.length === 0 ? (
                <div className="text-center py-20 flex-grow flex items-center justify-center">
                    <div>
                        <p className="text-xl text-muted-foreground">No winners have been announced yet.</p>
                        <p className="mt-2">Check back soon!</p>
                    </div>
                </div>
            ) : (
              <div className="flex-grow flex flex-col">
                {/* Desktop Layout: Columns */}
                <div className="hidden md:flex flex-row gap-8 h-full flex-grow items-stretch">
                    {followWinWinners.length > 0 && (
                        <FollowAndWinWinners winners={followWinWinners} />
                    )}
                    {Object.entries(groupedOtherWinners).map(([competitionName, competitionWinners]) => (
                         <div key={competitionName} className="flex-1 flex flex-col h-[70vh]">
                            <AutoScrollingWinnerList 
                                competitionName={competitionName}
                                winners={competitionWinners}
                            />
                        </div>
                    ))}
                </div>

                {/* Mobile Layout: Tabs */}
                <div className="md:hidden">
                    <Tabs defaultValue={followWinWinners.length > 0 ? "follow-win" : Object.keys(groupedOtherWinners)[0]} className="w-full">
                        <TabsList className="grid w-full grid-cols-1 h-auto sm:grid-cols-3">
                            {followWinWinners.length > 0 && (
                                <TabsTrigger value="follow-win">Follow & Win</TabsTrigger>
                            )}
                           {Object.keys(groupedOtherWinners).map((competitionName) => (
                               <TabsTrigger key={competitionName} value={competitionName} className="truncate">
                                {competitionName}
                               </TabsTrigger>
                           ))}
                        </TabsList>

                        {followWinWinners.length > 0 && (
                             <TabsContent value="follow-win">
                                <div className="mt-4">
                                  <FollowAndWinWinners winners={followWinWinners} />
                                </div>
                             </TabsContent>
                        )}
                        
                        {Object.entries(groupedOtherWinners).map(([competitionName, competitionWinners]) => (
                            <TabsContent key={competitionName} value={competitionName}>
                               <div className="h-[60vh] mt-4">
                                 <AutoScrollingWinnerList 
                                    competitionName={competitionName}
                                    winners={competitionWinners}
                                 />
                               </div>
                            </TabsContent>
                        ))}
                  </Tabs>
                </div>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

function FollowAndWinWinners({ winners }: { winners: Submission[] }) {
    const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));

    const winnersByDate = winners.reduce((acc, winner) => {
        const dateKey = startOfDay(winner.submittedAt).toISOString();
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(winner);
        return acc;
    }, {} as Record<string, Submission[]>);

    const winnersForCurrentDate = winnersByDate[currentDate.toISOString()] || [];
    
    return (
        <div className="flex flex-col flex-1 min-w-0 h-full">
             <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-card rounded-xl">
                    {getCompetitionIcon('follow-win')}
                </div>
                <h2 className="text-3xl font-bold font-headline truncate">{competitionsData.find(c=>c.id === 'follow-win')?.name}</h2>
            </div>
            
            <Card className="mb-4">
                <CardHeader className="flex-row items-center justify-between p-4">
                     <CardTitle className="text-lg">Total Winners</CardTitle>
                     <div className="flex items-center gap-2">
                         <Users className="w-6 h-6 text-primary"/>
                         <span className="text-2xl font-bold">{winners.length}</span>
                     </div>
                </CardHeader>
            </Card>

            <div className="flex items-center justify-between mb-4 gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(subDays(currentDate, 1))}>
                    <ChevronLeft className="h-4 w-4"/>
                </Button>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "justify-start text-left font-normal flex-1",
                            !currentDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {currentDate ? format(currentDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={currentDate}
                        onSelect={(day) => day && setCurrentDate(day)}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>

                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 1))} disabled={isToday(currentDate)}>
                    <ChevronRight className="h-4 w-4"/>
                </Button>
            </div>

            <ScrollArea className="flex-grow pr-4 h-[60vh]">
                <div className="space-y-4 pb-8">
                {winnersForCurrentDate.length > 0 ? (
                    winnersForCurrentDate.map((winner) => (
                        <WinnerCard key={winner.id} winner={winner} />
                    ))
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">No winners were announced on this day.</p>
                    </div>
                )}
                </div>
            </ScrollArea>
        </div>
    );
}

function AutoScrollingWinnerList({ competitionName, winners }: { competitionName: string, winners: Submission[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const isHovering = useRef(false);
    
    // Sort winners by rank for 'Reel It. Feel It.'
    const sortedWinners = winners[0]?.competitionId === 'reel-it-feel-it'
        ? [...winners].sort((a, b) => (a.rank || 4) - (b.rank || 4))
        : winners;
    
    const shouldLoop = sortedWinners.length > 3; 
    const displayWinners = shouldLoop ? [...sortedWinners, ...sortedWinners] : sortedWinners;

    useEffect(() => {
        const scrollElement = scrollRef.current;
        const contentElement = contentRef.current;
        if (!scrollElement || !contentElement || !shouldLoop) return;

        let scrollInterval: NodeJS.Timeout;

        const startScrolling = () => {
            scrollInterval = setInterval(() => {
                if (!isHovering.current && scrollElement) {
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
    }, [sortedWinners, shouldLoop]);

    return (
        <div 
            className="flex flex-col flex-1 min-w-0 h-full"
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

function getRankBadge(rank?: 1 | 2 | 3) {
    if (!rank) return null;
    const medals = ["🥇", "🥈", "🥉"];
    const text = ["1st Place", "2nd Place", "3rd Place"];
    return (
        <div className="flex items-center gap-2">
            <span className="text-2xl">{medals[rank-1]}</span>
            <span className="font-bold text-lg text-primary">{text[rank-1]}</span>
        </div>
    )
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
                {winner.rank ? (
                    <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-center">
                       {getRankBadge(winner.rank)}
                    </div>
                ) : (
                    <div className="bg-muted/50 p-3 rounded-lg text-center">
                        <Award className="w-8 h-8 mx-auto text-primary" />
                        <p className="text-sm font-semibold mt-2 text-foreground">Declared Winner</p>
                        <p className="text-xs text-muted-foreground">{winner.submittedAt.toLocaleDateString()}</p>
                    </div>
                )}
            </CardContent>
            {renderSubmissionLink() && 
                <CardFooter>
                    {renderSubmissionLink()}
                </CardFooter>
            }
        </Card>
    )
}
