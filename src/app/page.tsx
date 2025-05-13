"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ArticleEditor from '@/components/article-editor';
import LoadingSpinner from '@/components/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { createArticle, CreateArticleInput } from '@/ai/flows/create-article';
import { reviseArticle, ReviseArticleInput } from '@/ai/flows/revise-article';
import { translateArticle, TranslateArticleInput } from '@/ai/flows/translate-article';
import { Wand2, Edit3, Languages, Eraser } from 'lucide-react';

export default function ArticleForgePage() {
  const [prompt, setPrompt] = useState<string>('');
  const [articleMarkdown, setArticleMarkdown] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('English');
  
  const [isCreating, startCreateTransition] = useTransition();
  const [isRevising, startReviseTransition] = useTransition();
  const [isTranslating, startTranslateTransition] = useTransition();

  const { toast } = useToast();

  const handleCreateArticle = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Error', description: 'Prompt cannot be empty.', variant: 'destructive' });
      return;
    }
    startCreateTransition(async () => {
      try {
        const input: CreateArticleInput = { prompt };
        const result = await createArticle(input);
        setArticleMarkdown(result.article);
        toast({ title: 'Success', description: 'Article created successfully!' });
      } catch (error) {
        console.error('Error creating article:', error);
        toast({ title: 'Error', description: 'Failed to create article. Please try again.', variant: 'destructive' });
      }
    });
  };

  const handleReviseArticle = async () => {
    if (!articleMarkdown.trim()) {
      toast({ title: 'Error', description: 'Article content cannot be empty.', variant: 'destructive' });
      return;
    }
    startReviseTransition(async () => {
      try {
        const input: ReviseArticleInput = { article: articleMarkdown };
        const result = await reviseArticle(input);
        setArticleMarkdown(result.revisedArticle);
        toast({ title: 'Success', description: 'Article revised successfully!' });
      } catch (error) {
        console.error('Error revising article:', error);
        toast({ title: 'Error', description: 'Failed to revise article. Please try again.', variant: 'destructive' });
      }
    });
  };

  const handleTranslateArticle = async () => {
    if (!articleMarkdown.trim()) {
      toast({ title: 'Error', description: 'Article content cannot be empty.', variant: 'destructive' });
      return;
    }
    if (!targetLanguage.trim()) {
      toast({ title: 'Error', description: 'Target language cannot be empty.', variant: 'destructive' });
      return;
    }
    startTranslateTransition(async () => {
      try {
        const input: TranslateArticleInput = { article: articleMarkdown, targetLanguage };
        const result = await translateArticle(input);
        setArticleMarkdown(result.translatedArticle);
        toast({ title: 'Success', description: `Article translated to ${targetLanguage} successfully!` });
      } catch (error) {
        console.error('Error translating article:', error);
        toast({ title: 'Error', description: 'Failed to translate article. Please try again.', variant: 'destructive' });
      }
    });
  };

  const isLoading = isCreating || isRevising || isTranslating;

  const clearAll = () => {
    setPrompt('');
    setArticleMarkdown('');
    setTargetLanguage('English');
    toast({ title: 'Cleared', description: 'All fields have been cleared.' });
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Wand2 className="mr-2 h-6 w-6 text-primary" />Create New Article</CardTitle>
          <CardDescription>Enter a prompt to generate an article using AI. Be specific for best results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="prompt" className="text-lg font-medium">Article Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Write an article about the future of renewable energy, focusing on solar and wind power innovations..."
              className="min-h-[120px] mt-1 text-base"
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button onClick={clearAll} variant="outline" disabled={isLoading}>
            <Eraser className="mr-2" /> Clear All
          </Button>
          <Button onClick={handleCreateArticle} disabled={isLoading || !prompt.trim()}>
            {isCreating ? <LoadingSpinner className="mr-2" /> : <Wand2 className="mr-2" />}
            Create Article
          </Button>
        </CardFooter>
      </Card>

      {articleMarkdown || isLoading ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Edit3 className="mr-2 h-6 w-6 text-primary" />Edit & Refine Article</CardTitle>
            <CardDescription>Edit the generated Markdown directly or use AI to revise it.</CardDescription>
          </CardHeader>
          <CardContent>
            <ArticleEditor
              markdown={articleMarkdown}
              onMarkdownChange={setArticleMarkdown}
              isLoading={isLoading}
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleReviseArticle} disabled={isLoading || !articleMarkdown.trim()} className="w-full md:w-auto">
              {isRevising ? <LoadingSpinner className="mr-2" /> : <Edit3 className="mr-2" />}
              Revise Article with AI
            </Button>
          </CardFooter>
        </Card>
      ) : null}
      
      {articleMarkdown || isLoading ? (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Languages className="mr-2 h-6 w-6 text-primary" />Translate Article</CardTitle>
          <CardDescription>Translate the current article into another language.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="targetLanguage" className="text-lg font-medium">Target Language</Label>
            <Input
              id="targetLanguage"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              placeholder="e.g., Spanish, French, German"
              className="mt-1 text-base"
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleTranslateArticle} disabled={isLoading || !articleMarkdown.trim() || !targetLanguage.trim()} className="w-full md:w-auto">
            {isTranslating ? <LoadingSpinner className="mr-2" /> : <Languages className="mr-2" />}
            Translate Article
          </Button>
        </CardFooter>
      </Card>
      ) : null}

    </div>
  );
}
