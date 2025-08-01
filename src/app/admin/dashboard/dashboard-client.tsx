
"use client";

import type { CompetitionMeta, Submission, Announcement } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Download, Users, Trophy, Award, ChevronDown, Calendar as CalendarIcon, Link2, Filter, Trash2, PlusCircle, ExternalLink, Megaphone } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { addDoc, collection, deleteDoc, doc, getFirestore, serverTimestamp, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";


interface DashboardClientProps {
  submissions: Submission[];
  stats: {
    totalSubmissions: number;
    submissionsPerCompetition: {
      id: string;
      name: string;
      count: number;
    }[];
  };
  announcements: Announcement[];
  onMarkAsWinner: (submission: Submission, rank?: 1 | 2 | 3) => Promise<{success: boolean; message: string}>;
  onDeleteSubmissions: (ids: string[]) => Promise<{success: boolean; message: string}>;
  reelItFeelItMeta: CompetitionMeta | null;
  onSetReelItFeelItDate: (date: Date) => Promise<{success: boolean; message: string}>;
  refSources: string[];
  refFilter: string;
  onRefFilterChange: (value: string) => void;
  onRefreshAnnouncements: () => void;
}

// Helper function to convert data to XLSX and trigger download
const downloadAsXLSX = (data: Submission[], fileName: string, customHeaders?: string[]) => {
    if (data.length === 0) {
        alert("No data to download.");
        return;
    }

    // Define the headers for the Excel file
    const headers = customHeaders || [
        "competitionName", "submittedAt", "name", "email", "phone", "university",
        "registrationId", "instagramHandle", "school", "postLink", "redditPostLink", "fileName", "fileUrl", "isWinner", "rank", "refSource"
    ];

    // Create a new workbook and a worksheet
    const workbook = XLSX.utils.book_new();
    
    // Format data for the worksheet
    const worksheetData = data.map((submission, index) => {
        const row: { [key: string]: any } = {'S.No.': index + 1};
        headers.forEach(header => {
            let value = submission[header as keyof Submission] as string | Date | boolean | number | undefined;
            if (value === undefined || value === null) {
                row[header] = "";
            } else if (value instanceof Date) {
                row[header] = value.toLocaleString();
            } else {
                row[header] = value;
            }
        });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, { header: ['S.No.', ...headers] });

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    // Generate XLSX file and trigger download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}


export function DashboardClient({ 
    submissions, 
    stats,
    announcements,
    onMarkAsWinner,
    onDeleteSubmissions,
    reelItFeelItMeta, 
    onSetReelItFeelItDate,
    refSources,
    refFilter,
    onRefFilterChange,
    onRefreshAnnouncements,
 }: DashboardClientProps) {
    const { toast } = useToast();
    const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);

    const handleDownloadAll = () => {
        downloadAsXLSX(submissions, "all_submissions");
    }

    const handleDownloadCompetition = (competitionId: string, competitionName: string) => {
        const competitionSubmissions = submissions.filter(s => s.competitionId === competitionId);
        let headers;
        if (competitionId === 'follow-win') {
            headers = ["competitionName", "submittedAt", "registrationId", "instagramHandle", "school", "isWinner", "refSource"];
        } else if (competitionId === 'reel-it-feel-it') {
            headers = ["competitionName", "submittedAt", "registrationId", "postLink", "redditPostLink", "isWinner", "rank", "refSource"];
        } else if (competitionId === 'my-first-day') {
            headers = ["competitionName", "submittedAt", "registrationId", "postLink", "redditPostLink", "isWinner", "rank", "refSource"];
        }
        downloadAsXLSX(competitionSubmissions, competitionName.replace(/ /g, "_"), headers);
    }
    
    const handleDelete = async () => {
        const result = await onDeleteSubmissions(selectedSubmissionIds);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setSelectedSubmissionIds([]);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    }

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
        <div className="flex items-center space-x-2">
           <Select value={refFilter} onValueChange={onRefFilterChange}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Referrals</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                {refSources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSubmissionIds.length > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedSubmissionIds.length})
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {selectedSubmissionIds.length} submission(s).
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Confirm Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          <Button onClick={handleDownloadAll}>
            <Download className="mr-2 h-4 w-4" />
            download sheet
          </Button>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {stats.submissionsPerCompetition.map(comp => (
            <TabsTrigger key={comp.id} value={comp.id}>{comp.name}</TabsTrigger>
          ))}
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                <p className="text-xs text-muted-foreground">Across all competitions</p>
              </CardContent>
            </Card>
            {stats.submissionsPerCompetition.map(comp => (
                <Card key={comp.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium truncate">{comp.name}</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{comp.count}</div>
                        <p className="text-xs text-muted-foreground">Total entries</p>
                    </CardContent>
                </Card>
            ))}
             <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Competitions</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.submissionsPerCompetition.length}</div>
                 <p className="text-xs text-muted-foreground">Currently open</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {stats.submissionsPerCompetition.map(comp => {
            const competitionSubmissions = submissions.filter(s => s.competitionId === comp.id);
            return (
                <TabsContent key={comp.id} value={comp.id} className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{comp.name} Submissions</CardTitle>
                                 <Button onClick={() => handleDownloadCompetition(comp.id, comp.name)} variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download XLSX
                                </Button>
                            </div>
                        </CardHeader>
                        {comp.id === 'reel-it-feel-it' && (
                            <CardContent>
                                <ResultDateManager 
                                    meta={reelItFeelItMeta}
                                    onSetDate={onSetReelItFeelItDate}
                                />
                            </CardContent>
                        )}
                        <CardContent>
                            <SubmissionsTable 
                                submissions={competitionSubmissions}
                                onMarkAsWinner={onMarkAsWinner} 
                                competitionId={comp.id}
                                selectedSubmissionIds={selectedSubmissionIds}
                                setSelectedSubmissionIds={setSelectedSubmissionIds}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            )
        })}
        <TabsContent value="announcements" className="space-y-4">
            <AnnouncementsManager 
                announcements={announcements}
                onRefresh={onRefreshAnnouncements}
            />
        </TabsContent>
      </Tabs>
    </>
  );
}

const announcementFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  message: z.string().min(10, "Message must be at least 10 characters long."),
  link: z.string().url("Please enter a valid URL.").or(z.literal('')).optional(),
  isActive: z.boolean().default(true),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

interface AnnouncementsManagerProps {
    announcements: Announcement[];
    onRefresh: () => void;
}

function AnnouncementsManager({ announcements, onRefresh }: AnnouncementsManagerProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const db = getFirestore(app);

    const form = useForm<AnnouncementFormValues>({
        resolver: zodResolver(announcementFormSchema),
        defaultValues: {
            title: "",
            message: "",
            link: "",
            isActive: true,
        },
    });

    const onSubmit = async (values: AnnouncementFormValues) => {
        setIsSubmitting(true);
        try {
            const announcementsCol = collection(db, 'announcements');
            const docData = {
                ...values,
                createdAt: serverTimestamp(),
            };
            await addDoc(announcementsCol, docData);
            
            toast({ title: "Success", description: "Announcement created successfully." });
            form.reset();
            onRefresh(); // Refresh the list
        } catch (error) {
            console.error("Error creating announcement:", error);
            toast({ title: "Error", description: "Failed to create announcement.", variant: "destructive" });
        }
        setIsSubmitting(false);
    }
    
    const handleDelete = async (id: string) => {
        try {
            const docRef = doc(db, 'announcements', id);
            await deleteDoc(docRef);
            toast({ title: "Success", description: "Announcement deleted." });
            onRefresh();
        } catch (error) {
            console.error("Error deleting announcement:", error);
            toast({ title: "Error", description: "Failed to delete announcement.", variant: "destructive" });
        }
    }

    const handleToggle = async (id: string, isActive: boolean) => {
        try {
            const docRef = doc(db, 'announcements', id);
            await updateDoc(docRef, { isActive });
            toast({ title: "Success", description: `Announcement ${isActive ? 'activated' : 'deactivated'}.` });
            onRefresh();
        } catch (error) {
            console.error("Error updating announcement:", error);
            toast({ title: "Error", description: "Failed to update announcement status.", variant: "destructive" });
        }
    }

    return (
        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Create Announcement</CardTitle>
                        <CardDescription>This will be displayed to all users on the homepage.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl><Input placeholder="e.g., New Competition Live!" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="message" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Message</FormLabel>
                                        <FormControl><Textarea placeholder="Describe the announcement..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="link" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Link (Optional)</FormLabel>
                                        <FormControl><Input placeholder="https://example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="isActive" render={({ field }) => (
                                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Active</FormLabel>
                                            <CardDescription>
                                                Publish this announcement immediately.
                                            </CardDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}/>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Announcement
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Announcements</CardTitle>
                        <CardDescription>View, activate, or delete existing announcements.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {announcements.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Megaphone className="mx-auto h-12 w-12" />
                                <p className="mt-4">No announcements found.</p>
                            </div>
                       ) : (
                        <div className="space-y-4">
                            {announcements.map(ann => (
                                <Card key={ann.id} className="flex items-center justify-between p-4">
                                    <div className="space-y-1 overflow-hidden">
                                        <p className="font-semibold truncate">{ann.title}</p>
                                        <p className="text-sm text-muted-foreground truncate">{ann.message}</p>
                                        {ann.link && (
                                            <Link href={ann.link} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1">
                                                <ExternalLink className="h-3 w-3" /> {ann.link}
                                            </Link>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 ml-4">
                                        <Switch
                                            checked={ann.isActive}
                                            onCheckedChange={(checked) => handleToggle(ann.id, checked)}
                                            aria-label="Toggle announcement active state"
                                        />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the announcement titled "{ann.title}".
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(ann.id)}>Confirm Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </Card>
                            ))}
                        </div>
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

interface ResultDateManagerProps {
    meta: CompetitionMeta | null;
    onSetDate: (date: Date) => Promise<{success: boolean; message: string}>;
}

function ResultDateManager({ meta, onSetDate }: ResultDateManagerProps) {
    const [date, setDate] = useState<Date | undefined>(meta?.resultAnnouncementDate);
    const { toast } = useToast();

    const handleSetDate = async () => {
        if (!date) {
            toast({ title: "Error", description: "Please select a date.", variant: "destructive" });
            return;
        }
        const result = await onSetDate(date);
        toast({
            title: result.success ? "Success" : "Error",
            description: result.message,
            variant: result.success ? "default" : "destructive",
        });
    }

    return (
        <Card className="mb-6 bg-muted/50">
            <CardHeader>
                <CardTitle className="text-lg">Result Announcement</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-4">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className="w-full md:w-auto justify-start text-left font-normal"
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
                <Button onClick={handleSetDate}>Set Announcement Date</Button>
                {meta?.resultAnnouncementDate && (
                    <p className="text-sm text-muted-foreground">
                        Currently set to: {format(meta.resultAnnouncementDate, "PPP")}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}


interface SubmissionsTableProps {
    submissions: Submission[];
    onMarkAsWinner: (submission: Submission, rank?: 1 | 2 | 3) => Promise<{success: boolean; message: string}>;
    competitionId: string;
    selectedSubmissionIds: string[];
    setSelectedSubmissionIds: React.Dispatch<React.SetStateAction<string[]>>;
}

function SubmissionsTable({ submissions, onMarkAsWinner, competitionId, selectedSubmissionIds, setSelectedSubmissionIds }: SubmissionsTableProps) {
    const { toast } = useToast();

    if (submissions.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No submissions for this competition yet.</p>
    }

    const getSubmissionIdentifier = (submission: Submission) => {
        return submission.name || submission.registrationId || submission.email || "N/A";
    }

    const handleMarkAsWinner = async (submission: Submission, rank?: 1 | 2 | 3) => {
        try {
            const result = await onMarkAsWinner(submission, rank);
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Submission marked as winner."
                });
            } else {
                 toast({
                    title: "Action Failed",
                    description: result.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive"
            });
            console.error(error);
        }
    }
    
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const submissionIds = submissions.map(s => s.id);
            setSelectedSubmissionIds(prev => [...new Set([...prev, ...submissionIds])]);
        } else {
            const submissionIds = submissions.map(s => s.id);
            setSelectedSubmissionIds(prev => prev.filter(id => !submissionIds.includes(id)));
        }
    };
    
    const isAllSelected = submissions.length > 0 && submissions.every(s => selectedSubmissionIds.includes(s.id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead>S.No.</TableHead>
          <TableHead>Identifier</TableHead>
          <TableHead className="hidden md:table-cell">Details</TableHead>
          <TableHead>Links</TableHead>
          <TableHead>Referral</TableHead>
          <TableHead className="hidden lg:table-cell">Submitted At</TableHead>
          <TableHead>File</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((submission, index) => (
          <TableRow key={submission.id} className={submission.isWinner ? 'bg-primary/10' : ''} data-state={selectedSubmissionIds.includes(submission.id) && "selected"}>
            <TableCell>
              <Checkbox
                checked={selectedSubmissionIds.includes(submission.id)}
                onCheckedChange={(checked) => {
                  return checked
                    ? setSelectedSubmissionIds([...selectedSubmissionIds, submission.id])
                    : setSelectedSubmissionIds(selectedSubmissionIds.filter((id) => id !== submission.id))
                }}
                aria-label={`Select submission ${index + 1}`}
              />
            </TableCell>
            <TableCell>{index + 1}</TableCell>
            <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                    {submission.isWinner && <Award className="h-4 w-4 text-primary" />}
                    {getSubmissionIdentifier(submission)}
                    {submission.rank && <span className="text-xs font-bold text-primary">({submission.rank}st)</span>}
                </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                <div className="flex flex-col">
                    <span>{submission.email || submission.instagramHandle || 'N/A'}</span>
                    <span className="text-sm text-muted-foreground">{submission.university || submission.school || ''}</span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-1">
                    {submission.postLink && (
                        <Link href={submission.postLink} target="_blank" className="text-primary hover:underline truncate block max-w-[150px]">
                           Instagram Post
                        </Link>
                    )}
                    {submission.redditPostLink && (
                        <Link href={submission.redditPostLink} target="_blank" className="text-primary hover:underline truncate block max-w-[150px]">
                            Reddit Post
                        </Link>
                    )}
                </div>
            </TableCell>
            <TableCell>
                {submission.refSource ? (
                    <Badge variant="secondary" className="whitespace-nowrap">
                        <Link2 className="mr-1.5 h-3 w-3"/>
                        {submission.refSource}
                    </Badge>
                ) : (
                    <span className="text-xs text-muted-foreground">Direct</span>
                )}
            </TableCell>
            <TableCell className="hidden lg:table-cell">{submission.submittedAt.toLocaleString()}</TableCell>
            <TableCell>
                {submission.fileUrl && submission.fileName ? (
                    <Button variant="outline" size="sm" asChild>
                        <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-3 w-3" />
                            {submission.fileName}
                        </a>
                    </Button>
                ) : (
                    <span className="text-xs text-muted-foreground">No file</span>
                )}
            </TableCell>
            <TableCell className="text-right">
                {competitionId === 'reel-it-feel-it' ? (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={submission.isWinner}>
                                {submission.isWinner ? `Winner (${submission.rank})` : 'Declare Rank'}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleMarkAsWinner(submission, 1)}>
                                <Award className="mr-2 h-3 w-3" />
                                Mark as 1st
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkAsWinner(submission, 2)}>
                                <Award className="mr-2 h-3 w-3" />
                                Mark as 2nd
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleMarkAsWinner(submission, 3)}>
                                <Award className="mr-2 h-3 w-3" />
                                Mark as 3rd
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleMarkAsWinner(submission)}
                        disabled={submission.isWinner}
                    >
                        <Award className="mr-2 h-3 w-3" />
                        {submission.isWinner ? 'Winner' : 'Mark as Winner'}
                    </Button>
                )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
