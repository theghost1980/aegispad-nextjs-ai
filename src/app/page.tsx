// src/app/page.tsx
"use client";

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ArticleEditor from '@/components/article-editor';
import GlobalLoader from '@/components/global-loader';
import LoadingSpinner from '@/components/loading-spinner';
import MarkdownPreview from '@/components/markdown-preview';
import { useToast } from '@/hooks/use-toast';
import { createArticle, CreateArticleInput } from '@/ai/flows/create-article';
import { reviseArticle, ReviseArticleInput } from '@/ai/flows/revise-article';
import { translateArticle, TranslateArticleInput } from '@/ai/flows/translate-article';
import { Wand2, Edit3, Languages, Eraser, FileText, Globe } from 'lucide-react';

const availableLanguages = [
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Chinese (Simplified)', label: 'Chinese (Simplified)' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Portuguese (Brazil)', label: 'Portuguese (Brazil)' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'English', label: 'English' },
];

export default function ArticleForgePage() {
  const [prompt, setPrompt] = useState<string>('');
  const [articleMarkdown, setArticleMarkdown] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>(availableLanguages[0].value);
  
  const [currentOperationMessage, setCurrentOperationMessage] = useState<string | null>(null);
  const [translatedArticleMarkdown, setTranslatedArticleMarkdown] = useState<string>('');
  const [originalArticleForTranslation, setOriginalArticleForTranslation] = useState<string>('');

  const [isCreating, startCreateTransition] = useTransition();
  const [isRevising, startReviseTransition] = useTransition();
  const [isTranslating, startTranslateTransition] = useTransition();

  const { toast } = useToast();

  const isLoading = isCreating || isRevising || isTranslating;
  
  // To prevent hydration errors with new Date() or Math.random()
  const [clientLoaded, setClientLoaded] = useState(false);
  useEffect(() => {
    setClientLoaded(true);
  }, []);


  const handleCreateArticle = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Error', description: 'Prompt cannot be empty.', variant: 'destructive' });
      return;
    }
    setCurrentOperationMessage('Creating article...');
    startCreateTransition(async () => {
      try {
        const input: CreateArticleInput = { prompt };
        const result = await createArticle(input);
        setArticleMarkdown(result.article);
        setTranslatedArticleMarkdown('');
        setOriginalArticleForTranslation('');
        toast({ title: 'Success', description: 'Article created successfully!' });
      } catch (error) {
        console.error('Error creating article:', error);
        toast({ title: 'Error', description: 'Failed to create article. Please try again.', variant: 'destructive' });
      } finally {
        setCurrentOperationMessage(null);
      }
    });
  };

  const handleReviseArticle = async () => {
    if (!articleMarkdown.trim()) {
      toast({ title: 'Error', description: 'Article content cannot be empty.', variant: 'destructive' });
      return;
    }
    setCurrentOperationMessage('Revising article...');
    startReviseTransition(async () => {
      try {
        const input: ReviseArticleInput = { article: articleMarkdown };
        const result = await reviseArticle(input);
        setArticleMarkdown(result.revisedArticle);
        setTranslatedArticleMarkdown('');
        setOriginalArticleForTranslation('');
        toast({ title: 'Success', description: 'Article revised successfully!' });
      } catch (error) {
        console.error('Error revising article:', error);
        toast({ title: 'Error', description: 'Failed to revise article. Please try again.', variant: 'destructive' });
      } finally {
        setCurrentOperationMessage(null);
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
    setCurrentOperationMessage('Translating article...');
    startTranslateTransition(async () => {
      try {
        setOriginalArticleForTranslation(articleMarkdown);
        const input: TranslateArticleInput = { article: articleMarkdown, targetLanguage };
        const result = await translateArticle(input);
        setTranslatedArticleMarkdown(result.translatedArticle);
        toast({ title: 'Success', description: `Article translated to ${targetLanguage} successfully!` });
      } catch (error) {
        console.error('Error translating article:', error);
        toast({ title: 'Error', description: 'Failed to translate article. Please try again.', variant: 'destructive' });
      } finally {
        setCurrentOperationMessage(null);
      }
    });
  };

  const clearAll = () => {
    setPrompt('');
    setArticleMarkdown('');
    setTargetLanguage(availableLanguages[0].value);
    setTranslatedArticleMarkdown('');
    setOriginalArticleForTranslation('');
    setCurrentOperationMessage(null);
    toast({ title: 'Cleared', description: 'All fields have been cleared.' });
  };
  
  if (!clientLoaded) {
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner size={48} /></div>;
  }

  return (
    <div className="space-y-8">
      <GlobalLoader isLoading={isLoading} operationMessage={currentOperationMessage} />
      
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
              aria-label="Article prompt input"
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

      {articleMarkdown && (
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
      )}
      
      {articleMarkdown && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Languages className="mr-2 h-6 w-6 text-primary" />Translate Article</CardTitle>
            <CardDescription>Translate the current article into another language.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="targetLanguage" className="text-lg font-medium">Target Language</Label>
              <Select 
                value={targetLanguage} 
                onValueChange={setTargetLanguage}
                disabled={isLoading}
              >
                <SelectTrigger id="targetLanguage" className="mt-1 text-base" aria-label="Select target language for translation">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleTranslateArticle} disabled={isLoading || !articleMarkdown.trim() || !targetLanguage.trim()} className="w-full md:w-auto">
              {isTranslating ? <LoadingSpinner className="mr-2" /> : <Languages className="mr-2" />}
              Translate Article
            </Button>
          </CardFooter>
        </Card>
      )}

      {translatedArticleMarkdown && originalArticleForTranslation && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Globe className="mr-2 h-6 w-6 text-primary" />Translation Result</CardTitle>
            <CardDescription>Showing original article and its translation to {targetLanguage}.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl"><FileText size={20} className="mr-2 text-muted-foreground" /> Original Article</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownPreview markdown={originalArticleForTranslation} minHeight="300px" ariaLabel="Original article content before translation"/>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl"><Languages size={20} className="mr-2 text-muted-foreground" /> Translated to {targetLanguage}</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownPreview markdown={translatedArticleMarkdown} minHeight="300px" ariaLabel={`Article translated to ${targetLanguage}`}/>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
