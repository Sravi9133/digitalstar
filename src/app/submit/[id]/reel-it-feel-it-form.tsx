
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
import { CheckCircle, Loader2, Link as LinkIcon, Tv } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  registrationId: z.string().min(5, "Registration/Candidate ID is required."),
  reelLink: z.string().url("Please enter a valid Instagram Reel link."),
});

type ReelItFeelItFormValues = z.infer<typeof formSchema>;

interface ReelItFeelItFormProps {
  competitionName: string;
}

export function ReelItFeelItForm({ competitionName }: ReelItFeelItFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReelItFeelItFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      registrationId: "",
      reelLink: "",
    },
  });

  async function onSubmit(values: ReelItFeelItFormValues) {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(values);
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast({
        title: "Submission Successful!",
        description: `Your reel for ${competitionName} has been submitted.`,
    });
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
                  name="reelLink"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Instagram Reel Link</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="url" placeholder="https://www.instagram.com/reel/..." {...field} className="pl-10" />
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
                  Submit My Reel <Tv className="ml-2 h-5 w-5"/>
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
