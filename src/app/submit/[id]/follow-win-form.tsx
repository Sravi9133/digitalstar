
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Check, CheckCircle, Loader2, Link as LinkIcon, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { app } from "@/lib/firebase";
import { getFirestore, collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { Checkbox } from "@/components/ui/checkbox";
import { writeToGoogleSheet } from "./actions";

interface School {
    id: string;
    name: string;
    link: string;
}

const formSchema = z.object({
  registrationId: z.string().min(5, "Registration/Candidate ID is required."),
  instagramHandle: z.string().min(3, "Instagram handle/link is required."),
  school: z.string({
    required_error: "Please select a school.",
  }),
  followedSubreddit: z.literal<boolean>(true, {
    errorMap: () => ({ message: "You must confirm you have followed the subreddits." }),
  }),
});

type FollowWinFormValues = z.infer<typeof formSchema>;

interface FollowWinFormProps {
  competitionId: string;
  competitionName: string;
}

export function FollowWinForm({ competitionId, competitionName }: FollowWinFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedSchoolUrl, setSelectedSchoolUrl] = useState<string | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    async function fetchSchools() {
      try {
        const response = await fetch('/social_ink.json');
        if (!response.ok) {
          throw new Error('Failed to fetch school data');
        }
        const data = await response.json();
        
        const schoolData = data["Account Links"];

        if (Array.isArray(schoolData)) {
            const formattedSchools = schoolData.map((item: any) => ({
                id: String(item["Sr. No"]),
                name: item["School"],
                link: item["Instagram"],
            }));
            setSchools(formattedSchools);
        } else {
            throw new Error("School data is not in the expected format.");
        }
      } catch (error) {
        console.error(error);
        setSchools([]); 
        toast({
          title: "Error",
          description: "Could not load school list. Please try again later.",
          variant: "destructive"
        })
      } finally {
        setIsLoadingSchools(false);
      }
    }
    fetchSchools();
  }, [toast]);
  
  const form = useForm<FollowWinFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        registrationId: "",
        instagramHandle: "",
    }
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    if (query.length > 0) {
      const filtered = schools.filter(school => 
        school.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSchools(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSchools([]);
      setShowSuggestions(false);
    }
    form.setValue("school", "");
    setSelectedSchoolUrl(null);
  };

  const handleSchoolSelect = (school: School) => {
    setSearchTerm(school.name);
    form.setValue("school", school.id);
    setSelectedSchoolUrl(school.link || null);
    setShowSuggestions(false);
  }

  async function onSubmit(values: FollowWinFormValues) {
    setIsSubmitting(true);
    const selectedSchool = schools.find(s => s.id === values.school);

    try {
        const db = getFirestore(app);
        
        const submissionBaseData = {
          competitionId,
          competitionName,
          ...values,
          school: selectedSchool?.name,
          schoolLink: selectedSchool?.link,
        };

        const firestoreData: any = {
            ...submissionBaseData,
            submittedAt: serverTimestamp(),
        };
        
        const sheetData = { ...submissionBaseData };

        const refSource = sessionStorage.getItem('refSource');
        if (refSource) {
            firestoreData.refSource = refSource;
            (sheetData as any).refSource = refSource;
        }

        await addDoc(collection(db, "submissions"), firestoreData);
        toast({
            title: "Submission Successful!",
            description: `Your entry for ${competitionName} has been received.`,
        });
        
        const result = await writeToGoogleSheet(sheetData);

        if (result.success) {
            toast({
                title: "Data Synced",
                description: "Your submission has been saved to our records.",
            });
        } else {
            toast({
                title: "Sync Failed",
                description: result.message,
                variant: "destructive",
            });
        }
        
        setIsSubmitting(false);
        setIsSubmitted(true);
    } catch (error) {
        console.error("Error adding document: ", error);
        setIsSubmitting(false);
        toast({
            title: "Submission Failed",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
        })
    }
  }

  if (isSubmitted) {
    return (
        <Card className="text-center p-8 shadow-lg">
            <CardContent>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">Thank You!</h2>
                <p className="text-muted-foreground mb-4">Your entry for the <span className="font-semibold text-primary">{competitionName}</span> has been successfully submitted.</p>
                <p className="text-sm text-muted-foreground">Winners will be announced daily on the school's social media page.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="registrationId"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Registration / Candidate ID</FormLabel>
                      <FormControl>
                          <Input placeholder="Enter your ID" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instagramHandle"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Instagram Handle/Link</FormLabel>
                      <FormControl>
                          <Input placeholder="@your_handle or https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Your School</FormLabel>
                        {isLoadingSchools ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <div className="relative">
                            <FormControl>
                              <Input
                                placeholder="Start typing to search for your school..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onFocus={() => searchTerm && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                disabled={schools.length === 0}
                              />
                            </FormControl>
                            {showSuggestions && filteredSchools.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredSchools.map(school => (
                                  <div
                                    key={school.id}
                                    className="cursor-pointer p-2 hover:bg-muted"
                                    onMouseDown={() => handleSchoolSelect(school)}
                                  >
                                    {school.name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            {selectedSchoolUrl && (
                 <Card className="bg-muted/50 p-4 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Follow this page and submit a screenshot:</p>
                        <Button asChild variant="outline">
                            <Link href={selectedSchoolUrl} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="mr-2 h-4 w-4" />
                                {schools.find(s => s.link === selectedSchoolUrl)?.name} Official Page
                            </Link>
                        </Button>
                    </div>
                 </Card>
            )}

            <Card className="bg-muted/50 p-4 flex flex-col items-center justify-center gap-2">
                <p className="text-sm text-muted-foreground -mt-1 mb-1">And please follow both subreddits:</p>
                <Button asChild variant="link">
                    <Link href="https://www.reddit.com/r/btech_/" target="_blank" rel="noopener noreferrer">
                        r/btech_ <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
                <Button asChild variant="link">
                    <Link href="https://www.reddit.com/r/Lpu_/" target="_blank" rel="noopener noreferrer">
                        r/Lpu_ <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </Card>

            <FormField
              control={form.control}
              name="followedSubreddit"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Followed Subreddits
                    </FormLabel>
                    <FormDescription>
                      Please confirm you have followed both subreddits.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting || !selectedSchoolUrl || schools.length === 0} className="w-full font-bold text-lg py-6">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  Submit My Entry <Check className="ml-2 h-5 w-5"/>
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    