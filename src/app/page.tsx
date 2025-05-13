// src/app/page.tsx
"use client";

import { useState, useTransition, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import ArticleEditor from '@/components/article-editor';
import GlobalLoader from '@/components/global-loader';
import LoadingSpinner from '@/components/loading-spinner';
import MarkdownPreview from '@/components/markdown-preview';
import { useToast } from '@/hooks/use-toast';
import { createArticle, CreateArticleInput, CreateArticleOutput } from '@/ai/flows/create-article';
import { reviseArticle, ReviseArticleInput, ReviseArticleOutput } from '@/ai/flows/revise-article';
import { translateArticle, TranslateArticleInput, TranslateArticleOutput } from '@/ai/flows/translate-article';
import { Wand2, Edit3, Languages, Eraser, FileText, Globe, Coins, Image as ImageIcon, Layers, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const ESTIMATED_INITIAL_SESSION_TOKENS = 100000; 
const HEADER_HEIGHT_OFFSET = "3.5rem"; // Corresponds to 'top-14' Tailwind class (h-header = 3.5rem)
const SCROLL_THRESHOLD = 50; // Pixels to scroll before compacting header

export default function ArticleForgePage() {
  const [prompt, setPrompt] = useState<string>('');
  const [articleMarkdown, setArticleMarkdown] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>(availableLanguages[0].value);
  const [generateMainImage, setGenerateMainImage] = useState<boolean>(false);
  
  const [currentOperationMessage, setCurrentOperationMessage] = useState<string | null>(null);
  const [translatedArticleMarkdown, setTranslatedArticleMarkdown] = useState<string>('');
  const [originalArticleForTranslation, setOriginalArticleForTranslation] = useState<string>('');

  const [currentRequestTokens, setCurrentRequestTokens] = useState<number | null>(null);
  const [sessionTotalTokens, setSessionTotalTokens] = useState<number>(0);
  const [detailedTokenUsage, setDetailedTokenUsage] = useState<{text?: number, image?:number} | null>(null);

  const [finalCombinedOutput, setFinalCombinedOutput] = useState<string>('');
  const [selectedCombineFormat, setSelectedCombineFormat] = useState<'simple' | 'detailsTag'>('simple');

  const [isCreating, startCreateTransition] = useTransition();
  const [isRevising, startReviseTransition] = useTransition();
  const [isTranslating, startTranslateTransition] = useTransition();
  const [isCombiningFormat, startCombineFormatTransition] = useTransition();

  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [clientLoaded, setClientLoaded] = useState(false);

  const { toast } = useToast();

  const isLoading = isCreating || isRevising || isTranslating || isCombiningFormat;
  
  useEffect(() => {
    setClientLoaded(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > SCROLL_THRESHOLD) {
        setIsScrolledDown(true);
      } else {
        setIsScrolledDown(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Call handler once on mount to set initial state
    handleScroll(); 

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const handleTokenUpdate = (tokensUsed: number, details?: {text?: number, image?:number}) => {
    setCurrentRequestTokens(tokensUsed);
    setSessionTotalTokens(prevTotal => prevTotal + tokensUsed);
    if (details) {
      setDetailedTokenUsage(details);
    } else {
      setDetailedTokenUsage(null);
    }
  };

  const handleCreateArticle = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Error', description: 'Prompt cannot be empty.', variant: 'destructive' });
      return;
    }
    setCurrentOperationMessage(generateMainImage ? 'Creating article and generating image...' : 'Creating article...');
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setFinalCombinedOutput(''); 
    startCreateTransition(async () => {
      try {
        const input: CreateArticleInput = { prompt, generateMainImage };
        const result: CreateArticleOutput = await createArticle(input);
        setArticleMarkdown(result.article);
        handleTokenUpdate(result.tokenUsage.totalTokens, {
          text: result.tokenUsage.textGenerationTokens,
          image: result.tokenUsage.imageGenerationTokens
        });
        setTranslatedArticleMarkdown('');
        setOriginalArticleForTranslation('');
        toast({ title: 'Success', description: 'Article created successfully!' + (result.mainImageUrl ? ' Main image generated.' : '') });
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
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setFinalCombinedOutput(''); 
    startReviseTransition(async () => {
      try {
        const input: ReviseArticleInput = { article: articleMarkdown };
        const result: ReviseArticleOutput = await reviseArticle(input);
        setArticleMarkdown(result.revisedArticle);
        handleTokenUpdate(result.tokenUsage.totalTokens);
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
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setFinalCombinedOutput('');
    startTranslateTransition(async () => {
      try {
        setOriginalArticleForTranslation(articleMarkdown);
        const input: TranslateArticleInput = { article: articleMarkdown, targetLanguage };
        const result: TranslateArticleOutput = await translateArticle(input);
        setTranslatedArticleMarkdown(result.translatedArticle);
        handleTokenUpdate(result.tokenUsage.totalTokens);
        toast({ title: 'Success', description: `Article translated to ${targetLanguage} successfully!` });
      } catch (error) {
        console.error('Error translating article:', error);
        toast({ title: 'Error', description: 'Failed to translate article. Please try again.', variant: 'destructive' });
      } finally {
        setCurrentOperationMessage(null);
      }
    });
  };

  const handleCombineFormat = () => {
    if (!originalArticleForTranslation.trim() || !translatedArticleMarkdown.trim()) {
      toast({ title: 'Error', description: 'Original and translated articles must exist to combine.', variant: 'destructive' });
      return;
    }
    setCurrentOperationMessage('Generating combined article format...');
    startCombineFormatTransition(() => {
      let combined = '';
      const originalContent = originalArticleForTranslation;
      const translatedContent = translatedArticleMarkdown;

      if (selectedCombineFormat === 'simple') {
        combined = `${originalContent}\n\n<hr />\n\n## Translation (${targetLanguage})\n\n${translatedContent}`;
      } else { // detailsTag
        combined = `${originalContent}\n\n<details>\n  <summary>Translation (${targetLanguage})</summary>\n\n${translatedContent}\n</details>`;
      }
      setFinalCombinedOutput(combined);
      setCurrentOperationMessage(null);
      toast({ title: 'Success', description: 'Combined article format generated!' });
    });
  };


  const clearAll = () => {
    setPrompt('');
    setArticleMarkdown('');
    setTargetLanguage(availableLanguages[0].value);
    setTranslatedArticleMarkdown('');
    setOriginalArticleForTranslation('');
    setCurrentOperationMessage(null);
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setGenerateMainImage(false);
    setFinalCombinedOutput('');
    setSelectedCombineFormat('simple');
    toast({ title: 'Cleared', description: 'All fields have been cleared.' });
  };
  
  if (!clientLoaded) {
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner size={48} /></div>;
  }

  const tokensLeftInSession = Math.max(0, ESTIMATED_INITIAL_SESSION_TOKENS - sessionTotalTokens);

  const renderTokenUsageContent = () => {
    if (isScrolledDown) {
      return (
        <>
          <CardHeader className="py-2 px-4 border-b">
            <CardTitle className="flex items-center text-base font-semibold">
              <Coins className="mr-2 h-4 w-4 text-primary" />Token Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center">
                <span className="text-muted-foreground mr-1">Last Op:</span>
                <span className="font-semibold">{currentRequestTokens?.toLocaleString() ?? 'N/A'}</span>
                {(detailedTokenUsage?.text || detailedTokenUsage?.image) && (
                  <span className="ml-1 text-muted-foreground">
                    (
                    {detailedTokenUsage.text !== undefined && `Txt: ${detailedTokenUsage.text.toLocaleString()}`}
                    {detailedTokenUsage.text !== undefined && detailedTokenUsage.image !== undefined && ', '}
                    {detailedTokenUsage.image !== undefined && `Img: ${detailedTokenUsage.image.toLocaleString()}`}
                    )
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <span className="text-muted-foreground mr-1">Session:</span>
                <span className="font-semibold">{sessionTotalTokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <span className="text-muted-foreground mr-1">Quota:</span>
                <span className="font-semibold">{ESTIMATED_INITIAL_SESSION_TOKENS.toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <span className="text-muted-foreground mr-1">Rem:</span>
                <span className={`font-semibold ${tokensLeftInSession <= 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {tokensLeftInSession.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </>
      );
    }

    // Normal view
    return (
      <>
        <CardHeader>
          <CardTitle className="flex items-center"><Coins className="mr-2 h-6 w-6 text-primary" />Token Usage</CardTitle>
          <CardDescription>Overview of your token consumption for AI operations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tokens Used (Last Operation):</span>
            <span className="font-semibold">{currentRequestTokens?.toLocaleString() ?? 'N/A'}</span>
          </div>
          {detailedTokenUsage?.text && (
            <div className="flex justify-between pl-4">
              <span className="text-muted-foreground text-xs">└ Text Generation:</span>
              <span className="font-semibold text-xs">{detailedTokenUsage.text.toLocaleString()}</span>
            </div>
          )}
          {detailedTokenUsage?.image && (
            <div className="flex justify-between pl-4">
              <span className="text-muted-foreground text-xs">└ Image Generation:</span>
              <span className="font-semibold text-xs">{detailedTokenUsage.image.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Tokens Used (Session):</span>
            <span className="font-semibold">{sessionTotalTokens.toLocaleString()}</span>
          </div>
           <div className="flex justify-between">
            <span className="text-muted-foreground">Assumed Session Quota:</span>
            <span className="font-semibold">{ESTIMATED_INITIAL_SESSION_TOKENS.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tokens Remaining (this Session):</span>
            <span className={`font-semibold ${tokensLeftInSession <= 0 ? 'text-destructive' : ''}`}>
              {tokensLeftInSession.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </>
    );
  };


  return (
    <div className="space-y-8">
      <GlobalLoader isLoading={isLoading} operationMessage={currentOperationMessage} />
      
      <div 
        className={cn(
          "sticky z-40 transition-all duration-300 ease-in-out",
          isScrolledDown ? "bg-background shadow-md py-2" : "bg-transparent shadow-none pt-0" 
        )}
        style={{ top: HEADER_HEIGHT_OFFSET }}
      >
        <div className="container mx-auto px-0 md:px-4"> {/* Match header container padding, but allow full width on mobile for the card */}
          <Card className={cn(
            "w-full transition-all duration-300 ease-in-out",
            isScrolledDown ? "shadow-none border-0 rounded-none md:rounded-lg" : "shadow-lg" 
          )}>
            {renderTokenUsageContent()}
          </Card>
        </div>
      </div>
      
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
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="generateMainImage"
              checked={generateMainImage}
              onCheckedChange={setGenerateMainImage}
              disabled={isLoading}
              aria-label="Toggle main image generation for the article"
            />
            <Label htmlFor="generateMainImage" className="text-base font-normal cursor-pointer">
              <ImageIcon className="inline-block mr-2 h-5 w-5 align-text-bottom" />
              Generate a main image for the article
            </Label>
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
            <CardDescription>Edit the generated Markdown directly or use AI to revise it. The main image (if generated) is at the top.</CardDescription>
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
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center text-xl"><FileText size={20} className="mr-2 text-muted-foreground" /> Original Article</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                 <Textarea
                    value={originalArticleForTranslation}
                    readOnly 
                    className="min-h-[300px] text-sm resize-y bg-muted/20 h-full"
                    aria-label="Original article content before translation (Markdown)"
                  />
              </CardContent>
            </Card>
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center text-xl"><Languages size={20} className="mr-2 text-muted-foreground" /> Translated to {targetLanguage}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <MarkdownPreview markdown={translatedArticleMarkdown} minHeight="300px" className="h-full" ariaLabel={`Article translated to ${targetLanguage}`}/>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {originalArticleForTranslation && translatedArticleMarkdown && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Layers className="mr-2 h-6 w-6 text-primary" />Refine Final Format</CardTitle>
            <CardDescription>Combine the original and translated article into a single output. Choose your preferred format.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-lg font-medium">Combination Format</Label>
              <RadioGroup
                value={selectedCombineFormat}
                onValueChange={(value: 'simple' | 'detailsTag') => setSelectedCombineFormat(value)}
                className="mt-2 space-y-2"
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="simple" id="format-simple" />
                  <Label htmlFor="format-simple" className="font-normal">Simple (Original then Translation with separator)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="detailsTag" id="format-details" />
                  <Label htmlFor="format-details" className="font-normal">Details Tag (Translation expandable under original)</Label>
                </div>
              </RadioGroup>
            </div>
            <Button onClick={handleCombineFormat} disabled={isLoading || !originalArticleForTranslation.trim() || !translatedArticleMarkdown.trim()} className="w-full md:w-auto">
              {isCombiningFormat ? <LoadingSpinner className="mr-2" /> : <CheckSquare className="mr-2" />}
              Generate Combined Output
            </Button>

            {finalCombinedOutput && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-2">Combined Article Output:</h3>
                 <ArticleEditor
                    markdown={finalCombinedOutput}
                    onMarkdownChange={setFinalCombinedOutput}
                    isLoading={isCombiningFormat} 
                  />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
