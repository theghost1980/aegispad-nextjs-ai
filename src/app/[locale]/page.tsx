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
import { detectLanguage, DetectLanguageInput, DetectLanguageOutput } from '@/ai/flows/detect-language-flow';
import { Wand2, Edit3, Languages, Eraser, FileText, Globe, Coins, Image as ImageIcon, Layers, CheckSquare, FileTerminal, ClipboardCopy, SearchCheck, PencilLine } from 'lucide-react';
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

type InitialWorkflow = 'aiCreate' | 'userWrite';

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

  const [initialWorkflow, setInitialWorkflow] = useState<InitialWorkflow>('aiCreate');
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  const [isProcessing, startProcessingTransition] = useTransition(); 

  const [clientLoaded, setClientLoaded] = useState(false);

  const { toast } = useToast();

  const isLoading = isProcessing;
  
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
    setCurrentOperationMessage(generateMainImage ? t('startArticleCard.creatingArticleWithImageMessage') : t('startArticleCard.creatingArticleMessage'));
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setFinalCombinedOutput(''); 
    setDetectedLanguage(null);

    startProcessingTransition(async () => {
      let totalTokensForOperation = 0;
      let operationDetails = { text: 0, image: 0 };

      try {
        const input: CreateArticleInput = { prompt, generateMainImage };
        const result: CreateArticleOutput = await createArticle(input);
        setArticleMarkdown(result.article);
        
        totalTokensForOperation += result.tokenUsage.totalTokens;
        operationDetails.text += result.tokenUsage.textGenerationTokens || 0;
        operationDetails.image += result.tokenUsage.imageGenerationTokens || 0;
        
        handleTokenUpdate(totalTokensForOperation, operationDetails);
        setTranslatedArticleMarkdown('');
        setOriginalArticleForTranslation('');
        toast({ title: t('toastMessages.successTitle'), description: result.mainImageUrl ? t('toastMessages.articleCreatedWithImageSuccess') : t('toastMessages.articleCreatedSuccess') });
      
      } catch (error)
 {
        console.error('Error creating article:', error);
        toast({ title: t('toastMessages.errorTitle'), description: t('toastMessages.createFailedError'), variant: 'destructive' });
      } finally {
        setCurrentOperationMessage(null);
      }
    });
  };
  
  const handleStartUserWriting = () => {
    setCurrentOperationMessage(null);
    setPrompt(''); 
    setArticleMarkdown(t('userWriting.startPlaceholder')); 
    setTargetLanguage(availableLanguages[0].value);
    setTranslatedArticleMarkdown('');
    setOriginalArticleForTranslation('');
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setGenerateMainImage(false); 
    setFinalCombinedOutput('');
    setSelectedCombineFormat('simple');
    setDetectedLanguage(null);
    toast({ title: t('toastMessages.successTitle'), description: t('toastMessages.userWritingStartedMessage') });
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
    startProcessingTransition(async () => {
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
    
    setCurrentRequestTokens(null);
    setDetailedTokenUsage(null);
    setFinalCombinedOutput('');

    startProcessingTransition(async () => {
      let totalTokensForOperation = 0;
      let operationDetails = { text: 0, image: 0 }; // Image tokens won't be used here but keep structure
      let currentArticleContent = articleMarkdown;
      let sourceLanguage = detectedLanguage;

      try {
        if (!sourceLanguage && currentArticleContent.trim()) {
          setCurrentOperationMessage(t('detectLanguageCard.detectingLanguageMessage'));
          const detectInput: DetectLanguageInput = { text: currentArticleContent };
          const detectResult: DetectLanguageOutput = await detectLanguage(detectInput);
          setDetectedLanguage(detectResult.language);
          sourceLanguage = detectResult.language;
          totalTokensForOperation += detectResult.tokenUsage.totalTokens;
          operationDetails.text += detectResult.tokenUsage.totalTokens;
          toast({ title: t('toastMessages.successTitle'), description: t('toastMessages.languageDetectedSuccess', { language: sourceLanguage }) });
        }
        
        setCurrentOperationMessage(t('translateArticleCard.translatingArticleMessage'));
        setOriginalArticleForTranslation(currentArticleContent);
        const input: TranslateArticleInput = { article: currentArticleContent, targetLanguage };
        const result: TranslateArticleOutput = await translateArticle(input);
        setTranslatedArticleMarkdown(result.translatedArticle);
        
        totalTokensForOperation += result.tokenUsage.totalTokens;
        operationDetails.text += result.tokenUsage.totalTokens;
        
        handleTokenUpdate(totalTokensForOperation, operationDetails);
        toast({ title: t('toastMessages.successTitle'), description: t('toastMessages.articleTranslatedSuccess', { targetLanguage }) });
      } catch (error) {
        console.error('Error in translation process:', error);
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
    startProcessingTransition(() => {
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
    let summary = `${t('sessionSummaryCard.title')}\n`;
    summary += "=============================\n\n";
    summary += `${t('sessionSummaryCard.workflowLabel')} ${initialWorkflow === 'aiCreate' ? t('startArticleCard.aiCreateLabel') : t('startArticleCard.userWriteLabel')}\n`;
    if (detectedLanguage) {
      summary += `${t('sessionSummaryCard.detectedLanguageLabel')} ${detectedLanguage}\n`;
    }
    summary += "\n";
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
    startProcessingTransition(async () => {
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
    setInitialWorkflow('aiCreate');
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
    setDetectedLanguage(null);
    setSessionTotalTokens(0);
    setSessionTextTokensUsed(0);
    setSessionImageTokensUsed(0);
    toast({ title: t('toastMessages.clearedTitle'), description: t('toastMessages.allClearedMessage') });
  };
  
  if (!clientLoaded) {
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


  const mainActionButtonText = initialWorkflow === 'aiCreate' 
    ? t('startArticleCard.aiCreateButtonText') 
    : t('startArticleCard.userWriteButtonText');

  const mainActionButtonIcon = initialWorkflow === 'aiCreate' 
    ? <Wand2 className="mr-2" /> 
    : <PencilLine className="mr-2" />;
  
  const isMainButtonDisabled = initialWorkflow === 'aiCreate' 
    ? (isLoading || !prompt.trim()) 
    : isLoading;

  const mainActionHandler = initialWorkflow === 'aiCreate' ? handleCreateArticle : handleStartUserWriting;
  
  const currentLoadingMessageForButton = initialWorkflow === 'aiCreate' 
    ? (generateMainImage ? t('startArticleCard.creatingArticleWithImageMessage') : t('startArticleCard.creatingArticleMessage'))
    : t('startArticleCard.startingUserWritingMessage');


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
          <CardTitle className="flex items-center">
            {initialWorkflow === 'aiCreate' ? <Wand2 className="mr-2 h-6 w-6 text-primary" /> : <PencilLine className="mr-2 h-6 w-6 text-primary" />}
            {t('startArticleCard.title')}
          </CardTitle>
          <CardDescription>{t('startArticleCard.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-lg font-medium">{t('startArticleCard.workflowTitle')}</Label>
            <RadioGroup
              value={initialWorkflow}
              onValueChange={(value: InitialWorkflow) => {
                setInitialWorkflow(value);
                if (value === 'userWrite') {
                  setPrompt(''); 
                  setGenerateMainImage(false);
                }
              }}
              className="mt-2 space-y-2"
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aiCreate" id="workflow-ai-create" />
                <Label htmlFor="workflow-ai-create" className="font-normal">{t('startArticleCard.aiCreateLabel')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="userWrite" id="workflow-user-write" />
                <Label htmlFor="workflow-user-write" className="font-normal">{t('startArticleCard.userWriteLabel')}</Label>
              </div>
            </RadioGroup>
          </div>

          {initialWorkflow === 'aiCreate' && (
            <>
              <div>
                <Label htmlFor="prompt" className="text-lg font-medium">{t('startArticleCard.promptLabel')}</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('startArticleCard.promptPlaceholder')}
                  className="min-h-[120px] mt-1 text-base"
                  disabled={isLoading}
                  aria-label={t('startArticleCard.promptLabel')}
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="generateMainImage"
                  checked={generateMainImage}
                  onCheckedChange={setGenerateMainImage}
                  disabled={isLoading}
                  aria-label={t('startArticleCard.generateImageLabel')}
                />
                <Label htmlFor="generateMainImage" className="text-base font-normal cursor-pointer">
                  <ImageIcon className="inline-block mr-2 h-5 w-5 align-text-bottom" />
                  {t('startArticleCard.generateImageLabel')}
                </Label>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button onClick={clearAll} variant="outline" disabled={isLoading}>
            <Eraser className="mr-2" /> {t('startArticleCard.clearAllButton')}
          </Button>
          <Button onClick={mainActionHandler} disabled={isMainButtonDisabled}>
            {isLoading && (currentOperationMessage === currentLoadingMessageForButton || currentOperationMessage?.startsWith(t('startArticleCard.creatingArticleMessage').substring(0,10))) ? <LoadingSpinner className="mr-2" /> : mainActionButtonIcon}
            {mainActionButtonText}
          </Button>
        </CardFooter>
      </Card>

      {detectedLanguage && articleMarkdown && (
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center text-sm">
              <SearchCheck className="mr-2 h-5 w-5 text-green-600" />
              <span>{t('detectLanguageCard.detectedLanguageLabel')} <strong>{detectedLanguage}</strong></span>
            </div>
          </CardContent>
        </Card>
      )}
      
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
              {isLoading && currentOperationMessage === t('editArticleCard.revisingArticleMessage') ? <LoadingSpinner className="mr-2" /> : <Edit3 className="mr-2" />}
              {t('editArticleCard.reviseButton')}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {articleMarkdown && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Languages className="mr-2 h-6 w-6 text-primary" />{t('translateArticleCard.title')}</CardTitle>
            <CardDescription>
              {detectedLanguage 
                ? t('translateArticleCard.descriptionWithSource', { detectedLanguage })
                : t('translateArticleCard.description')}
            </CardDescription>
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
              {isLoading && currentOperationMessage === t('translateArticleCard.translatingArticleMessage') ? <LoadingSpinner className="mr-2" /> : <Languages className="mr-2" />}
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
                <CardTitle className="flex items-center text-xl"><FileText size={20} className="mr-2 text-muted-foreground" /> 
                {detectedLanguage ? `${t('translationResultCard.originalArticleTitle')} (${detectedLanguage})` : t('translationResultCard.originalArticleTitle')}
                </CardTitle>
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
              {isLoading && currentOperationMessage === t('refineFormatCard.generatingCombinedMessage') ? <LoadingSpinner className="mr-2" /> : <CheckSquare className="mr-2" />}
              {t('refineFormatCard.generateCombinedButton')}
            </Button>

            {finalCombinedOutput && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-2">{t('refineFormatCard.combinedOutputTitle')}</h3>
                 <ArticleEditor
                    markdown={finalCombinedOutput}
                    onMarkdownChange={setFinalCombinedOutput}
                    isLoading={isLoading && currentOperationMessage === t('refineFormatCard.generatingCombinedMessage')} 
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
              <h4 className="text-lg font-semibold mb-2">{t('sessionSummaryCard.workflowTitle')}</h4>
              <div className="p-3 border rounded-md bg-muted/30 text-sm">
                <p>
                  {t('sessionSummaryCard.workflowLabel')}
                  <span className="font-semibold ml-1">
                    {initialWorkflow === 'aiCreate' 
                      ? t('startArticleCard.aiCreateLabel') 
                      : t('startArticleCard.userWriteLabel')}
                  </span>
                </p>
                {detectedLanguage && (
                  <p className="mt-1">
                    {t('sessionSummaryCard.detectedLanguageLabel')}
                    <span className="font-semibold ml-1">{detectedLanguage}</span>
                  </p>
                )}
              </div>
            </div>
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
              {isLoading && currentOperationMessage === t('sessionSummaryCard.preparingSummaryMessage') ? <LoadingSpinner className="mr-2" /> : <ClipboardCopy className="mr-2" />}
              {t('sessionSummaryCard.copySummaryButton')}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

    