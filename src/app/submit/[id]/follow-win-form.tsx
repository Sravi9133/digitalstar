
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
import { getProgramCode, writeToGoogleSheet } from "./actions";

interface Program {
    ProgramCode: string;
    ProgramName: string;
    "School Name": string;
    "Instagram Page": string;
}

interface School {
    name: string;
    link: string;
    programs: { code: string; name: string }[];
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
  const [programsData, setProgramsData] = useState<Program[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [isFetchingProgram, setIsFetchingProgram] = useState(false);
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
        
        const programData: Program[] = data['Account Links'];
        setProgramsData(programData);

        if (Array.isArray(programData)) {
            const schoolsMap: Map<string, School> = new Map();

            programData.forEach(item => {
                const schoolName = item["School Name"];
                if (!schoolName) return;

                if (!schoolsMap.has(schoolName)) {
                    schoolsMap.set(schoolName, {
                        name: schoolName,
                        link: item["Instagram Page"],
                        programs: []
                    });
                }

                schoolsMap.get(schoolName)?.programs.push({
                    code: item["ProgramCode"],
                    name: item["ProgramName"]
                });
            });
            
            const formattedSchools = Array.from(schoolsMap.values());
            setSchools(formattedSchools);
            setFilteredSchools(formattedSchools);

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

  const selectedSchoolUrl = schools.find(s => s.name === form.watch('school'))?.link;

  const handleRegistrationIdBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const registrationId = e.target.value;
    if (registrationId.length < 5 || schools.length === 0) return;

    setIsFetchingProgram(true);
    setSearchTerm("");
    form.reset({ registrationId, instagramHandle: form.getValues('instagramHandle'), school: "", followedSubreddit: form.getValues('followedSubreddit') });
    
    const result = await getProgramCode(registrationId);

    if (result.success && result.code) {
        const programCode = result.code;
        const matchedProgram = programsData.find(p => p.ProgramCode === programCode);

        if (matchedProgram) {
            const schoolName = matchedProgram["School Name"];
            form.setValue("school", schoolName, { shouldValidate: true });
            setSearchTerm(schoolName);
            toast({ title: "Details Found!", description: "Your school has been auto-filled." });
        } else {
             toast({ title: "School Not Matched", description: "We found your program, but couldn't match it to a school. Please select it manually.", variant: "destructive" });
        }

    } else {
        toast({ title: "Could Not Fetch Details", description: result.message, variant: "destructive" });
    }

    setIsFetchingProgram(false);
  };
  
  const handleFocus = () => {
    setFilteredSchools(schools);
    setShowSuggestions(true);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    form.setValue("school", ""); 

    if (!query) {
        setFilteredSchools(schools);
        setShowSuggestions(true);
        return;
    }

    const lowerCaseQuery = query.toLowerCase();
    const filtered = schools.filter(school => {
        const inSchoolName = school.name.toLowerCase().includes(lowerCaseQuery);
        const inProgram = school.programs.some(p => 
            p.name.toLowerCase().includes(lowerCaseQuery) || 
            p.code.toLowerCase().includes(lowerCaseQuery)
        );
        return inSchoolName || inProgram;
    });

    setFilteredSchools(filtered);
    setShowSuggestions(true);
  };

  const handleSchoolSelect = (school: School) => {
    setSearchTerm(school.name);
    form.setValue("school", school.name, { shouldValidate: true });
    setShowSuggestions(false);
  }

  async function onSubmit(values: FollowWinFormValues) {
    setIsSubmitting(true);
    const selectedSchool = schools.find(s => s.name === values.school);

    if (!selectedSchool) {
        toast({
            title: "Invalid School",
            description: "Please select a valid school from the list.",
            variant: "destructive",
        });
        setIsSubmitting(false);
        return;
    }

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
                          <Input placeholder="Enter your ID and press Tab" {...field} onBlur={handleRegistrationIdBlur} />
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
                      <FormLabel>Your School</FormLabel>
                        {isLoadingSchools ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <div className="relative">
                            <FormControl>
                              <div className="relative">
                                  <Input
                                    placeholder="Search for your school or program..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    onFocus={handleFocus}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    disabled={schools.length === 0 || isFetchingProgram}
                                    autoComplete="off"
                                  />
                                  {isFetchingProgram && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                              </div>
                            </FormControl>
                            {showSuggestions && (
                              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredSchools.length > 0 ? (
                                    filteredSchools.map(school => (
                                    <div
                                        key={school.name}
                                        className="cursor-pointer p-2 hover:bg-muted"
                                        onMouseDown={() => handleSchoolSelect(school)}
                                    >
                                        <p className="font-semibold">{school.name}</p>
                                    </div>
                                    ))
                                ) : (
                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                        No schools found.
                                    </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
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
                      <FormDescription>
                        this will not autofill
                      </FormDescription>
                      <FormMessage />
                      </FormItem>
                  )}
                />
            </div>

            {selectedSchoolUrl && (
                 <Card className="bg-muted/50 p-4 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Please follow this page:</p>
                        <Button asChild variant="outline">
                            <Link href={selectedSchoolUrl} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="mr-2 h-4 w-4" />
                                {form.getValues('school')} Official Page
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

            <Button type="submit" disabled={isSubmitting || schools.length === 0} className="w-full font-bold text-lg py-6">
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
