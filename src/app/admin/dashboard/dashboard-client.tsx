
"use client";

import type { Submission } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Download, Users, Trophy } from "lucide-react";
import Link from "next/link";

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
}

// Helper function to convert data to CSV and trigger download
const downloadAsCSV = (data: Submission[], fileName: string) => {
    if (data.length === 0) {
        alert("No data to download.");
        return;
    }

    // Define the headers for the CSV file
    const headers = [
        "competitionName", "submittedAt", "name", "email", "phone", "university",
        "registrationId", "instagramHandle", "school", "postLink", "fileName", "fileUrl"
    ];

    // Create the CSV header row
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";

    // Map data to CSV rows
    data.forEach(submission => {
        const row = headers.map(header => {
            let value = submission[header as keyof Submission] as string | Date | undefined;
            if (value === undefined || value === null) {
                return "";
            }
            if (value instanceof Date) {
                value = value.toISOString();
            }
            // Escape commas and quotes
            const stringValue = String(value);
            if (stringValue.includes(',')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(",");
        csvContent += row + "\n";
    });

    // Create a link and trigger the download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


export function DashboardClient({ submissions, stats }: DashboardClientProps) {

    const handleDownloadAll = () => {
        downloadAsCSV(submissions, "all_submissions");
    }

    const handleDownloadCompetition = (competitionId: string, competitionName: string) => {
        const competitionSubmissions = submissions.filter(s => s.competitionId === competitionId);
        downloadAsCSV(competitionSubmissions, competitionName.replace(/ /g, "_"));
    }

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleDownloadAll}>
            <Download className="mr-2 h-4 w-4" />
            download all
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
                                Download CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <SubmissionsTable submissions={submissions.filter(s => s.competitionId === comp.id)} />
                    </CardContent>
                </Card>
            </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

function SubmissionsTable({ submissions }: { submissions: Submission[] }) {
    if (submissions.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No submissions for this competition yet.</p>
    }

    const getSubmissionIdentifier = (submission: Submission) => {
        return submission.name || submission.email || submission.registrationId || "N/A";
    }

    const getSubmissionSecondaryInfo = (submission: Submission) => {
        if (submission.email) return submission.email;
        if (submission.instagramHandle) return submission.instagramHandle;
        if (submission.postLink) return <Link href={submission.postLink} target="_blank" className="text-primary hover:underline truncate block max-w-xs">{submission.postLink}</Link>;
        return "N/A";
    }
    
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Identifier</TableHead>
          <TableHead>Contact / Link</TableHead>
          <TableHead className="hidden md:table-cell">Details</TableHead>
          <TableHead className="hidden lg:table-cell">Submitted At</TableHead>
          <TableHead className="text-right">File</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((submission) => (
          <TableRow key={submission.id}>
            <TableCell className="font-medium">{getSubmissionIdentifier(submission)}</TableCell>
            <TableCell>{getSubmissionSecondaryInfo(submission)}</TableCell>
            <TableCell className="hidden md:table-cell">{submission.university || submission.school || 'N/A'}</TableCell>
            <TableCell className="hidden lg:table-cell">{submission.submittedAt.toLocaleString()}</TableCell>
            <TableCell className="text-right">
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
