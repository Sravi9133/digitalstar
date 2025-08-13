
"use client";

import { useEffect, useState, useMemo } from "react";
import type { Competition, CompetitionMeta, CuratedWinner } from "@/types";
import { Header } from "@/components/header";
import { getFirestore, doc, updateDoc, collection, getDocs, query, where, Timestamp, getDoc, writeBatch } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Loader2, Trophy, Award, Camera, Gift, Tv, ChevronLeft, ChevronRight, Users, CalendarIcon, Trash2, Search } from "lucide-react";
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
import ReactConfetti from "react-confetti";
import { useWindowSize } from '@/hooks/use-window-size';
import { Input } from "@/components/ui/input";


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
    const [showConfetti, setShowConfetti] = useState(false);
    const { width, height } = useWindowSize();
    const [searchQuery, setSearchQuery] = useState("");

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
        if (winnerList.some(comp => comp.winners.length > 0)) {
            setShowConfetti(true);
        }
    }

    useEffect(() => {
        fetchWinners();
    }, []);

    const filteredWinnersData = useMemo(() => {
        if (!searchQuery) {
            return allWinnersData;
        }
        return allWinnersData
            .map(comp => ({
                ...comp,
                winners: comp.winners.filter(winner => 
                    String(winner['REG NO']).toLowerCase().includes(searchQuery.toLowerCase())
                )
            }))
            .filter(comp => comp.winners.length > 0);
    }, [allWinnersData, searchQuery]);

    const hasWinners = filteredWinnersData.some(comp => comp.winners.length > 0);
    const hasInitialData = allWinnersData.some(comp => comp.winners.length > 0);

  return (
    <>
    {showConfetti && <ReactConfetti width={width} height={height} recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 z-0 animate-gradient-bg bg-gradient-to-br from-background via-primary/10 to-accent/10"></div>
        <div className="relative z-10 flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow flex flex-col">
                <section className="container mx-auto px-4 py-12 md:py-20 flex-grow flex flex-col">
                    <div className="text-center mb-8">
                        <Trophy className="w-16 h-16 mx-auto text-primary animate-pulse drop-shadow-lg" />
                        <h1 className="text-4xl md:text-5xl font-bold font-headline mt-4 animate-text-shimmer bg-clip-text text-transparent bg-gradient-to-r from-primary via-foreground to-primary">Hall of Fame</h1>
                        <p className="text-lg text-muted-foreground mt-2">Celebrating the talented winners of our competitions.</p>
                    </div>

                    {hasInitialData && (
                         <div className="w-full max-w-md mx-auto mb-8">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search by Registration No..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                         </div>
                    )}

                    {isLoading ? (
                        <div className="flex items-center justify-center flex-grow">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    ) : !hasInitialData ? (
                        <div className="text-center py-20 flex-grow flex items-center justify-center">
                            <div>
                                <p className="text-xl text-muted-foreground">No winners have been announced yet.</p>
                                <p className="mt-2">Check back soon!</p>
                            </div>
                        </div>
                    ) : !hasWinners && searchQuery ? (
                        <div className="text-center py-20 flex-grow flex items-center justify-center">
                            <div>
                                <p className="text-xl text-muted-foreground">No winners found for "{searchQuery}".</p>
                                <p className="mt-2">Try a different registration number.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow">
                            <Tabs defaultValue={filteredWinnersData.find(c => c.winners.length > 0)?.id} className="w-full">
                                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 h-auto">
                                {filteredWinnersData.map((competition) => {
                                    if (competition.winners.length === 0) return null;
                                    return (
                                    <TabsTrigger key={competition.id} value={competition.id} className="truncate">
                                        {competition.name}
                                    </TabsTrigger>
                                    )
                                }).filter(Boolean)}
                                </TabsList>
                                
                                {filteredWinnersData.map((competition) => {
                                if (competition.winners.length === 0) return null;
                                return (
                                    <TabsContent key={competition.id} value={competition.id} className="mt-8">
                                    <WinnerDisplay winners={competition.winners} searchQuery={searchQuery} />
                                    </TabsContent>
                                )
                                })}
                        </Tabs>
                        </div>
                    )}
                </section>
            </main>
        </div>
    </div>
    </>
  );
}

