"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AEGISPAD_DEFAULT_TAG,
  MAX_HIVE_TAGS,
  MAX_HIVE_TAG_LENGTH,
  MIN_HIVE_TAG_LENGTH,
} from "@/constants/constants";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState, type KeyboardEvent } from "react";

interface TagInputProps {
  initialTags?: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  initialTags,
  onTagsChange,
  className,
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

  const addTag = () => {
    const newTag = inputValue.trim().toLowerCase();
    if (!newTag) return;

    if (tags.length >= MAX_HIVE_TAGS) {
      toast({
        title: t("maxTagsReachedErrorTitle"),
        description: t("maxTagsReachedErrorDescription", {
          maxTags: MAX_HIVE_TAGS,
        }),
        variant: "destructive",
      });
      setInputValue("");
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
      setInputValue("");
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
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    if (tagToRemove.toLowerCase() === AEGISPAD_DEFAULT_TAG.toLowerCase())
      return; // Prevent removing the default tag
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag();
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 1) {
      // Remove last tag if input is empty and it's not the default tag
      const lastTag = tags[tags.length - 1];
      if (lastTag.toLowerCase() !== AEGISPAD_DEFAULT_TAG.toLowerCase()) {
        removeTag(lastTag);
      }
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background text-foreground ${className}`}
    >
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
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
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={t("addTagsPlaceholder")}
        className="flex-grow h-8 text-sm bg-transparent border-none shadow-none focus-visible:ring-0 px-1 min-w-[100px] placeholder:text-muted-foreground"
        disabled={tags.length >= MAX_HIVE_TAGS}
      />
    </div>
  );
};

export default TagInput;
