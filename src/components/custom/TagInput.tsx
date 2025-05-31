"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AEGISPAD_DEFAULT_TAG,
  MAX_HIVE_TAGS,
  MAX_HIVE_TAG_LENGTH,
  MIN_HIVE_TAG_LENGTH,
} from "@/constants/constants";
import { useToast } from "@/hooks/use-toast";
import { FileText, ListChecks, Loader2, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState, type KeyboardEvent } from "react";

interface TagInputProps {
  initialTags?: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
  articleContent?: string;
  onFetchPopularTags?: () => Promise<string[] | undefined>;
  onFetchArticleKeywords?: (content: string) => Promise<string[] | undefined>;
  initialAiTags?: Set<string>;
}

const TagInput: React.FC<TagInputProps> = ({
  initialTags,
  onTagsChange,
  className,
  articleContent,
  onFetchPopularTags,
  onFetchArticleKeywords,
  initialAiTags,
}) => {
  const t = useTranslations("TagInput");
  const { toast } = useToast();
  const [tags, setTags] = useState<string[]>(() => {
    const defaultTags = [AEGISPAD_DEFAULT_TAG];
    if (initialTags) {
      const uniqueInitial = initialTags.filter(
        (tag) => tag.toLowerCase() !== AEGISPAD_DEFAULT_TAG.toLowerCase()
      );
      return [...defaultTags, ...uniqueInitial.slice(0, MAX_HIVE_TAGS - 1)];
    }
    return defaultTags;
  });
  const [inputValue, setInputValue] = useState<string>("");
  const [showSuggestionsPopover, setShowSuggestionsPopover] =
    useState<boolean>(false);
  const [isFetchingInternalSuggestions, setIsFetchingInternalSuggestions] =
    useState<boolean>(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [aiAddedTags, setAiAddedTags] = useState<Set<string>>(
    () => initialAiTags || new Set()
  );

  useEffect(() => {
    onTagsChange(tags);
  }, [tags, onTagsChange]);

  const isValidHiveTag = (tag: string): boolean => {
    if (tag.length < MIN_HIVE_TAG_LENGTH || tag.length > MAX_HIVE_TAG_LENGTH) {
      return false;
    }
    const hiveTagRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    return hiveTagRegex.test(tag);
  };

  const addTagInternal = (
    tagValue: string,
    isFromAISuggestionPanel: boolean = false
  ) => {
    const newTag = tagValue.trim().toLowerCase();

    if (tags.length >= MAX_HIVE_TAGS) {
      toast({
        title: t("maxTagsReachedErrorTitle"),
        description: t("maxTagsReachedErrorDescription", {
          maxTags: MAX_HIVE_TAGS,
        }),
        variant: "destructive",
      });
      return;
    }

    if (!isValidHiveTag(newTag)) {
      toast({
        title: t("invalidTagErrorTitle"),
        description: t("invalidTagErrorDescription", {
          tag: newTag,
          minLength: MIN_HIVE_TAG_LENGTH,
          maxLength: MAX_HIVE_TAG_LENGTH,
        }),
        variant: "destructive",
      });
      return;
    }

    if (tags.includes(newTag)) {
      toast({
        title: t("tagAlreadyExistsErrorTitle"),
        description: t("tagAlreadyExistsErrorDescription", { tag: newTag }),
        variant: "destructive",
      });
      setInputValue("");
      return;
    }

    setTags([...tags, newTag]);
    if (isFromAISuggestionPanel) {
      setAiAddedTags((prev) => new Set(prev).add(newTag));
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    if (tagToRemove.toLowerCase() === AEGISPAD_DEFAULT_TAG.toLowerCase())
      return; // Prevent removing the default tag
    setAiAddedTags((prev) => {
      const newSet = new Set(prev);
      newSet.delete(tagToRemove.toLowerCase()); // Asegurar consistencia con cómo se añade
      return newSet;
    });
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleAddTagFromInput = () => {
    if (!inputValue.trim()) return;
    addTagInternal(inputValue);
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddTagFromInput();
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 1) {
      const lastTag = tags[tags.length - 1];
      if (lastTag.toLowerCase() !== AEGISPAD_DEFAULT_TAG.toLowerCase()) {
        removeTag(lastTag);
      }
    }
  };

  const fetchAndSetSuggestions = async (type: "popular" | "article") => {
    setIsFetchingInternalSuggestions(true);
    setSuggestedTags([]);
    try {
      let fetched: string[] | undefined;
      if (type === "popular" && onFetchPopularTags) {
        fetched = await onFetchPopularTags();
      } else if (type === "article" && onFetchArticleKeywords) {
        if (!articleContent || articleContent.trim() === "") {
          toast({
            title: t("errorTitle"),
            description: t("articleEmptyForSuggestionsError"),
            variant: "destructive",
          });
          setIsFetchingInternalSuggestions(false);
          return;
        }
        fetched = await onFetchArticleKeywords(articleContent);
      }

      if (fetched && fetched.length > 0) {
        // Filter out already existing tags and invalid ones before showing
        const validNewSuggestions = fetched.filter(
          (tag) => !tags.includes(tag.toLowerCase()) && isValidHiveTag(tag)
        );
        setSuggestedTags(validNewSuggestions.slice(0, 10)); // Show max 10 suggestions
      } else {
        setSuggestedTags([]);
        toast({
          title: t("infoTitle"),
          description: t("noSuggestionsFound"),
        });
      }
    } catch (error) {
      console.error(`Error fetching ${type} tags:`, error);
      toast({
        title: t("errorTitle"),
        description: t("fetchSuggestionsError"),
        variant: "destructive",
      });
      setSuggestedTags([]);
    } finally {
      setIsFetchingInternalSuggestions(false);
    }
  };

  return (
    <div className={`p-2 border rounded-md bg-background ${className}`}>
      {/* Contenedor para los tags existentes */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant={
              aiAddedTags.has(tag.toLowerCase()) ? "default" : "secondary"
            }
            className="flex items-center gap-1 text-sm py-1 px-2"
          >
            {tag}
            {tag.toLowerCase() !== AEGISPAD_DEFAULT_TAG.toLowerCase() && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => removeTag(tag)}
                aria-label={t("removeTagAriaLabel", { tag })}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        ))}
      </div>

      {/* Contenedor para el input y el botón de sugerencias */}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("addTagsPlaceholder")}
          className="flex-grow h-9 text-sm bg-transparent border rounded-md px-3 placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          disabled={tags.length >= MAX_HIVE_TAGS}
        />
        {(onFetchPopularTags || onFetchArticleKeywords) &&
          tags.length < MAX_HIVE_TAGS && (
            <Popover
              open={showSuggestionsPopover}
              onOpenChange={setShowSuggestionsPopover}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0 p-0 text-primary hover:bg-primary/10 border-primary"
                  title={t("suggestTagsButtonTitle")}
                  disabled={isFetchingInternalSuggestions}
                >
                  {isFetchingInternalSuggestions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">
                      {t("suggestTagsPopoverTitle")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t("suggestTagsPopoverDescription")}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {onFetchPopularTags && (
                      <Button
                        variant="outline"
                        onClick={() => fetchAndSetSuggestions("popular")}
                        disabled={isFetchingInternalSuggestions}
                      >
                        <ListChecks className="mr-2 h-4 w-4" />
                        {t("suggestPopularTitle")}
                      </Button>
                    )}
                    {onFetchArticleKeywords && (
                      <Button
                        variant="outline"
                        onClick={() => fetchAndSetSuggestions("article")}
                        disabled={
                          isFetchingInternalSuggestions ||
                          !articleContent?.trim()
                        }
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {t("suggestFromArticleTitle")}
                      </Button>
                    )}
                  </div>
                  {isFetchingInternalSuggestions && (
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("loadingSuggestions")}
                    </div>
                  )}
                  {!isFetchingInternalSuggestions &&
                    suggestedTags.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t("clickToAddSuggestion")}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {suggestedTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              onClick={() => addTagInternal(tag, true)}
                              className="cursor-pointer hover:bg-accent"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        <div className="text-right text-xs text-muted-foreground mt-1 pr-1">
          {t("tagsCounter", {
            current: tags.length,
            max: MAX_HIVE_TAGS,
          })}
        </div>
      </div>
    </div>
  );
};

export default TagInput;
