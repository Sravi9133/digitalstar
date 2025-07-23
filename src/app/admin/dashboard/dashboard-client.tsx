"use client";

import type { Submission } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Download, Users, Trophy } from "lucide-react";
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
}

export function DashboardClient({ submissions, stats }: DashboardClientProps) {
    const { toast } = useToast();

    const handleDownload = () => {
        toast({
            title: "Feature not implemented",
            description: "CSV download is a placeholder for this demo.",
        });
    }

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download All as CSV
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
                        <CardTitle>{comp.name} Submissions</CardTitle>
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
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="hidden md:table-cell">University</TableHead>
          <TableHead className="hidden lg:table-cell">Submitted At</TableHead>
          <TableHead className="text-right">File</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((submission) => (
          <TableRow key={submission.id}>
            <TableCell className="font-medium">{submission.name}</TableCell>
            <TableCell>{submission.email}</TableCell>
            <TableCell className="hidden md:table-cell">{submission.university}</TableCell>
            <TableCell className="hidden lg:table-cell">{submission.submittedAt.toLocaleString()}</TableCell>
            <TableCell className="text-right">
                <Button variant="outline" size="sm" asChild>
                    <a href="#" onClick={(e) => e.preventDefault()}>
                        <Download className="mr-2 h-3 w-3" />
                        {submission.fileName}
                    </a>
                </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
