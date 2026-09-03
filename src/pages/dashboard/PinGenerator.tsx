'use client';

import { useState, useRef } from 'react';
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
} from 'lucide-react';

const niches = [
  'Décoration',
  'Mode',
  'Cuisine',
  'Voyage',
  'Fitness',
  'DIY',
  'Technologie',
  'Business',
  'Art',
  'Photographie',
];

const tones = [
  { value: 'professional', label: 'Professionnel' },
  { value: 'casual', label: 'Décontracté' },
  { value: 'inspiring', label: 'Inspirant' },
  { value: 'educational', label: 'Éducatif' },
  { value: 'funny', label: 'Humoristique' },
];

export function PinGenerator() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createPin } = usePins();
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

  // Business auto mode
  const [businessDescription, setBusinessDescription] = useState('');
  const [productOrOffer, setProductOrOffer] = useState('');
  const [audience, setAudience] = useState('');

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
        title: 'URL invalide',
        description: 'L\'URL doit commencer par http:// ou https://',
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
        title: 'Image introuvable',
        description:
          'Cette URL ne pointe pas vers une image. Utilisez le lien direct d\'une image (se terminant par .jpg, .png…), pas celui d\'une page web.',
        variant: 'destructive',
      });
    };
    img.src = url;
  };

  const handleGenerateFromImage = async () => {
    if (!selectedImage) {
      toast({
        title: 'Image requise',
        description: 'Veuillez d\'abord télécharger ou entrer une image.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Analyse de l\'image et rédaction…');

    try {
      const content = hasTextAi
        ? await generatePinContent(selectedImage, selectedNiche || undefined, selectedTone || undefined)
        : mockGeneratePinContent();

      setGeneratedContent(content);
      toast({
        title: 'Contenu généré !',
        description: hasTextAi
          ? 'Contenu créé par l’IA à partir de votre image.'
          : 'Mode démo : contenu simulé.',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le contenu. Réessayez.',
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
      const msg = 'Décrivez votre activité dans le champ « Votre business » pour générer un Pin.';
      setStatusError(msg);
      toast({
        title: 'Business requis',
        description: msg,
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationStep('1/2 Conception du Pin…');
    setStatusMessage('Génération en cours (texte + image, ~20–60 s)…');

    try {
      let pinImageUrl: string;
      let content: GeneratedPinContent;

      const concept = await generatePinConcept({
        business,
        productOrOffer: productOrOffer.trim() || undefined,
        audience: audience.trim() || undefined,
        niche: selectedNiche || undefined,
        tone: selectedTone || undefined,
      });

      content = {
        title: concept.title,
        description: concept.description,
        hashtags: concept.hashtags,
        altText: concept.altText,
      };
      setGeneratedContent(content);

      setGenerationStep('2/2 Génération de l\'image (Ideogram)…');
      setStatusMessage('Création de l\'image avec Ideogram…');

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
        setStatusError(`Texte généré, mais l'image a échoué : ${imageFailedMessage}`);
        toast({
          title: 'Texte OK — image en échec',
          description: imageFailedMessage,
          variant: 'destructive',
        });
      }

      setSelectedImage(pinImageUrl);
      setGeneratedContent(content);

      if (!imageFailedMessage) {
        setStatusMessage('Pin généré avec succès.');
        setStatusError(null);
        toast({
          title: 'Pin généré !',
          description:
            'Image + texte créés pour votre business. Cliquez sur Régénérer pour une autre variante.',
        });
      }
    } catch (error) {
      console.error(error);
      const msg = formatAiError(error);
      setStatusError(msg);
      setStatusMessage(null);
      toast({
        title: 'Erreur de génération',
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
      title: 'Copié !',
      description: 'Le texte a été copié dans le presse-papiers.',
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

    setIsSaving(true);
    const pin = await createPin(buildPinPayload('draft', null));
    setIsSaving(false);

    if (pin) {
      toast({
        title: 'Pin sauvegardé !',
        description: 'Votre Pin a été ajouté aux brouillons.',
      });
      navigate(ROUTES.schedule);
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le pin.',
        variant: 'destructive',
      });
    }
  };

  const handleSchedulePin = async () => {
    if (!generatedContent || !selectedImage) return;

    setIsSaving(true);
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const pin = await createPin(buildPinPayload('scheduled', scheduledAt));
    setIsSaving(false);

    if (pin) {
      toast({
        title: 'Pin planifié !',
        description: 'Votre Pin sera publié dans 1 heure. Modifiez la date depuis la planification.',
      });
      navigate(ROUTES.schedule);
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de planifier le pin.',
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
          <h2 className="text-2xl font-bold">Générateur de Pins</h2>
          <p className="text-muted-foreground">
            Créez des Pins optimisés avec l&apos;aide de l&apos;IA — image + texte selon votre business
          </p>
        </div>
      </div>

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
              {generationStep || 'Génération en cours…'}
            </p>
          )}
          {statusError ? <p className="break-words">{statusError}</p> : statusMessage ? <p className="break-words">{statusMessage}</p> : null}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0">
        <div className="space-y-6 min-w-0">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="text-lg">1. Source du Pin</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="auto">
                    <Briefcase className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Auto</span>
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Upload</span>
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <Link className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">URL</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="auto" className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="business" className="mb-2 block">
                      Votre business *
                    </Label>
                    <Textarea
                      id="business"
                      placeholder="Ex. Boutique de décoration bohème pour petits appartements, style naturel et cosy…"
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="offer" className="mb-2 block">
                      Produit / offre (optionnel)
                    </Label>
                    <Input
                      id="offer"
                      placeholder="Ex. Kit déco murale, coaching 1:1, ebook…"
                      value={productOrOffer}
                      onChange={(e) => setProductOrOffer(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="audience" className="mb-2 block">
                      Audience (optionnel)
                    </Label>
                    <Input
                      id="audience"
                      placeholder="Ex. Femmes 25-40 ans, primo-accédants…"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    L&apos;IA génère une <strong>nouvelle image</strong> (Ideogram, format vertical
                    avec titre lisible) et le texte du Pin. Chaque génération produit une variante
                    différente.
                  </p>
                  {selectedImage && activeTab === 'auto' && (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img
                        src={selectedImage}
                        alt="Pin généré"
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
                          alt="Selected"
                          className="max-h-64 mx-auto rounded-lg"
                        />
                        <button
                          type="button"
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
                        <p className="font-medium mb-2">
                          Cliquez pour télécharger une image
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG, GIF jusqu&apos;à 10MB
                        </p>
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
                        Téléchargement... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="url" className="mt-4 space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://exemple.com/image.jpg"
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
                        'OK'
                      )}
                    </Button>
                  </div>
                  {selectedImage && activeTab === 'url' && (
                    <div className="relative">
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
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
              <CardTitle className="text-lg">2. Options de génération</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Niche (optionnel)</Label>
                <div className="flex flex-wrap gap-2">
                  {niches.map((niche) => (
                    <button
                      key={niche}
                      type="button"
                      onClick={() =>
                        setSelectedNiche(selectedNiche === niche ? '' : niche)
                      }
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedNiche === niche
                          ? 'bg-primary text-white'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {niche}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Ton (optionnel)</Label>
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
                      {tone.label}
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
                    {generationStep || 'Génération en cours...'}
                  </>
                ) : activeTab === 'auto' ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Générer image + texte
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Générer le contenu
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 min-w-0">
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">3. Contenu généré</CardTitle>
              {generatedContent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Régénérer
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!generatedContent ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>
                    Mode Auto : décrivez votre business pour générer image + texte.
                    Ou uploadez une image pour générer uniquement le texte.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Label className="flex items-center justify-between mb-2">
                      Titre
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedContent.title)}
                        className="text-primary hover:underline text-sm"
                      >
                        <Copy className="w-4 h-4 inline mr-1" />
                        Copier
                      </button>
                    </Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{generatedContent.title}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center justify-between mb-2">
                      Description
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(generatedContent.description)
                        }
                        className="text-primary hover:underline text-sm"
                      >
                        <Copy className="w-4 h-4 inline mr-1" />
                        Copier
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
                        Hashtags
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(generatedContent.hashtags.join(' '))
                        }
                        className="text-primary hover:underline text-sm"
                      >
                        <Copy className="w-4 h-4 inline mr-1" />
                        Copier
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
                    <Label className="mb-2 block">Texte alternatif (SEO)</Label>
                    <p className="text-sm text-muted-foreground">
                      {generatedContent.altText}
                    </p>
                  </div>

                  {selectedImage && (
                    <div className="border rounded-lg p-4">
                      <Label className="mb-2 block">Aperçu du Pin</Label>
                      <div className="relative rounded-lg overflow-hidden aspect-[2/3] max-h-80 mx-auto bg-muted">
                        <img
                          src={selectedImage}
                          alt="Preview"
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
                      Sauvegarder
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={handleSchedulePin}
                      disabled={isSaving}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Planifier
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
