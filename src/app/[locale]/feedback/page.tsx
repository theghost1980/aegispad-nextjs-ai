"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useHiveAuth } from "@/hooks/use-hive-auth";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageSquareText, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

interface FeedbackFormData {
  overallRating: string;
  mostUsefulFeature: string;
  newFeatureSuggestion: string;
  generalComments: string;
}

export default function FeedbackPage() {
  const t = useTranslations("FeedbackPage");
  const router = useRouter();
  const {
    isAuthenticated: isHiveLoggedIn,
    isLoading: isLoadingHiveAuth,
    authenticatedFetch,
  } = useHiveAuth();

  const [formData, setFormData] = useState<FeedbackFormData>({
    overallRating: "",
    mostUsefulFeature: "",
    newFeatureSuggestion: "",
    generalComments: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientLoaded, setClientLoaded] = useState(false);

  useEffect(() => {
    setClientLoaded(true);
  }, []);

  useEffect(() => {
    if (clientLoaded && !isLoadingHiveAuth && !isHiveLoggedIn) {
      router.push("/login?redirect=/feedback");
    }
  }, [clientLoaded, isLoadingHiveAuth, isHiveLoggedIn, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (value: string) => {
    setFormData((prev) => ({ ...prev, overallRating: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.overallRating) {
      toast({
        title: t("feedbackFailedTitle"),
        description: "Please select an overall rating.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await authenticatedFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          overallRating: parseInt(formData.overallRating, 10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit feedback");
      }

      toast({
        title: t("feedbackSubmittedTitle"),
        description: t("feedbackSubmittedDescription"),
      });
      setFormData({
        overallRating: "",
        mostUsefulFeature: "",
        newFeatureSuggestion: "",
        generalComments: "",
      });
    } catch (error: any) {
      console.error("Feedback submission error:", error);
      toast({
        title: t("feedbackFailedTitle"),
        description: error.message || t("feedbackFailedDescription"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!clientLoaded || isLoadingHiveAuth) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>{t("loadingPage")}</p>
      </div>
    );
  }

  if (!isHiveLoggedIn) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>{t("accessDenied")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{t("accessDeniedMessage")}</p>
            <Button onClick={() => router.push("/login?redirect=/feedback")}>
              {t("loginButton")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ratingOptions = [
    { value: "1", label: t("ratingPoor") },
    { value: "2", label: t("ratingFair") },
    { value: "3", label: t("ratingGood") },
    { value: "4", label: t("ratingVeryGood") },
    { value: "5", label: t("ratingExcellent") },
  ];

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <MessageSquareText className="mr-2 h-7 w-7 text-primary" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Overall Rating */}
            <div className="space-y-2">
              <Label htmlFor="overallRating" className="font-semibold">
                {t("overallRatingLabel")}
              </Label>
              <RadioGroup
                id="overallRating"
                name="overallRating"
                value={formData.overallRating}
                onValueChange={handleRatingChange}
                className="flex flex-wrap gap-4"
                required
              >
                {ratingOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`rating-${option.value}`}
                    />
                    <Label
                      htmlFor={`rating-${option.value}`}
                      className="font-normal cursor-pointer"
                    >
                      {option.value} - {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Most Useful Feature */}
            <div className="space-y-2">
              <Label htmlFor="mostUsefulFeature" className="font-semibold">
                {t("mostUsefulFeatureLabel")}
              </Label>
              <Input
                id="mostUsefulFeature"
                name="mostUsefulFeature"
                value={formData.mostUsefulFeature}
                onChange={handleInputChange}
                maxLength={250}
              />
            </div>

            {/* New Feature Suggestion */}
            <div className="space-y-2">
              <Label htmlFor="newFeatureSuggestion" className="font-semibold">
                {t("newFeatureSuggestionLabel")}
              </Label>
              <Textarea
                id="newFeatureSuggestion"
                name="newFeatureSuggestion"
                value={formData.newFeatureSuggestion}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
              />
            </div>

            {/* General Comments */}
            <div className="space-y-2">
              <Label htmlFor="generalComments" className="font-semibold">
                {t("generalCommentsLabel")}
              </Label>
              <Textarea
                id="generalComments"
                name="generalComments"
                value={formData.generalComments}
                onChange={handleInputChange}
                rows={5}
                maxLength={1000}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? t("submittingFeedback") : t("submitButton")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
