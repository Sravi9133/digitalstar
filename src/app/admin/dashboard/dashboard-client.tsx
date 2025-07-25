
"use client";

import type { Submission } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Download, Users, Trophy, Award } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

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
  onMarkAsWinner: (submission: Submission) => Promise<{success: boolean; message: string}>;
}

// Helper function to convert data to XLSX and trigger download
const downloadAsXLSX = (data: Submission[], fileName: string) => {
    if (data.length === 0) {
        alert("No data to download.");
        return;
    }

    // Define the headers for the Excel file
    const headers = [
        "competitionName", "submittedAt", "name", "email", "phone", "university",
        "registrationId", "instagramHandle", "school", "postLink", "redditPostLink", "fileName", "fileUrl", "isWinner"
    ];

    // Create a new workbook and a worksheet
    const workbook = XLSX.utils.book_new();
    
    // Format data for the worksheet
    const worksheetData = data.map(submission => {
        const row: { [key: string]: any } = {};
        headers.forEach(header => {
            let value = submission[header as keyof Submission] as string | Date | boolean | undefined;
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

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, { header: headers });

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    // Generate XLSX file and trigger download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}


export function DashboardClient({ submissions, stats, onMarkAsWinner }: DashboardClientProps) {

    const handleDownloadAll = () => {
        downloadAsXLSX(submissions, "all_submissions");
    }

    const handleDownloadCompetition = (competitionId: string, competitionName: string) => {
        const competitionSubmissions = submissions.filter(s => s.competitionId === competitionId);
        downloadAsXLSX(competitionSubmissions, competitionName.replace(/ /g, "_"));
    }

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
        <div className="flex items-center space-x-2">
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
        {stats.submissionsPerCompetition.map(comp => (
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
                    <CardContent>
                        <SubmissionsTable 
                            submissions={submissions.filter(s => s.competitionId === comp.id)} 
                            onMarkAsWinner={onMarkAsWinner} 
                        />
                    </CardContent>
                </Card>
            </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

function SubmissionsTable({ submissions, onMarkAsWinner }: { submissions: Submission[], onMarkAsWinner: (submission: Submission) => Promise<{success: boolean; message: string}> }) {
    const { toast } = useToast();
    if (submissions.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No submissions for this competition yet.</p>
    }

    const getSubmissionIdentifier = (submission: Submission) => {
        return submission.name || submission.registrationId || submission.email || "N/A";
    }

    const handleMarkAsWinner = async (submission: Submission) => {
        try {
            const result = await onMarkAsWinner(submission);
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Identifier</TableHead>
          <TableHead className="hidden md:table-cell">Details</TableHead>
          <TableHead>Links</TableHead>
          <TableHead className="hidden lg:table-cell">Submitted At</TableHead>
          <TableHead>File</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((submission) => (
          <TableRow key={submission.id} className={submission.isWinner ? 'bg-primary/10' : ''}>
            <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                    {submission.isWinner && <Award className="h-4 w-4 text-primary" />}
                    {getSubmissionIdentifier(submission)}
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
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMarkAsWinner(submission)}
                    disabled={submission.isWinner}
                >
                    <Award className="mr-2 h-3 w-3" />
                    {submission.isWinner ? 'Winner' : 'Mark as Winner'}
                </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
