
"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2, Link as LinkIcon, Tv, Camera, Redo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { app } from "@/lib/firebase";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const formSchema = z.object({
  registrationId: z.string().min(5, "Registration/Candidate ID is required."),
  postLink: z.string().url("Please enter a valid Instagram link."),
  redditPostLink: z.string().url("Please enter a valid Reddit link."),
});

type ReelItFeelItFormValues = z.infer<typeof formSchema>;

interface ReelItFeelItFormProps {
  competitionId: string;
  competitionName: string;
  postType?: 'Reel' | 'Post';
}

export function ReelItFeelItForm({ competitionId, competitionName, postType = 'Reel' }: ReelItFeelItFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReelItFeelItFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      registrationId: "",
      postLink: "",
      redditPostLink: "",
    },
  });

  async function onSubmit(values: ReelItFeelItFormValues) {
    setIsSubmitting(true);
    try {
        const db = getFirestore(app);
        await addDoc(collection(db, "submissions"), {
            competitionId,
            competitionName,
            ...values,
            submittedAt: serverTimestamp(),
        });
        setIsSubmitting(false);
        setIsSubmitted(true);
        toast({
            title: "Submission Successful!",
            description: `Your ${postType.toLowerCase()} for ${competitionName} has been submitted.`,
        });
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
                <p className="text-sm text-muted-foreground">Winners will be announced after the competition deadline.</p>
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
                  name="postLink"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Instagram {postType} Link</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="url" placeholder={`https://www.instagram.com/${postType.toLowerCase()}/...`} {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="redditPostLink"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Reddit Post Link (must in r/lpu_ , r/btech_)</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M224 136v64a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8v-64a8 8 0 0 1 0-16h24.6a56 56 0 0 1 106.8 0H224a8 8 0 0 1 0 16m-96-48a40 40 0 0 0-31.4 64h62.8a40 40 0 0 0-31.4-64m-48 72a24 24 0 1 0-24-24a24.1 24.1 0 0 0 24 24m112 0a24 24 0 1 0-24-24a24.1 24.1 0 0 0 24 24m23.3-133.3a8 8 0 0 0-11.3 0L192 38.7a8 8 0 0 0-1.7 8.7a80 80 0 0 0-124.6 0a8 8 0 0 0-1.7-8.7l-12-12a8 8 0 1 0-11.3 11.3L42.3 50a8 8 0 0 0 10.9 2.4a96 96 0 0 1 149.6 0a8 8 0 0 0 10.9-2.4l11.6-11.6a8 8 0 0 0 0-11.4"/></svg>
                            <Input type="url" placeholder="https://www.reddit.com/r/.../..." {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full font-bold text-lg py-6">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  Submit My {postType} {postType === 'Reel' ? <Tv className="ml-2 h-5 w-5"/> : <Camera className="ml-2 h-5 w-5"/>}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
