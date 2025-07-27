
"use client";

import { useState } from "react";
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
import { Check, CheckCircle, Loader2, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { app } from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { writeToGoogleSheet } from "@/lib/sheets";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  university: z.string().min(3, "University name is required."),
  file: z.any()
    .refine((files) => files?.length > 0, "File is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `File size must be less than 5MB.`)
    .refine((files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type), "Only .pdf, .jpg, .jpeg, and .png formats are supported."),
  captcha: z.literal<boolean>(true, {
    errorMap: () => ({ message: "Please confirm you are not a robot." }),
  }),
});

type SubmissionFormValues = z.infer<typeof formSchema>;

interface SubmissionFormProps {
  competitionId: string;
  competitionName: string;
}

export function SubmissionForm({ competitionId, competitionName }: SubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      university: "",
    },
  });
  
  const fileRef = form.register("file");

  async function onSubmit(values: SubmissionFormValues) {
    setIsSubmitting(true);
    
    const file = values.file[0];

    try {
        const storage = getStorage(app);
        const firestore = getFirestore(app);

        // Upload file to Firebase Storage
        const storageRef = ref(storage, `submissions/${competitionId}/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        const fileUrl = await getDownloadURL(uploadResult.ref);

        const sheetData = {
            competitionId,
            competitionName,
            name: values.name,
            email: values.email,
            phone: values.phone,
            university: values.university,
            fileName: file.name,
            fileUrl,
            submittedAt: new Date(),
        };

        // Save submission data to Firestore
        const submissionData: any = {
            ...sheetData,
            submittedAt: serverTimestamp(),
        };

        const refSource = sessionStorage.getItem('refSource');
        if (refSource) {
            submissionData.refSource = refSource;
            sheetData.refSource = refSource;
        }

        await addDoc(collection(firestore, "submissions"), submissionData);
        
        // Asynchronously write to Google Sheet
        console.log("Calling Google Sheet function from submission-form...");
        await writeToGoogleSheet(sheetData);
        
        setIsSubmitting(false);
        setIsSubmitted(true);
        toast({
            title: "Submission Successful!",
            description: "Your entry has been received.",
        });

    } catch (error) {
        console.error("Submission error:", error);
        setIsSubmitting(false);
        toast({
            title: "Submission Failed",
            description: "An error occurred while submitting your entry. Please try again.",
            variant: "destructive",
        });
    }
  }

  if (isSubmitted) {
    return (
        <Card className="text-center p-8 shadow-lg">
            <CardContent>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">Thank You for Your Submission!</h2>
                <p className="text-muted-foreground mb-4">Your entry for the <span className="font-semibold text-primary">{competitionName}</span> has been successfully submitted.</p>
                <p className="text-sm text-muted-foreground">A confirmation email has been sent to your registered email address.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                        <Input placeholder="(123) 456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="university"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>University/College Name</FormLabel>
                    <FormControl>
                        <Input placeholder="University of Innovation" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission File</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <div className="text-center">
                          <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="font-semibold text-primary">{fileName ? `Selected: ${fileName}` : "Click or drag to upload"}</p>
                          <p className="text-xs text-muted-foreground">PDF, PNG, JPG up to 5MB</p>
                        </div>
                      </label>
                      <Input 
                        id="file-upload"
                        type="file" 
                        className="hidden"
                        {...fileRef}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                form.setValue("file", e.target.files);
                                setFileName(file.name);
                            }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="captcha"
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
                      I am not a robot
                    </FormLabel>
                    <FormDescription>
                      This helps us prevent spam submissions.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />


            <Button type="submit" disabled={isSubmitting} className="w-full font-bold text-lg py-6">
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
