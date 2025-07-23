"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Check, CheckCircle, Loader2, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface School {
    id: string;
    name: string;
    link: string;
}

const formSchema = z.object({
  registrationId: z.string().min(5, "Registration/Application ID is required."),
  instagramHandle: z.string().min(3, "Instagram handle is required.").refine(val => val.startsWith('@'), { message: "Handle must start with @" }),
  school: z.string({
    required_error: "Please select a school.",
  }),
});

type FollowWinFormValues = z.infer<typeof formSchema>;

interface FollowWinFormProps {
  competitionName: string;
}

export function FollowWinForm({ competitionName }: FollowWinFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedSchoolUrl, setSelectedSchoolUrl] = useState<string | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSchools() {
      try {
        const response = await fetch('/social_ink.json');
        if (!response.ok) {
          throw new Error('Failed to fetch school data');
        }
        const data: School[] = await response.json();
        setSchools(data);
      } catch (error) {
        console.error(error);
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
        instagramHandle: "@",
    }
  });

  function handleSchoolChange(schoolId: string) {
    const school = schools.find(s => s.id === schoolId);
    setSelectedSchoolUrl(school?.link || null);
    form.setValue("school", schoolId);
  }

  async function onSubmit(values: FollowWinFormValues) {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(values);
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast({
        title: "Submission Successful!",
        description: `Your entry for ${competitionName} has been received.`,
      });
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
                      <FormLabel>Registration / Application ID</FormLabel>
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
                      <FormLabel>Instagram Handle</FormLabel>
                      <FormControl>
                          <Input placeholder="@your_handle" {...field} />
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
                      <Select onValueChange={handleSchoolChange} defaultValue={field.value} disabled={schools.length === 0}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose your school" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schools.map(school => (
                            <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                            <Link href={selectedSchoolUrl} target="_blank">
                                <LinkIcon className="mr-2 h-4 w-4" />
                                {schools.find(s => s.link === selectedSchoolUrl)?.name} Official Page
                            </Link>
                        </Button>
                    </div>
                 </Card>
            )}

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