interface WinnerDisplayProps {
    winners: CuratedWinner[];
    searchQuery: string;
}

function WinnerDisplay({ winners, searchQuery }: WinnerDisplayProps) {
    const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));

    const winnersByDate = useMemo(() => winners.reduce((acc, winner) => {
        let dateKey;
        if (typeof winner.DATE === 'string') {
            const formats = ['dd-MM-yyyy', 'dd/MM/yyyy', 'MM/dd/yyyy', 'MM-dd-yyyy', 'yyyy-MM-dd'];
            let parsedDate: Date | null = null;

            for (const format of formats) {
                try {
                    const date = parseDate(winner.DATE, format, new Date());
                    if (!isNaN(date.getTime())) {
                        parsedDate = date;
                        break;
                    }
                } catch (e) { /* Ignore parsing errors for this format */ }
            }

            if (!parsedDate) {
                 const fallbackParsedDate = new Date(winner.DATE);
                 if(!isNaN(fallbackParsedDate.getTime())) {
                    parsedDate = fallbackParsedDate;
                 }
            }

            if (parsedDate) {
                dateKey = startOfDay(parsedDate).toISOString();
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
    }, {} as Record<string, CuratedWinner[]>), [winners]);


    const winnersForCurrentDate = winnersByDate[currentDate.toISOString()] || [];
    
    // If there's a search query, just display all results flatly, ignoring date.
    if (searchQuery) {
        return (
            <div className="space-y-4 pb-8">
                {winners.map((winner, index) => (
                     <Card key={`${winner['REG NO']}-${index}`} className="shadow-lg bg-card/50 backdrop-blur-sm border-primary/20 overflow-hidden relative transition-all duration-300 hover:border-primary/50 hover:shadow-primary/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50"></div>
                         <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                        <CardHeader className="relative z-10">
                            <div className="flex items-center gap-4">
                                 <div className="relative flex items-center justify-center w-10 h-10">
                                    <Trophy className="w-10 h-10 text-primary/50" />
                                    <span className="absolute text-sm font-bold text-foreground">{index + 1}</span>
                                </div>
                                 <Avatar>
                                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                        {(String(winner['REG NO']) || 'W').substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-xl font-bold">{winner['REG NO']}</CardTitle>
                                    <CardDescription className="font-medium">{winner.SCHOOL}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-w-0 h-full">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(subDays(currentDate, 1))}>
                        <ChevronLeft className="h-4 w-4"/>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 1))} disabled={isFuture(addDays(currentDate,1))}>
                        <ChevronRight className="h-4 w-4"/>
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Choose Submission Date:</span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            size="sm"
                            variant={"outline"}
                            className={cn(
                                "w-[200px] justify-start text-left font-normal",
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
                </div>
            </div>
            
            <ScrollArea className="flex-grow pr-4 h-[60vh]">
                <div className="space-y-4 pb-8">
                {winnersForCurrentDate.length > 0 ? (
                    winnersForCurrentDate.map((winner, index) => (
                        <Card key={`${winner['REG NO']}-${index}`} className="shadow-lg bg-card/50 backdrop-blur-sm border-primary/20 overflow-hidden relative transition-all duration-300 hover:border-primary/50 hover:shadow-primary/20">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50"></div>
                             <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center gap-4">
                                     <div className="relative flex items-center justify-center w-10 h-10">
                                        <Trophy className="w-10 h-10 text-primary/50" />
                                        <span className="absolute text-sm font-bold text-foreground">{index + 1}</span>
                                    </div>
                                     <Avatar>
                                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                            {(String(winner['REG NO']) || 'W').substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-xl font-bold">{winner['REG NO']}</CardTitle>
                                        <CardDescription className="font-medium">{winner.SCHOOL}</CardDescription>
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

