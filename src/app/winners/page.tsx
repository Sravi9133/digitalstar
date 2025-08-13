
"use client";

import { useEffect, useState, useRef } from "react";
import type { Submission, Competition, CompetitionMeta, CuratedWinner } from "@/types";
import { Header } from "@/components/header";
import { getFirestore, doc, updateDoc, collection, getDocs, query, where, Timestamp, getDoc, writeBatch } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Loader2, Trophy, Award, Camera, Gift, Tv, ChevronLeft, ChevronRight, Users, CalendarIcon, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { format, startOfDay, addDays, subDays, isToday, isFuture, parse as parseDate } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


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

interface WinnerData {
    id: string; // Corresponds to competitionId
    name: string;
    winners: CuratedWinner[];
}

export default function WinnersPage() {
    const [allWinnersData, setAllWinnersData] = useState<WinnerData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWinners = async () => {
        setIsLoading(true);
        const db = getFirestore(app);
        const winnersCol = collection(db, "winners");
        const winnerSnapshot = await getDocs(winnersCol);

        const winnerList: WinnerData[] = winnerSnapshot.docs.map(doc => {
            const competition = competitionsData.find(c => c.id === doc.id);
            return {
                id: doc.id,
                name: competition?.name || doc.id,
                winners: doc.data().data as CuratedWinner[],
            }
        });
        
        setAllWinnersData(winnerList);
        setIsLoading(false);
    }

    useEffect(() => {
        fetchWinners();
    }, []);

    const hasWinners = allWinnersData.some(comp => comp.winners.length > 0);

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
            ) : !hasWinners ? (
                <div className="text-center py-20 flex-grow flex items-center justify-center">
                    <div>
                        <p className="text-xl text-muted-foreground">No winners have been announced yet.</p>
                        <p className="mt-2">Check back soon!</p>
                    </div>
                </div>
            ) : (
                <div className="flex-grow">
                    <Tabs defaultValue={allWinnersData.find(c => c.winners.length > 0)?.id} className="w-full">
                        <TabsList className="grid w-full grid-cols-1 h-auto sm:grid-cols-3">
                           {allWinnersData.map((competition) => {
                             if (competition.winners.length === 0) return null;
                             return (
                               <TabsTrigger key={competition.id} value={competition.id} className="truncate">
                                {competition.name}
                               </TabsTrigger>
                             )
                           }).filter(Boolean)}
                        </TabsList>
                        
                        {allWinnersData.map((competition) => {
                           if (competition.winners.length === 0) return null;
                           return (
                            <TabsContent key={competition.id} value={competition.id} className="mt-8">
                               <WinnerDisplay winners={competition.winners} />
                            </TabsContent>
                           )
                        })}
                  </Tabs>
                </div>
            )}
        </section>
      </main>
    </div>
  );
}

interface WinnerDisplayProps {
    winners: CuratedWinner[];
}

function WinnerDisplay({ winners }: WinnerDisplayProps) {
    const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));

    const winnersByDate = winners.reduce((acc, winner) => {
        let dateKey;
        // The date from XLSX is a string, often in "dd/MM/yyyy" format.
        if (typeof winner.DATE === 'string') {
            // Use date-fns to parse the specific format.
            // It's more reliable than new Date() for non-standard formats.
            const parsedDate = parseDate(winner.DATE, 'dd/MM/yyyy', new Date());
            if (!isNaN(parsedDate.getTime())) {
                dateKey = startOfDay(parsedDate).toISOString();
            } else {
                 // Fallback for other potential standard formats
                 const fallbackParsedDate = new Date(winner.DATE);
                 if(!isNaN(fallbackParsedDate.getTime())) {
                    dateKey = startOfDay(fallbackParsedDate).toISOString();
                 }
            }
        } else if (winner.DATE instanceof Date) {
            dateKey = startOfDay(winner.DATE).toISOString();
        } else if (winner.DATE && (winner.DATE as any).toDate) { // Firebase Timestamp
            dateKey = startOfDay((winner.DATE as any).toDate()).toISOString();
        }
        
        if (dateKey) {
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(winner);
        }

        return acc;
    }, {} as Record<string, CuratedWinner[]>);


    const winnersForCurrentDate = winnersByDate[currentDate.toISOString()] || [];

    return (
        <div className="flex flex-col flex-1 min-w-0 h-full">
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

                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 1))} disabled={isFuture(addDays(currentDate,1))}>
                    <ChevronRight className="h-4 w-4"/>
                </Button>
            </div>
            
            <ScrollArea className="flex-grow pr-4 h-[60vh]">
                <div className="space-y-4 pb-8">
                {winnersForCurrentDate.length > 0 ? (
                    winnersForCurrentDate.map((winner, index) => (
                        <Card key={`${winner['REG NO']}-${index}`} className="shadow-lg">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                     <Avatar>
                                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                            {(String(winner['REG NO']) || 'W').substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-lg">{winner['REG NO']}</CardTitle>
                                        <CardDescription>{winner.SCHOOL}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
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
