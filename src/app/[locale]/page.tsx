// src/app/[locale]/page.tsx
"use client";

import { useState, useTransition, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
import { Wand2, Edit3, Languages, Eraser, FileText, Globe, Coins, Image as ImageIcon, Layers, CheckSquare, FileTerminal, ClipboardCopy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

export default function ArticleForgePage() {
  const t = useTranslations('ArticleForgePage');
  const tTokenUsage = useTranslations('TokenUsage');

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
  const [sessionTextTokensUsed, setSessionTextTokensUsed] = useState<number>(0);
  const [sessionImageTokensUsed, setSessionImageTokensUsed] = useState<number>(0);

  const [finalCombinedOutput, setFinalCombinedOutput] = useState<string>('');
  const [selectedCombineFormat, setSelectedCombineFormat] = useState<'simple' | 'detailsTag'>('simple');

  const [isCreating, startCreateTransition] = useTransition();
  const [isRevising, startReviseTransition] = useTransition();
  const [isTranslating, startTranslateTransition] = useTransition();
  const [isCombiningFormat, startCombineFormatTransition] = useTransition();
  const [isCopying, startCopyTransition] = useTransition();

  const [clientLoaded, setClientLoaded] = useState(false);

  const { toast } = useToast();

  const isLoading = isCreating || isRevising || isTranslating || isCombiningFormat || isCopying;
  
  useEffect(() => {
    setClientLoaded(true);
  }, []);

  const handleTokenUpdate = (tokensUsed: number, details?: {text?: number, image?:number}) => {
    setCurrentRequestTokens(tokensUsed);
    setSessionTotalTokens(prevTotal => prevTotal + tokensUsed);
    
    if (details) {
      setDetailedTokenUsage(details);
      if (details.text) {
        setSessionTextTokensUsed(prev => prev + (details.text || 0));
      }
      if (details.image) {
        setSessionImageTokensUsed(prev => prev + (details.image || 0));
      }
    } else {
      setSessionTextTokensUsed(prev => prev + tokensUsed);
      setDetailedTokenUsage(null);
    }
  };

  const handleCreateArticle = async () => {
    if (!prompt.trim()) {
      toast({ title: t('toastMessages.errorTitle'), description: t('toastMessages.promptEmptyError'), variant: 'destructive' });
      return;
    }
    setCurrentOperationMessage(generateMainImage ? t('createArticleCard.creatingArticleWithImageMessage') : t('createArticleCard.creatingArticleMessage'));
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
        toast({ title: t('toastMessages.successTitle'), description: result.mainImageUrl ? t('toastMessages.articleCreatedWithImageSuccess') : t('toastMessages.articleCreatedSuccess') });
      } catch (error) {
        console.error('Error creating article:', error);
        toast({ title: t('toastMessages.errorTitle'), description: t('toastMessages.createFailedError'), variant: 'destructive' });
      } finally {
        setCurrentOperationMessage(null);
      }
    });
  };

  const handleReviseArticle = async () => {
    if (!articleMarkdown.trim()) {
      toast({ title: t('toastMessages.errorTitle'), description: t('toastMessages.articleEmptyError'), variant: 'destructive' });
      return;
    }
    setCurrentOperationMessage(t('editArticleCard.revisingArticleMessage'));
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setFinalCombinedOutput(''); 
    startReviseTransition(async () => {
      try {
        const input: ReviseArticleInput = { article: articleMarkdown };
        const result: ReviseArticleOutput = await reviseArticle(input);
        setArticleMarkdown(result.revisedArticle);
        handleTokenUpdate(result.tokenUsage.totalTokens, { text: result.tokenUsage.totalTokens });
        setTranslatedArticleMarkdown('');
        setOriginalArticleForTranslation('');
        toast({ title: t('toastMessages.successTitle'), description: t('toastMessages.articleRevisedSuccess') });
      } catch (error) {
        console.error('Error revising article:', error);
        toast({ title: t('toastMessages.errorTitle'), description: t('toastMessages.reviseFailedError'), variant: 'destructive' });
      } finally {
        setCurrentOperationMessage(null);
      }
    });
  };

  const handleTranslateArticle = async () => {
    if (!articleMarkdown.trim()) {
      toast({ title: t('toastMessages.errorTitle'), description: t('toastMessages.articleEmptyError'), variant: 'destructive' });
      return;
    }
    if (!targetLanguage.trim()) {
      toast({ title: t('toastMessages.errorTitle'), description: t('toastMessages.targetLanguageEmptyError'), variant: 'destructive' });
      return;
    }
    setCurrentOperationMessage(t('translateArticleCard.translatingArticleMessage'));
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setFinalCombinedOutput('');
    startTranslateTransition(async () => {
      try {
        setOriginalArticleForTranslation(articleMarkdown);
        const input: TranslateArticleInput = { article: articleMarkdown, targetLanguage };
        const result: TranslateArticleOutput = await translateArticle(input);
        setTranslatedArticleMarkdown(result.translatedArticle);
        handleTokenUpdate(result.tokenUsage.totalTokens, { text: result.tokenUsage.totalTokens });
        toast({ title: t('toastMessages.successTitle'), description: t('toastMessages.articleTranslatedSuccess', { targetLanguage }) });
      } catch (error) {
        console.error('Error translating article:', error);
        toast({ title: t('toastMessages.errorTitle'), description: t('toastMessages.translateFailedError'), variant: 'destructive' });
      } finally {
        setCurrentOperationMessage(null);
      }
    });
  };

  const handleCombineFormat = () => {
    if (!originalArticleForTranslation.trim() || !translatedArticleMarkdown.trim()) {
      toast({ title: t('toastMessages.errorTitle'), description: t('toastMessages.combineEmptyError'), variant: 'destructive' });
      return;
    }
    setCurrentOperationMessage(t('refineFormatCard.generatingCombinedMessage'));
    startCombineFormatTransition(() => {
      let combined = '';
      const originalContent = originalArticleForTranslation;
      const translatedContent = translatedArticleMarkdown;

      if (selectedCombineFormat === 'simple') {
        combined = `${originalContent}\n\n<hr />\n\n## Translation (${targetLanguage})\n\n${translatedContent}`;
      } else { 
        combined = `${originalContent}\n\n<details>\n  <summary>Translation (${targetLanguage})</summary>\n\n${translatedContent}\n</details>`;
      }
      setFinalCombinedOutput(combined);
      setCurrentOperationMessage(null);
      toast({ title: t('toastMessages.successTitle'), description: t('toastMessages.combinedFormatSuccess') });
    });
  };
  
  const generateSummaryTextForCopy = () => {
    let summary = `${t('sessionSummaryCard.title')}\n`; // Using translation
    summary += "=============================\n\n";
    summary += `${t('sessionSummaryCard.tokenUsageTitle')}:\n`;
    summary += `-----------------------------\n`;
    summary += `${t('sessionSummaryCard.totalTokensUsedLabel')} ${sessionTotalTokens.toLocaleString()}\n`;
    if (sessionTextTokensUsed > 0) {
      summary += `  ${t('sessionSummaryCard.textGenerationTokensLabel')} ${sessionTextTokensUsed.toLocaleString()}\n`;
    }
    if (sessionImageTokensUsed > 0) {
      summary += `  ${t('sessionSummaryCard.imageGenerationTokensLabel')} ${sessionImageTokensUsed.toLocaleString()}\n`;
    }
    summary += "-----------------------------\n\n";
  
    if (finalCombinedOutput.trim()) {
      summary += `${t('refineFormatCard.combinedOutputTitle')}\n`;
      summary += "-----------------------------\n";
      summary += finalCombinedOutput;
    } else {
      summary += `${t('sessionSummaryCard.noFinalCombinedArticleMessage')}\n`;
    }
    return summary;
  };

  const handleCopySummary = () => {
    startCopyTransition(async () => {
      setCurrentOperationMessage(t('sessionSummaryCard.preparingSummaryMessage'));
      const summaryText = generateSummaryTextForCopy();
      try {
        await navigator.clipboard.writeText(summaryText);
        toast({ title: t('toastMessages.successTitle'), description: t('toastMessages.summaryCopiedSuccess') });
      } catch (err) {
        console.error('Failed to copy summary: ', err);
        toast({ title: t('toastMessages.errorTitle'), description: t('toastMessages.copySummaryFailedError'), variant: 'destructive' });
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
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setGenerateMainImage(false);
    setFinalCombinedOutput('');
    setSelectedCombineFormat('simple');
    setSessionTotalTokens(0);
    setSessionTextTokensUsed(0);
    setSessionImageTokensUsed(0);
    toast({ title: t('toastMessages.clearedTitle'), description: t('toastMessages.allClearedMessage') });
  };
  
  if (!clientLoaded) {
    // Consider translating this if it's shown for long
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner size={48} /> <p className="ml-2">{t('loadingSpinnerClient')}</p></div>;
  }

  const tokensLeftInSession = Math.max(0, ESTIMATED_INITIAL_SESSION_TOKENS - sessionTotalTokens);

  const renderTokenUsageDetails = () => (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{tTokenUsage('lastOp')}</span>
        <span className="font-semibold">{currentRequestTokens?.toLocaleString() ?? 'N/A'}</span>
      </div>
      {(detailedTokenUsage?.text || detailedTokenUsage?.image) && (
          <div className="pl-2 text-xs">
            {detailedTokenUsage.text !== undefined && (
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{tTokenUsage('textTokens')}</span>
                    <span className="font-semibold">{detailedTokenUsage.text.toLocaleString()}</span>
                </div>
            )}
            {detailedTokenUsage.image !== undefined && (
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{tTokenUsage('imageTokens')}</span>
                    <span className="font-semibold">{detailedTokenUsage.image.toLocaleString()}</span>
                </div>
            )}
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted-foreground">{tTokenUsage('sessionTotal')}</span>
        <span className="font-semibold">{sessionTotalTokens.toLocaleString()}</span>
      </div>
       <div className="flex justify-between">
        <span className="text-muted-foreground">{tTokenUsage('sessionQuota')}</span>
        <span className="font-semibold">{ESTIMATED_INITIAL_SESSION_TOKENS.toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{tTokenUsage('estRemaining')}</span>
        <span className={`font-semibold ${tokensLeftInSession <= 0 ? 'text-destructive' : 'text-foreground'}`}>
          {tokensLeftInSession.toLocaleString()}
        </span>
      </div>
    </div>
  );


  return (
    <div className="space-y-8">
      <GlobalLoader isLoading={isLoading} operationMessage={currentOperationMessage} />
      
      <div className="fixed top-[calc(3.5rem+1rem)] md:top-[calc(3.5rem+1.5rem)] right-4 md:right-6 z-50 w-[calc(100%-2rem)] md:w-auto max-w-xs md:max-w-sm">
        <Accordion type="single" collapsible className="w-full bg-card text-card-foreground shadow-xl rounded-lg border" defaultValue="token-stats">
          <AccordionItem value="token-stats" className="border-b-0 rounded-lg">
            <AccordionTrigger className="flex w-full items-center justify-between rounded-t-lg p-4 text-left hover:no-underline data-[state=open]:rounded-b-none data-[state=open]:border-b">
              <div className="flex items-center text-lg font-semibold">
                <Coins className="mr-2 h-5 w-5 text-primary" />
                {tTokenUsage('title')}
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 data-[state=closed]:p-0">
              {renderTokenUsageDetails()}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Wand2 className="mr-2 h-6 w-6 text-primary" />{t('createArticleCard.title')}</CardTitle>
          <CardDescription>{t('createArticleCard.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="prompt" className="text-lg font-medium">{t('createArticleCard.promptLabel')}</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('createArticleCard.promptPlaceholder')}
              className="min-h-[120px] mt-1 text-base"
              disabled={isLoading}
              aria-label={t('createArticleCard.promptLabel')}
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="generateMainImage"
              checked={generateMainImage}
              onCheckedChange={setGenerateMainImage}
              disabled={isLoading}
              aria-label={t('createArticleCard.generateImageLabel')}
            />
            <Label htmlFor="generateMainImage" className="text-base font-normal cursor-pointer">
              <ImageIcon className="inline-block mr-2 h-5 w-5 align-text-bottom" />
              {t('createArticleCard.generateImageLabel')}
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button onClick={clearAll} variant="outline" disabled={isLoading}>
            <Eraser className="mr-2" /> {t('createArticleCard.clearAllButton')}
          </Button>
          <Button onClick={handleCreateArticle} disabled={isLoading || !prompt.trim()}>
            {isCreating ? <LoadingSpinner className="mr-2" /> : <Wand2 className="mr-2" />}
            {t('createArticleCard.createArticleButton')}
          </Button>
        </CardFooter>
      </Card>

      {articleMarkdown && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Edit3 className="mr-2 h-6 w-6 text-primary" />{t('editArticleCard.title')}</CardTitle>
            <CardDescription>{t('editArticleCard.description')}</CardDescription>
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
              {t('editArticleCard.reviseButton')}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {articleMarkdown && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Languages className="mr-2 h-6 w-6 text-primary" />{t('translateArticleCard.title')}</CardTitle>
            <CardDescription>{t('translateArticleCard.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="targetLanguage" className="text-lg font-medium">{t('translateArticleCard.targetLanguageLabel')}</Label>
              <Select 
                value={targetLanguage} 
                onValueChange={setTargetLanguage}
                disabled={isLoading}
              >
                <SelectTrigger id="targetLanguage" className="mt-1 text-base" aria-label={t('translateArticleCard.targetLanguageLabel')}>
                  <SelectValue placeholder={t('translateArticleCard.selectLanguagePlaceholder')} />
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
              {t('translateArticleCard.translateButton')}
            </Button>
          </CardFooter>
        </Card>
      )}

      {translatedArticleMarkdown && originalArticleForTranslation && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Globe className="mr-2 h-6 w-6 text-primary" />{t('translationResultCard.title')}</CardTitle>
            <CardDescription>{t('translationResultCard.description', { targetLanguage })}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center text-xl"><FileText size={20} className="mr-2 text-muted-foreground" /> {t('translationResultCard.originalArticleTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                 <Textarea
                    value={originalArticleForTranslation}
                    readOnly 
                    className="min-h-[300px] text-sm resize-y bg-muted/20 h-full"
                    aria-label={t('translationResultCard.originalArticleAriaLabel')}
                  />
              </CardContent>
            </Card>
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center text-xl"><Languages size={20} className="mr-2 text-muted-foreground" /> {t('translationResultCard.translatedArticleTitle', {targetLanguage})}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <MarkdownPreview markdown={translatedArticleMarkdown} minHeight="300px" className="h-full" ariaLabel={t('translationResultCard.translatedPreviewAriaLabel', {targetLanguage})}/>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {originalArticleForTranslation && translatedArticleMarkdown && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Layers className="mr-2 h-6 w-6 text-primary" />{t('refineFormatCard.title')}</CardTitle>
            <CardDescription>{t('refineFormatCard.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-lg font-medium">{t('refineFormatCard.combinationFormatLabel')}</Label>
              <RadioGroup
                value={selectedCombineFormat}
                onValueChange={(value: 'simple' | 'detailsTag') => setSelectedCombineFormat(value)}
                className="mt-2 space-y-2"
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="simple" id="format-simple" />
                  <Label htmlFor="format-simple" className="font-normal">{t('refineFormatCard.formatSimpleLabel')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="detailsTag" id="format-details" />
                  <Label htmlFor="format-details" className="font-normal">{t('refineFormatCard.formatDetailsLabel')}</Label>
                </div>
              </RadioGroup>
            </div>
            <Button onClick={handleCombineFormat} disabled={isLoading || !originalArticleForTranslation.trim() || !translatedArticleMarkdown.trim()} className="w-full md:w-auto">
              {isCombiningFormat ? <LoadingSpinner className="mr-2" /> : <CheckSquare className="mr-2" />}
              {t('refineFormatCard.generateCombinedButton')}
            </Button>

            {finalCombinedOutput && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-2">{t('refineFormatCard.combinedOutputTitle')}</h3>
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

      {sessionTotalTokens > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileTerminal className="mr-2 h-6 w-6 text-primary" />
              {t('sessionSummaryCard.title')}
            </CardTitle>
            <CardDescription>{t('sessionSummaryCard.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">{t('sessionSummaryCard.tokenUsageTitle')}</h4>
              <div className="space-y-1 text-sm p-3 border rounded-md bg-muted/30">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('sessionSummaryCard.totalTokensUsedLabel')}</span>
                  <span className="font-semibold">{sessionTotalTokens.toLocaleString()}</span>
                </div>
                {sessionTextTokensUsed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('sessionSummaryCard.textGenerationTokensLabel')}</span>
                    <span className="font-semibold">{sessionTextTokensUsed.toLocaleString()}</span>
                  </div>
                )}
                {sessionImageTokensUsed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('sessionSummaryCard.imageGenerationTokensLabel')}</span>
                    <span className="font-semibold">{sessionImageTokensUsed.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {finalCombinedOutput.trim() && (
              <div>
                <Label htmlFor="finalOutputReadOnly" className="text-lg font-medium">{t('sessionSummaryCard.finalCombinedArticleLabel')}</Label>
                <Textarea
                  id="finalOutputReadOnly"
                  value={finalCombinedOutput}
                  readOnly
                  className="min-h-[200px] mt-1 text-base bg-muted/30"
                  aria-label={t('sessionSummaryCard.finalCombinedArticleLabel')}
                />
              </div>
            )}
            {!finalCombinedOutput.trim() && (
              <p className="text-muted-foreground italic">{t('sessionSummaryCard.noFinalCombinedArticleMessage')}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleCopySummary} disabled={isLoading} className="w-full md:w-auto">
              {isCopying ? <LoadingSpinner className="mr-2" /> : <ClipboardCopy className="mr-2" />}
              {t('sessionSummaryCard.copySummaryButton')}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
