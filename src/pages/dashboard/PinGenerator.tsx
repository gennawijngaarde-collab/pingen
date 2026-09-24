'use client';

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { usePins } from '@/hooks/usePins';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAiStatus } from '@/hooks/useAiStatus';
import {
  generatePinContent,
  generatePinConcept,
  generatePinImage,
  mockGeneratePinContent,
  formatAiError,
  type GeneratedPinContent,
} from '@/lib/ai';
import { checkForDuplicates } from '@/lib/duplicate-detection';
import { useI18n } from '@/i18n/I18nProvider';
import { fmt } from '@/i18n/fmt';
import type { GeneratorDictionary } from '@/i18n/sections/generator';
import {
  Wand2,
  Upload,
  Link,
  Hash,
  Sparkles,
  RefreshCw,
  ImageIcon,
  Loader2,
  Copy,
  Calendar,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

// `value` is passed to the AI prompts / stored on the pin and must stay stable;
// only `labelKey` is localized.
const niches: { value: string; labelKey: keyof GeneratorDictionary['niches'] }[] = [
  { value: 'Décoration', labelKey: 'decoration' },
  { value: 'Mode', labelKey: 'fashion' },
  { value: 'Cuisine', labelKey: 'cooking' },
  { value: 'Voyage', labelKey: 'travel' },
  { value: 'Fitness', labelKey: 'fitness' },
  { value: 'DIY', labelKey: 'diy' },
  { value: 'Technologie', labelKey: 'technology' },
  { value: 'Business', labelKey: 'business' },
  { value: 'Art', labelKey: 'art' },
  { value: 'Photographie', labelKey: 'photography' },
];

const tones: { value: string; labelKey: keyof GeneratorDictionary['tones'] }[] = [
  { value: 'professional', labelKey: 'professional' },
  { value: 'casual', labelKey: 'casual' },
  { value: 'inspiring', labelKey: 'inspiring' },
  { value: 'educational', labelKey: 'educational' },
  { value: 'funny', labelKey: 'funny' },
];

export function PinGenerator() {
  const { t } = useI18n();
  const g = t.generator;
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createPin, pins, fetchPins } = usePins();
  const { hasTextAi } = useAiStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState('auto');
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [selectedTone, setSelectedTone] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedPinContent | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Business auto mode
  const [businessDescription, setBusinessDescription] = useState('');
  const [productOrOffer, setProductOrOffer] = useState('');
  const [audience, setAudience] = useState('');

  // Charger les pins existants au montage du composant
  useEffect(() => {
    void fetchPins();
  }, [fetchPins]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setUploadProgress(100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    const url = imageUrl.trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      toast({
        title: g.urlInvalidTitle,
        description: g.urlInvalidDescription,
        variant: 'destructive',
      });
      return;
    }

    setIsCheckingUrl(true);
    const img = new Image();
    img.onload = () => {
      setIsCheckingUrl(false);
      setSelectedImage(url);
    };
    img.onerror = () => {
      setIsCheckingUrl(false);
      setSelectedImage(null);
      toast({
        title: g.imageNotFoundTitle,
        description: g.imageNotFoundDescription,
        variant: 'destructive',
      });
    };
    img.src = url;
  };

  const handleGenerateFromImage = async () => {
    if (!selectedImage) {
      toast({
        title: g.imageRequiredTitle,
        description: g.imageRequiredDescription,
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationStep(g.stepAnalyzingImage);

    try {
      const content = hasTextAi
        ? await generatePinContent(selectedImage, selectedNiche || undefined, selectedTone || undefined)
        : mockGeneratePinContent();

      setGeneratedContent(content);
      toast({
        title: g.contentGeneratedTitle,
        description: hasTextAi ? g.contentGeneratedAi : g.contentGeneratedDemo,
      });
    } catch {
      toast({
        title: g.errorTitle,
        description: g.generateContentFailed,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleGenerateFromBusiness = async () => {
    const business = businessDescription.trim();
    setStatusError(null);
    setStatusMessage(null);

    if (!business) {
      const msg = g.businessRequiredMessage;
      setStatusError(msg);
      toast({
        title: g.businessRequiredTitle,
        description: msg,
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationStep(g.stepConcept);
    setStatusMessage(g.statusGenerating);

    try {
      let pinImageUrl: string;

      const concept = await generatePinConcept({
        business,
        productOrOffer: productOrOffer.trim() || undefined,
        audience: audience.trim() || undefined,
        niche: selectedNiche || undefined,
        tone: selectedTone || undefined,
      });

      const content: GeneratedPinContent = {
        title: concept.title,
        description: concept.description,
        hashtags: concept.hashtags,
        altText: concept.altText,
      };
      setGeneratedContent(content);

      // Vérifier les doublons
      const duplicateCheck = checkForDuplicates(
        { title: content.title, description: content.description },
        pins
      );
      
      if (duplicateCheck.isDuplicate || duplicateCheck.isSimilar) {
        setDuplicateWarning(duplicateCheck.message);
        toast({
          title: duplicateCheck.isDuplicate ? g.duplicateDetectedTitle : g.similarPinTitle,
          description: duplicateCheck.message ?? undefined,
          variant: duplicateCheck.isDuplicate ? 'destructive' : 'default',
        });
      } else {
        setDuplicateWarning(null);
      }

      setGenerationStep(g.stepImage);
      setStatusMessage(g.statusCreatingImage);

      let imageFailedMessage: string | null = null;
      try {
        pinImageUrl = await generatePinImage(
          concept.imagePrompt,
          concept.overlayText || concept.title
        );
      } catch (imageError) {
        console.error(imageError);
        imageFailedMessage = formatAiError(imageError);
        pinImageUrl = `https://placehold.co/768x1344/E3001B/FFFFFF/png?text=${encodeURIComponent('Pin')}`;
        setStatusError(fmt(g.textOkImageFailed, { error: imageFailedMessage }));
        toast({
          title: g.textOkImageFailedTitle,
          description: imageFailedMessage,
          variant: 'destructive',
        });
      }

      setSelectedImage(pinImageUrl);
      setGeneratedContent(content);

      if (!imageFailedMessage) {
        setStatusMessage(g.statusSuccess);
        setStatusError(null);
        toast({
          title: g.pinGeneratedTitle,
          description: g.pinGeneratedDescription,
        });
      }
    } catch (error) {
      console.error(error);
      const msg = formatAiError(error);
      setStatusError(msg);
      setStatusMessage(null);
      toast({
        title: g.generationErrorTitle,
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleGenerate = () => {
    if (activeTab === 'auto') {
      return handleGenerateFromBusiness();
    }
    return handleGenerateFromImage();
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: g.copiedTitle,
      description: g.copiedDescription,
    });
  };

  const buildPinPayload = (status: 'draft' | 'scheduled', scheduledAt: string | null) => ({
    title: generatedContent!.title,
    description: generatedContent!.description,
    image_url: selectedImage!,
    link: null,
    board_id: null,
    board_name: selectedNiche || 'Général',
    status,
    scheduled_at: scheduledAt,
    published_at: null,
    pinterest_pin_id: null,
    hashtags: generatedContent!.hashtags,
    alt_text: generatedContent!.altText,
    retry_count: 0,
    error_message: null,
  });

  const handleSavePin = async () => {
    if (!generatedContent || !selectedImage) return;

    // Vérifier une dernière fois les doublons exacts avant sauvegarde
    const duplicateCheck = checkForDuplicates(
      { title: generatedContent.title, description: generatedContent.description },
      pins
    );

    if (duplicateCheck.isDuplicate) {
      toast({
        title: g.exactDuplicateTitle,
        description: fmt(g.exactDuplicateDescription, {
          message: duplicateCheck.message ?? g.identicalPinFound,
        }),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    const pin = await createPin(buildPinPayload('draft', null));
    setIsSaving(false);

    if (pin) {
      setDuplicateWarning(null); // Effacer l'avertissement après sauvegarde
      toast({
        title: g.pinSavedTitle,
        description: duplicateCheck.isSimilar
          ? g.pinSavedDespiteSimilarity
          : g.pinSavedDescription,
      });
      navigate(ROUTES.schedule);
    } else {
      toast({
        title: g.errorTitle,
        description: g.savePinFailed,
        variant: 'destructive',
      });
    }
  };

  const handleSchedulePin = async () => {
    if (!generatedContent || !selectedImage) return;

    // Vérifier une dernière fois les doublons exacts avant planification
    const duplicateCheck = checkForDuplicates(
      { title: generatedContent.title, description: generatedContent.description },
      pins
    );

    if (duplicateCheck.isDuplicate) {
      toast({
        title: g.exactDuplicateTitle,
        description: fmt(g.exactDuplicateDescription, {
          message: duplicateCheck.message ?? g.identicalPinFound,
        }),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const pin = await createPin(buildPinPayload('scheduled', scheduledAt));
    setIsSaving(false);

    if (pin) {
      setDuplicateWarning(null); // Effacer l'avertissement après planification
      toast({
        title: g.pinScheduledTitle,
        description: duplicateCheck.isSimilar
          ? g.pinScheduledDespiteSimilarity
          : g.pinScheduledDescription,
      });
      navigate(ROUTES.schedule);
    } else {
      toast({
        title: g.errorTitle,
        description: g.schedulePinFailed,
        variant: 'destructive',
      });
    }
  };

  const canGenerate =
    activeTab === 'auto'
      ? !isGenerating
      : Boolean(selectedImage) && !isGenerating;

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{g.pageTitle}</h2>
          <p className="text-muted-foreground">{g.pageSubtitle}</p>
        </div>
      </div>

      {(statusError || statusMessage || isGenerating || duplicateWarning) && (
        <div className="space-y-3">
          {(statusError || statusMessage || isGenerating) && (
            <div
              className={`rounded-lg border p-4 text-sm ${
                statusError
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-primary/20 bg-primary/5 text-foreground'
              }`}
            >
              {isGenerating && (
                <p className="flex items-center gap-2 font-medium mb-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {generationStep || g.generatingInProgress}
                </p>
              )}
              {statusError ? <p className="break-words">{statusError}</p> : statusMessage ? <p className="break-words">{statusMessage}</p> : null}
            </div>
          )}
          
          {duplicateWarning && !isGenerating && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 mb-1">{g.similarContentTitle}</p>
                  <p className="text-amber-800 break-words">{duplicateWarning}</p>
                  <p className="text-amber-700 text-xs mt-2">{g.similarContentHint}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0">
        <div className="space-y-6 min-w-0">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="text-lg">{g.sourceCardTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="auto">
                    <Briefcase className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{g.tabAuto}</span>
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{g.tabUpload}</span>
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <Link className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{g.tabUrl}</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="auto" className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="business" className="mb-2 block">
                      {g.businessLabel}
                    </Label>
                    <Textarea
                      id="business"
                      placeholder={g.businessPlaceholder}
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="offer" className="mb-2 block">
                      {g.offerLabel}
                    </Label>
                    <Input
                      id="offer"
                      placeholder={g.offerPlaceholder}
                      value={productOrOffer}
                      onChange={(e) => setProductOrOffer(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="audience" className="mb-2 block">
                      {g.audienceLabel}
                    </Label>
                    <Input
                      id="audience"
                      placeholder={g.audiencePlaceholder}
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {g.autoHelpBefore}
                    <strong>{g.autoHelpStrong}</strong>
                    {g.autoHelpAfter}
                  </p>
                  {selectedImage && activeTab === 'auto' && (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img
                        src={selectedImage}
                        alt={g.generatedPinAlt}
                        className="max-h-64 w-full object-cover"
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="upload" className="mt-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      selectedImage
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                  >
                    {selectedImage && activeTab === 'upload' ? (
                      <div className="relative">
                        <img
                          src={selectedImage}
                          alt={g.selectedImageAlt}
                          className="max-h-64 mx-auto rounded-lg"
                        />
                        <button
                          type="button"
                          aria-label={g.removeImage}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(null);
                            setUploadProgress(0);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ImageIcon className="w-8 h-8 text-primary" />
                        </div>
                        <p className="font-medium mb-2">{g.uploadPrompt}</p>
                        <p className="text-sm text-muted-foreground">{g.uploadHint}</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-4">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        {fmt(g.uploading, { percent: uploadProgress })}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="url" className="mt-4 space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={g.urlPlaceholder}
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUrlSubmit();
                      }}
                    />
                    <Button
                      onClick={handleUrlSubmit}
                      variant="secondary"
                      disabled={isCheckingUrl}
                    >
                      {isCheckingUrl ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        g.urlSubmit
                      )}
                    </Button>
                  </div>
                  {selectedImage && activeTab === 'url' && (
                    <div className="relative">
                      <img
                        src={selectedImage}
                        alt={g.selectedImageAlt}
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        aria-label={g.removeImage}
                        onClick={() => {
                          setSelectedImage(null);
                          setImageUrl('');
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{g.optionsCardTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">{g.nicheLabel}</Label>
                <div className="flex flex-wrap gap-2">
                  {niches.map((niche) => (
                    <button
                      key={niche.value}
                      type="button"
                      onClick={() =>
                        setSelectedNiche(selectedNiche === niche.value ? '' : niche.value)
                      }
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedNiche === niche.value
                          ? 'bg-primary text-white'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {g.niches[niche.labelKey]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">{g.toneLabel}</Label>
                <div className="flex flex-wrap gap-2">
                  {tones.map((tone) => (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() =>
                        setSelectedTone(selectedTone === tone.value ? '' : tone.value)
                      }
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedTone === tone.value
                          ? 'bg-primary text-white'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {g.tones[tone.labelKey]}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => {
                  void handleGenerate();
                }}
                disabled={!canGenerate}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {generationStep || g.generatingInProgress}
                  </>
                ) : activeTab === 'auto' ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {g.generateImageAndText}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {g.generateContent}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 min-w-0">
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">{g.generatedCardTitle}</CardTitle>
              {generatedContent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {g.regenerate}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!generatedContent ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>{g.emptyState}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Label className="flex items-center justify-between mb-2">
                      {g.titleLabel}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedContent.title)}
                        className="text-primary hover:underline text-sm"
                      >
                        <Copy className="w-4 h-4 inline mr-1" />
                        {g.copy}
                      </button>
                    </Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{generatedContent.title}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center justify-between mb-2">
                      {g.descriptionLabel}
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(generatedContent.description)
                        }
                        className="text-primary hover:underline text-sm"
                      >
                        <Copy className="w-4 h-4 inline mr-1" />
                        {g.copy}
                      </button>
                    </Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p>{generatedContent.description}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        {g.hashtagsLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(generatedContent.hashtags.join(' '))
                        }
                        className="text-primary hover:underline text-sm"
                      >
                        <Copy className="w-4 h-4 inline mr-1" />
                        {g.copy}
                      </button>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.hashtags.map((hashtag, index) => (
                        <Badge key={index} variant="secondary">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">{g.altTextLabel}</Label>
                    <p className="text-sm text-muted-foreground">
                      {generatedContent.altText}
                    </p>
                  </div>

                  {selectedImage && (
                    <div className="border rounded-lg p-4">
                      <Label className="mb-2 block">{g.previewLabel}</Label>
                      <div className="relative rounded-lg overflow-hidden aspect-[2/3] max-h-80 mx-auto bg-muted">
                        <img
                          src={selectedImage}
                          alt={g.previewAlt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <p className="text-white font-semibold line-clamp-2">
                            {generatedContent.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleSavePin}
                      disabled={isSaving}
                    >
                      {g.save}
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={handleSchedulePin}
                      disabled={isSaving}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {g.schedule}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
