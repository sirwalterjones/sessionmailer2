"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Clipboard,
  Copy,
  Save,
  Sparkles,
  AlertCircle,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Zap,
  Palette,
  Type,
  Eye,
  Mail,
  Link,
  Wand2,
  Image,
  Share2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import EmailPreview from "@/components/EmailPreview";
import SaveProjectDialog from "@/components/SaveProjectDialog";
import SavedProjects from "@/components/SavedProjects";
import LoadingModal from "@/components/LoadingModal";
import { SavedProject, ProjectCustomization } from "@/lib/supabase";

interface CustomizationOptions {
  primaryColor?: string;
  secondaryColor?: string;
  headingTextColor?: string;
  paragraphTextColor?: string;
  headingFont?: string;
  paragraphFont?: string;
  headingFontSize?: number;
  paragraphFontSize?: number;
  sessionHeroImages?: Record<string, string>;
}

interface DashboardProps {
  savedProjects?: Array<{
    id: string;
    name: string;
    url: string;
    createdAt: string;
  }>;
}

export default function Dashboard({
  savedProjects = [],
}: DashboardProps) {
  const { user } = useAuth();
  // Replace single URL and multiple URLs state with an array of URLs
  const [urlInputs, setUrlInputs] = useState([
    { id: 1, value: "" }
  ]);
  const [nextId, setNextId] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [capturedHtml, setCapturedHtml] = useState("");
  const [rawHtml, setRawHtml] = useState("");
  const [emailHtml, setEmailHtml] = useState("");
  const [htmlCopied, setHtmlCopied] = useState(false);
  const [rawHtmlCopied, setRawHtmlCopied] = useState(false);
  
  // Share functionality state
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareError, setShareError] = useState("");
  const [shareSuccess, setShareSuccess] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGeneratorCollapsed, setIsGeneratorCollapsed] = useState(false);
  const [sessions, setSessions] = useState<Array<{
    url: string;
    title: string;
    html: string;
    firstImage: string | null;
    images?: string[];
    error?: string;
  }>>([]);
  
  // Save functionality state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedProjectsRefresh, setSavedProjectsRefresh] = useState(0);
  
  // Color customization state
  const [primaryColor, setPrimaryColor] = useState("#7851a9");
  const [secondaryColor, setSecondaryColor] = useState("#6a4c96");
  const [headingTextColor, setHeadingTextColor] = useState("#1F2937");
  const [paragraphTextColor, setParagraphTextColor] = useState("#000000");
  
  // Font customization state
  const [headingFont, setHeadingFont] = useState("Inter");
  const [paragraphFont, setParagraphFont] = useState("Inter");
  const [headingFontSize, setHeadingFontSize] = useState(24);
  const [paragraphFontSize, setParagraphFontSize] = useState(16);
  
  // Hero image customization state - now per session
  const [sessionHeroImages, setSessionHeroImages] = useState<Record<string, string>>({});
  const [availableImages, setAvailableImages] = useState<Array<{ url: string; source: string; sessionTitle?: string; sessionUrl?: string }>>([]);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isHeroImageUpdating, setIsHeroImageUpdating] = useState(false);
  
  // Available Google Fonts
  const googleFonts = [
    'Playfair Display',
    'Open Sans', 
    'Lato',
    'Montserrat',
    'Roboto',
    'Poppins',
    'Merriweather',
    'Lora',
    'Source Sans Pro',
    'Nunito',
    'Inter',
    'Crimson Text',
    'Georgia',
    'Arial'
  ];

  // Session data extracted from URL
  const [sessionData, setSessionData] = useState({
    title: "Summer Portrait Session",
    coverImage:
      "https://images.unsplash.com/photo-1623109391520-49ecd2576a7e?w=800&q=80",
    description:
      "Capture beautiful summer portraits in a natural outdoor setting. Perfect for families, couples, or individuals looking for professional photos.",
    date: "June 15, 2023",
    time: "10:00 AM - 2:00 PM",
    location: "Sunset Park, 123 Main Street",
    ctaUrl: "https://usesession.com/sample-session",
  });

  // Functions to manage URL inputs
  const addUrlInput = () => {
    setUrlInputs([...urlInputs, { id: nextId, value: "" }]);
    setNextId(nextId + 1);
  };

  const removeUrlInput = (id: number) => {
    if (urlInputs.length > 1) {
      setUrlInputs(urlInputs.filter(input => input.id !== id));
    }
  };

  const updateUrlInput = (id: number, value: string) => {
    setUrlInputs(urlInputs.map(input => 
      input.id === id ? { ...input, value } : input
    ));
  };

  // Default URLs for quick testing
  const defaultUrls = [
    // Remove the hardcoded test URL - users can enter their own URLs
  ];

  const extractSessionData = async (urls: string[], customOptions: CustomizationOptions = {}) => {
    setIsLoading(true);
    setError("");
    
    try {
      const requestBody = {
        urls: urls,
        ...customOptions,
        sessionHeroImages: sessionHeroImages
      };

      // Try enhanced extraction first
      const response = await fetch('/api/enhanced-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.sessions && Array.isArray(data.sessions)) {
          
          const sessionsWithImages = data.sessions.map((session: any, index: number) => {
            const processedSession = {
              url: session.url,
              title: session.title || `Session ${index + 1}`,
              html: session.enhancedEmailHtml || session.html || '',
              firstImage: session.firstImage,
              images: session.images || [],
              rawHtml: session.rawHtmlWithButton || session.html || '',
              error: session.error
            };
            
            return processedSession;
          });
          
          setSessions(sessionsWithImages);
          
          // Use combined email HTML from API response for multiple sessions
          if (data.emailHtml) {
            setEmailHtml(data.emailHtml);
            setCapturedHtml(data.rawHtml || data.emailHtml);
          } else if (data.sessions.length > 0) {
            // Fallback for single session or if emailHtml not provided
            const primarySession = data.sessions[0];
            setEmailHtml(primarySession.enhancedEmailHtml || '');
            setCapturedHtml(primarySession.rawHtmlWithButton || primarySession.html || '');
          }
          
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback to lightweight extraction
      const lightResponse = await fetch('/api/enhanced-extract-light', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (lightResponse.ok) {
        const lightData = await lightResponse.json();
        
        if (lightData.success && lightData.sessions && Array.isArray(lightData.sessions)) {
          const sessionsWithImages = lightData.sessions.map((session: any, index: number) => ({
            url: session.url,
            title: session.title || `Session ${index + 1}`,
            html: session.enhancedEmailHtml || session.html || '',
            firstImage: session.firstImage,
            images: session.images || [],
            rawHtml: session.rawHtmlWithButton || session.html || '',
            error: session.error
          }));
          
          setSessions(sessionsWithImages);
          
          // Use combined email HTML from API response for multiple sessions
          if (lightData.emailHtml) {
            setEmailHtml(lightData.emailHtml);
            setCapturedHtml(lightData.rawHtml || lightData.emailHtml);
          } else if (lightData.sessions.length > 0) {
            // Fallback for single session or if emailHtml not provided
            const primarySession = lightData.sessions[0];
            setEmailHtml(primarySession.enhancedEmailHtml || '');
            setCapturedHtml(primarySession.rawHtmlWithButton || primarySession.html || '');
          }
          
          setIsLoading(false);
          return;
        }
      }
      
      // Final fallback to original extraction
      const fallbackResponse = await fetch('/api/extract-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: urls }),
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.success && fallbackData.sessions) {
          const sessionsWithImages = fallbackData.sessions.map((session: any, index: number) => ({
            url: session.url,
            title: session.title || `Session ${index + 1}`,
            html: session.html || '',
            firstImage: session.firstImage,
            images: session.images || [],
            rawHtml: session.rawHtml || session.html || '',
            error: session.error
          }));
          
          setSessions(sessionsWithImages);
          
          // Use combined email HTML from API response for multiple sessions
          if (fallbackData.emailHtml) {
            setEmailHtml(fallbackData.emailHtml);
            setCapturedHtml(fallbackData.rawHtml || fallbackData.emailHtml);
          } else if (fallbackData.sessions.length > 0) {
            // Fallback for single session or if emailHtml not provided
            const primarySession = fallbackData.sessions[0];
            setEmailHtml(primarySession.html || '');
            setCapturedHtml(primarySession.rawHtml || primarySession.html || '');
          }
          
          setIsLoading(false);
          return;
        }
      }
      
      throw new Error('All extraction methods failed');
      
    } catch (error) {
      setError(`Failed to extract session data: ${error}`);
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError("");

    try {
      // Filter out empty URLs
      const validUrls = urlInputs
        .map(input => input.value.trim())
        .filter(url => url.length > 0);

      if (validUrls.length === 0) {
        throw new Error("Please enter at least one valid URL");
      }

      // Prepare current customization options
      const customOptions: CustomizationOptions = {
        primaryColor,
        secondaryColor,
        headingTextColor,
        paragraphTextColor,
        headingFont,
        paragraphFont,
        headingFontSize,
        paragraphFontSize,
        sessionHeroImages
      };

      // extractSessionData handles all state updates internally
      await extractSessionData(validUrls, customOptions);
      
      // Set generated state
      setIsGenerated(true);
      setHasUnsavedChanges(false); // Initial generation doesn't have unsaved changes
      
    } catch (error) {
      setError(`Failed to extract session data: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateEmailHtml = () => {
    // This function is kept for compatibility but the actual HTML generation
    // now happens in the API endpoints with proper styling
    return emailHtml || capturedHtml;
  };

  const handleCopyHtml = async () => {
    try {
      const htmlToCopy = emailHtml || capturedHtml;
      if (!htmlToCopy) {
        setError("No HTML content to copy");
        return;
      }
      
      await navigator.clipboard.writeText(htmlToCopy);
      setHtmlCopied(true);
      setTimeout(() => setHtmlCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy HTML:", error);
      setError("Failed to copy HTML to clipboard");
    }
  };

  const handleCopyRawHtml = async () => {
    try {
      if (!rawHtml) {
        setError("No raw HTML content to copy");
        return;
      }
      
      await navigator.clipboard.writeText(rawHtml);
      setRawHtmlCopied(true);
      setTimeout(() => setRawHtmlCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy raw HTML:", error);
      setError("Failed to copy raw HTML to clipboard");
    }
  };

  const handleSaveProject = () => {
    if (!user?.id) {
      setError("Please sign in to save projects");
      return;
    }
    
    if (!isGenerated || !emailHtml) {
      setError("Please generate an email first");
      return;
    }
    
    setShowSaveDialog(true);
  };

  const handleSaveProjectConfirm = async (projectName: string) => {
    if (!user?.id || !emailHtml) return;

    try {
      setIsSaving(true);
      setSaveError("");

      // Get the current URL(s)
      const urls = urlInputs.map(input => input.value.trim()).filter(url => url.length > 0);
      const projectUrl = urls.length === 1 ? urls[0] : urls.join(', ');

      // Prepare customization data
      const customization: ProjectCustomization = {
        primaryColor,
        secondaryColor,
        headingTextColor,
        paragraphTextColor,
        headingFont,
        paragraphFont,
        headingFontSize,
        paragraphFontSize,
        sessionHeroImages,
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          name: projectName,
          url: projectUrl,
          emailHtml,
          customization,
          shareUrl: shareUrl || null, // Include share URL if available
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save project');
      }

      // Success - close dialog and refresh saved projects
      setShowSaveDialog(false);
      setSavedProjectsRefresh(prev => prev + 1);
      
      // Show success message
      setError("");
      
    } catch (error) {
      console.error('Error saving project:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    try {
      // Set the URL inputs first
      const urls = project.url.includes(', ') ? project.url.split(', ') : [project.url];
      setUrlInputs(urls.map((url, index) => ({ id: index + 1, value: url })));
      setNextId(urls.length + 1);
      
      // Load the project's customization settings
      if (project.customization) {
        const customization = project.customization as ProjectCustomization;
        setPrimaryColor(customization.primaryColor || "#7851a9");
        setSecondaryColor(customization.secondaryColor || "#6a4c96");
        setHeadingTextColor(customization.headingTextColor || "#1F2937");
        setParagraphTextColor(customization.paragraphTextColor || "#6B7280");
        setHeadingFont(customization.headingFont || "Playfair Display");
        setParagraphFont(customization.paragraphFont || "Georgia");
        setHeadingFontSize(customization.headingFontSize || 28);
        setParagraphFontSize(customization.paragraphFontSize || 16);
        // Handle both legacy and new hero image systems
        if (customization.sessionHeroImages) {
          setSessionHeroImages(customization.sessionHeroImages);
        } else if (customization.selectedHeroImage) {
          // Legacy support - convert to new format
          const firstUrl = urls[0];
          if (firstUrl) {
            setSessionHeroImages({ [firstUrl]: customization.selectedHeroImage });
          }
        }
      }

      // Load the email HTML
      setEmailHtml(project.email_html);
      setCapturedHtml(project.email_html);
      
      // Load the share URL if available
      if (project.share_url) {
        setShareUrl(project.share_url);
      } else {
        setShareUrl("");
      }
      
      // Mark as generated
      setIsGenerated(true);
      
      // Create a mock session for compatibility
      setSessions([{
        url: project.url,
        title: project.name,
        html: project.email_html,
        firstImage: null,
        images: []
      }]);

    } catch (error) {
      console.error('Error loading project:', error);
      setError('Failed to load project');
    }
  };

  // Wrapper functions to track changes
  const handlePrimaryColorChange = (color: string) => {
    setPrimaryColor(color);
    if (isGenerated) {
      setHasUnsavedChanges(true);
      // Immediate preview update with new color
      updatePreviewWithHeroImages(sessionHeroImages);
    }
  };

  const handleSecondaryColorChange = (color: string) => {
    setSecondaryColor(color);
    if (isGenerated) {
      setHasUnsavedChanges(true);
      // Immediate preview update with new color
      updatePreviewWithHeroImages(sessionHeroImages);
    }
  };

  const handleHeadingTextColorChange = (color: string) => {
    setHeadingTextColor(color);
    if (isGenerated) {
      setHasUnsavedChanges(true);
      // Immediate preview update with new color
      updatePreviewWithHeroImages(sessionHeroImages);
    }
  };

  const handleParagraphTextColorChange = (color: string) => {
    setParagraphTextColor(color);
    if (isGenerated) {
      setHasUnsavedChanges(true);
      // Immediate preview update with new color
      updatePreviewWithHeroImages(sessionHeroImages);
    }
  };

  const handleHeadingFontChange = (font: string) => {
    setHeadingFont(font);
    if (isGenerated) {
      setHasUnsavedChanges(true);
      // Immediate preview update with new font
      updatePreviewWithHeroImages(sessionHeroImages);
    }
  };

  const handleParagraphFontChange = (font: string) => {
    setParagraphFont(font);
    if (isGenerated) {
      setHasUnsavedChanges(true);
      // Immediate preview update with new font
      updatePreviewWithHeroImages(sessionHeroImages);
    }
  };

  const handleHeadingFontSizeChange = (size: number) => {
    setHeadingFontSize(size);
    if (isGenerated) {
      setHasUnsavedChanges(true);
      // Immediate preview update with new font size
      updatePreviewWithHeroImages(sessionHeroImages);
    }
  };

  const handleParagraphFontSizeChange = (size: number) => {
    setParagraphFontSize(size);
    if (isGenerated) {
      setHasUnsavedChanges(true);
      // Immediate preview update with new font size
      updatePreviewWithHeroImages(sessionHeroImages);
    }
  };

  const handleHeroImageChange = (imageUrl: string, sessionUrl?: string) => {
    
    let updatedHeroImages = { ...sessionHeroImages };
    
    if (sessionUrl) {
      const session = sessions.find(s => s.url === sessionUrl);
      if (session) {
        updatedHeroImages[sessionUrl] = imageUrl;
        
      } else {
        return;
      }
    } else if (sessions.length > 0) {
      updatedHeroImages[sessions[0].url] = imageUrl;
      
    } else {
      return;
    }
    
    setSessionHeroImages(updatedHeroImages);
    
    // Trigger immediate preview update
    updatePreviewWithHeroImages(updatedHeroImages);
    
  };

  const getAllAvailableImages = useCallback(() => {
    
    const allImages: Array<{ url: string; source: string; sessionTitle?: string; sessionUrl?: string }> = [];
    
    sessions.forEach((session, sessionIndex) => {
      
      // Add the original hero image first (if it exists)
      if (session.firstImage) {
        allImages.push({
          url: session.firstImage,
          source: `${session.title || `Session ${sessionIndex + 1}`} (Original Hero)`,
          sessionTitle: session.title,
          sessionUrl: session.url
        });
        
      }
      
      // Add other images from the session
      if (session.images && Array.isArray(session.images)) {
        session.images.forEach((imageUrl, imageIndex) => {
          if (imageUrl && imageUrl !== session.firstImage && !allImages.some(img => img.url === imageUrl)) {
            allImages.push({
              url: imageUrl,
              source: `${session.title || `Session ${sessionIndex + 1}`} (Image ${imageIndex + 1})`,
              sessionTitle: session.title,
              sessionUrl: session.url
            });
          }
        });
      }
    });
    
    // Add fallback images if no session images found
    if (allImages.length === 0) {
      
      const fallbackImages = [
        {
          url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
          source: 'Fallback Image 1'
        },
        {
          url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
          source: 'Fallback Image 2'
        }
      ];
      
      allImages.push(...fallbackImages);
    }
    
    return allImages;
  }, [sessions]);

  useEffect(() => {
    if (sessions.length > 0) {
      
      const images = getAllAvailableImages();
      setAvailableImages(images);
      
      updatePreviewWithHeroImages(sessionHeroImages);
    }
  }, [sessions, getAllAvailableImages, sessionHeroImages]);

  const updatePreviewWithHeroImages = (currentHeroImages: Record<string, string>) => {
    
    if (!emailHtml && !capturedHtml) {
      return;
    }
    
    if (sessions.length === 0) {
      return;
    }
    
    // Use fast client-side hero image replacement
    let updatedEmailHtml = emailHtml;
    let updatedCapturedHtml = capturedHtml;
    
    sessions.forEach((session) => {
      const customHeroImage = currentHeroImages[session.url];
      if (customHeroImage && session.firstImage && customHeroImage !== session.firstImage) {
        const originalImage = session.firstImage;
        
        // Create patterns to match the original image in various contexts
        const patterns = [
          // Direct src attribute matches
          new RegExp(`src=["']${originalImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'gi'),
          // URL() in style attributes
          new RegExp(`url\\(["']?${originalImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?\\)`, 'gi'),
          // Background-image properties
          new RegExp(`background-image:\\s*url\\(["']?${originalImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?\\)`, 'gi'),
          // Data attributes
          new RegExp(`data-src=["']${originalImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'gi'),
        ];
        
        patterns.forEach(pattern => {
          const beforeReplace = updatedEmailHtml;
          
          if (pattern.source.includes('src=')) {
            updatedEmailHtml = updatedEmailHtml.replace(pattern, `src="${customHeroImage}"`);
          } else if (pattern.source.includes('url(')) {
            updatedEmailHtml = updatedEmailHtml.replace(pattern, `url("${customHeroImage}")`);
          } else if (pattern.source.includes('background-image')) {
            updatedEmailHtml = updatedEmailHtml.replace(pattern, `background-image: url("${customHeroImage}")`);
          } else if (pattern.source.includes('data-src')) {
            updatedEmailHtml = updatedEmailHtml.replace(pattern, `data-src="${customHeroImage}"`);
          }
          
          const globalReplacePattern = new RegExp(pattern.source, 'gi');
          
        });
        
        // Apply same replacements to captured HTML
        patterns.forEach(pattern => {
          if (pattern.source.includes('src=')) {
            updatedCapturedHtml = updatedCapturedHtml.replace(pattern, `src="${customHeroImage}"`);
          } else if (pattern.source.includes('url(')) {
            updatedCapturedHtml = updatedCapturedHtml.replace(pattern, `url("${customHeroImage}")`);
          } else if (pattern.source.includes('background-image')) {
            updatedCapturedHtml = updatedCapturedHtml.replace(pattern, `background-image: url("${customHeroImage}")`);
          } else if (pattern.source.includes('data-src')) {
            updatedCapturedHtml = updatedCapturedHtml.replace(pattern, `data-src="${customHeroImage}"`);
          }
        });
      }
    });
    
    setEmailHtml(updatedEmailHtml);
    setCapturedHtml(updatedCapturedHtml);
    
  };

  // Wrapper function for backward compatibility
  const updatePreview = async () => {
    if (!sessions || sessions.length === 0) {
      setError("No sessions available to update");
      return;
    }

    setIsUpdating(true);
    setError("");

    try {
      // Get current URLs from sessions
      const urls = sessions.map(session => session.url);
      
      // Prepare current customization options
      const customOptions: CustomizationOptions = {
        primaryColor,
        secondaryColor,
        headingTextColor,
        paragraphTextColor,
        headingFont,
        paragraphFont,
        headingFontSize,
        paragraphFontSize,
        sessionHeroImages
      };

      // Re-extract with current customizations
      await extractSessionData(urls, customOptions);
      
      // Clear unsaved changes flag
      setHasUnsavedChanges(false);
      
    } catch (error) {
      setError(`Failed to update preview: ${error}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Note: Removed automatic preview updates to improve performance
  // The initial generation includes all customization parameters
  // Users can manually regenerate if they want to see changes

  const handleShare = async () => {
    if (!isGenerated || !emailHtml || sessions.length === 0) {
      setError("Please generate an email first before sharing");
      return;
    }

    try {
      setIsSharing(true);
      setShareError("");
      setShareSuccess(false);

      // Prepare the data to share
      const shareData = {
        sessions: sessions.map(session => ({
          url: session.url,
          title: session.title,
          html: session.html,
          firstImage: session.firstImage,
          images: session.images || []
        })),
        emailHtml,
        metadata: {
          primaryColor,
          secondaryColor,
          headingTextColor,
          paragraphTextColor,
          headingFont,
          paragraphFont,
          headingFontSize,
          paragraphFontSize,
        }
      };

      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create share link');
      }

      // Copy the share URL to clipboard
      await navigator.clipboard.writeText(data.shareUrl);
      setShareUrl(data.shareUrl);
      
      // Show success message with better UX
      setError(""); // Clear any previous errors
      setShareSuccess(true);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShareSuccess(false);
      }, 5000);

    } catch (error) {
      console.error('Error creating share link:', error);
      setShareError(error instanceof Error ? error.message : 'Failed to create share link');
      setError("Failed to create share link. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleResetHeroImage = (sessionUrl: string) => {
    
    const session = sessions.find(s => s.url === sessionUrl);
    
    if (session) {
      
      // Remove the custom selection for this session
      const updatedHeroImages = { ...sessionHeroImages };
      delete updatedHeroImages[sessionUrl];
      setSessionHeroImages(updatedHeroImages);
      
      // Trigger immediate preview update
      updatePreviewWithHeroImages(updatedHeroImages);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-green-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 w-full p-3 sm:p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl shadow-lg pulse-glow">
                <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                SessionMailer
              </h1>
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
              Transform your photo sessions into stunning email templates with AI-powered extraction and beautiful customization
            </p>
            <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl sm:rounded-2xl border-2 border-purple-200 max-w-2xl mx-auto">
              <p className="text-base sm:text-lg font-semibold text-purple-800 text-center">
                🚀 Supercharge and Simplify your UseSession.com Email Marketing!
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 sm:gap-6 mt-4 sm:mt-6 flex-wrap">
              <Badge variant="secondary" className="px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                AI-Powered
              </Badge>
              <Badge variant="secondary" className="px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0">
                <Wand2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Instant Generation
              </Badge>
            </div>
          </div>

          <div className="space-y-8">

            
            {/* URL Generator Section */}
            <Card className="glass-card border-0 shadow-2xl card-hover">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                      <Link className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-800">URL to Email Generator</CardTitle>
                      <CardDescription className="text-gray-600 mt-1">
                        Enter your usesession.com URLs below to generate stunning email templates
                      </CardDescription>
                    </div>
                  </div>
                  {isGenerated && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsGeneratorCollapsed(!isGeneratorCollapsed)}
                      className="gap-2 hover:bg-white/50 transition-all duration-300"
                    >
                      {isGeneratorCollapsed ? "Expand" : "Minimize"}
                      {isGeneratorCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </CardHeader>
              {(!isGenerated || !isGeneratorCollapsed) && (
                <CardContent className="pt-0">
                  <form onSubmit={handleUrlSubmit}>
                    <div className="grid gap-6">
                      <div className="space-y-4">
                        {urlInputs.map((input, index) => (
                          <div key={input.id} className="flex gap-3">
                            <div className="relative flex-1">
                              <Input
                                placeholder="https://book.usesession.com/s/..."
                                value={input.value}
                                onChange={(e) => updateUrlInput(input.id, e.target.value)}
                                className="pl-10 sm:pl-12 h-10 sm:h-12 border-2 border-gray-200 focus:border-purple-400 transition-all duration-300 bg-white/70 backdrop-blur-sm text-sm sm:text-base"
                              />
                              <Link className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            </div>
                            {urlInputs.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeUrlInput(input.id)}
                                className="h-10 sm:h-12 px-3 sm:px-4 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all duration-300"
                              >
                                <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                        
                        <div className="flex justify-between items-center pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addUrlInput}
                            className="gap-1 sm:gap-2 border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all duration-300 text-xs sm:text-sm px-3 sm:px-4 py-2"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            <span className="hidden sm:inline">Add URL</span>
                            <span className="sm:hidden">Add</span>
                          </Button>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                            <p className="text-sm text-gray-600 font-medium">
                              {urlInputs.length === 1 ? "Single session email" : `Combined email with ${urlInputs.length} sessions`}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isGenerating || urlInputs.every(input => !input.value.trim())}
                        className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold sexy-button border-0 text-white relative overflow-hidden"
                      >
                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                          {isGenerating ? (
                            <>
                              <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full"></div>
                              <span className="hidden sm:inline">Generating Magic...</span>
                              <span className="sm:hidden">Generating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                              <span className="hidden sm:inline">Generate Beautiful Email</span>
                              <span className="sm:hidden">Generate Email</span>
                            </>
                          )}
                        </div>
                      </Button>
                    </div>
                  </form>

                  {error && (
                    <Alert className="mt-6 border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}

                  {isGenerated && (
                    <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-500 rounded-full">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-green-800">
                          Email Generated Successfully! ✨
                        </h3>
                      </div>
                      <p className="text-green-700 mb-4">Your beautiful email template is ready. Customize colors and fonts below, then copy the HTML.</p>
                      <div className="flex justify-center gap-4">
                        <Button
                          variant="outline"
                          className="gap-2 border-green-300 hover:bg-green-100 transition-all duration-300"
                          onClick={handleSaveProject}
                        >
                          <Save className="h-4 w-4" />
                          Save Project
                        </Button>
                        
                        <Button
                          onClick={handleShare}
                          disabled={isSharing}
                          className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white font-semibold shadow-lg transition-all duration-300"
                        >
                          <Share2 className={`h-3 w-3 sm:h-4 sm:w-4 ${isSharing ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">{isSharing ? "Creating..." : "Share"}</span>
                          <span className="sm:hidden">{isSharing ? "..." : "🔗"}</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Customization and Preview Section */}
            {isGenerated ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Customization Panel */}
                <Card className="glass-card border-0 shadow-2xl card-hover">
                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl">
                        <Palette className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                          Customize Your Email
                        </CardTitle>
                        <CardDescription className="text-gray-600 mt-1">
                          Make it uniquely yours with colors and typography
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="colors" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm h-auto p-1">
                        <TabsTrigger value="colors" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md text-xs sm:text-sm py-2 px-2 sm:px-3">
                          <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Colors</span>
                                                      <span className="sm:hidden">🎨</span>
                        </TabsTrigger>
                        <TabsTrigger value="typography" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md text-xs sm:text-sm py-2 px-2 sm:px-3">
                          <Type className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Typography</span>
                                                      <span className="sm:hidden">Aa</span>
                        </TabsTrigger>
                        <TabsTrigger value="images" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md text-xs sm:text-sm py-2 px-2 sm:px-3">
                          <Image className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Images</span>
                                                      <span className="sm:hidden">🖼️</span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="colors" className="space-y-8 mt-8">
                        {/* Color customization content */}
                        <div className="grid gap-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                            <span className="text-lg font-semibold text-gray-800">Brand Colors</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700">Primary Color</label>
                              <div className="flex gap-3">
                                <input
                                  type="color"
                                  value={primaryColor}
                                  onChange={(e) => handlePrimaryColorChange(e.target.value)}
                                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer shadow-md"
                                />
                                <Input
                                  value={primaryColor}
                                  onChange={(e) => handlePrimaryColorChange(e.target.value)}
                                  className="flex-1 font-mono text-sm bg-white/70"
                                />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700">Secondary Color</label>
                              <div className="flex gap-3">
                                <input
                                  type="color"
                                  value={secondaryColor}
                                  onChange={(e) => handleSecondaryColorChange(e.target.value)}
                                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer shadow-md"
                                />
                                <Input
                                  value={secondaryColor}
                                  onChange={(e) => handleSecondaryColorChange(e.target.value)}
                                  className="flex-1 font-mono text-sm bg-white/70"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700">Heading Text</label>
                              <div className="flex gap-3">
                                <input
                                  type="color"
                                  value={headingTextColor}
                                  onChange={(e) => handleHeadingTextColorChange(e.target.value)}
                                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer shadow-md"
                                />
                                <Input
                                  value={headingTextColor}
                                  onChange={(e) => handleHeadingTextColorChange(e.target.value)}
                                  className="flex-1 font-mono text-sm bg-white/70"
                                />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700">Paragraph Text</label>
                              <div className="flex gap-3">
                                <input
                                  type="color"
                                  value={paragraphTextColor}
                                  onChange={(e) => handleParagraphTextColorChange(e.target.value)}
                                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer shadow-md"
                                />
                                <Input
                                  value={paragraphTextColor}
                                  onChange={(e) => handleParagraphTextColorChange(e.target.value)}
                                  className="flex-1 font-mono text-sm bg-white/70"
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Color Preview */}
                          <div className="p-6 bg-white rounded-2xl border-2 border-gray-100 shadow-inner">
                            <div className="flex items-center gap-2 mb-4">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Color Preview</span>
                            </div>
                            <div className="space-y-4">
                              <div 
                                className="h-16 rounded-xl shadow-md flex overflow-hidden"
                                style={{ 
                                  background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 50%, ${secondaryColor} 100%)`
                                }}
                              >
                                <div className="flex-1 flex items-center justify-center text-white font-semibold">
                                  Primary
                                </div>
                                <div className="flex-1 flex items-center justify-center text-white font-semibold">
                                  Secondary
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h3 
                                  className="text-xl font-bold"
                                  style={{ color: headingTextColor }}
                                >
                                  Sample Heading Text
                                </h3>
                                <p 
                                  className="text-sm"
                                  style={{ color: paragraphTextColor }}
                                >
                                  This is how your paragraph text will appear in the email template.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="typography" className="space-y-8 mt-8">
                        {/* Typography customization content */}
                        <div className="grid gap-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                            <span className="text-lg font-semibold text-gray-800">Typography</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700">Heading Font</label>
                              <select
                                value={headingFont}
                                onChange={(e) => handleHeadingFontChange(e.target.value)}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white/70 focus:border-blue-400 transition-all duration-300"
                              >
                                {googleFonts.map(font => (
                                  <option key={font} value={font}>{font}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700">Paragraph Font</label>
                              <select
                                value={paragraphFont}
                                onChange={(e) => handleParagraphFontChange(e.target.value)}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white/70 focus:border-blue-400 transition-all duration-300"
                              >
                                {googleFonts.map(font => (
                                  <option key={font} value={font}>{font}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700">Heading Size</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min="20"
                                  max="48"
                                  value={headingFontSize}
                                  onChange={(e) => handleHeadingFontSizeChange(Number(e.target.value))}
                                  className="flex-1 h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex items-center gap-1 bg-white/70 rounded-lg px-3 py-1 border">
                                  <Input
                                    type="number"
                                    min="20"
                                    max="48"
                                    value={headingFontSize}
                                    onChange={(e) => handleHeadingFontSizeChange(Number(e.target.value))}
                                    className="w-16 text-xs text-center border-0 bg-transparent p-0"
                                  />
                                  <span className="text-xs text-gray-500">px</span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700">Paragraph Size</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min="12"
                                  max="24"
                                  value={paragraphFontSize}
                                  onChange={(e) => handleParagraphFontSizeChange(Number(e.target.value))}
                                  className="flex-1 h-2 bg-gradient-to-r from-green-200 to-blue-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex items-center gap-1 bg-white/70 rounded-lg px-3 py-1 border">
                                  <Input
                                    type="number"
                                    min="12"
                                    max="24"
                                    value={paragraphFontSize}
                                    onChange={(e) => handleParagraphFontSizeChange(Number(e.target.value))}
                                    className="w-16 text-xs text-center border-0 bg-transparent p-0"
                                  />
                                  <span className="text-xs text-gray-500">px</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Typography Preview */}
                          <div className="p-6 bg-white rounded-2xl border-2 border-gray-100 shadow-inner">
                            <div className="flex items-center gap-2 mb-4">
                              <Type className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Typography Preview</span>
                            </div>
                            <div className="space-y-4">
                              <div 
                                className="font-bold"
                                style={{ 
                                  fontFamily: headingFont,
                                  fontSize: `${headingFontSize}px`,
                                  color: headingTextColor,
                                  lineHeight: '1.2'
                                }}
                              >
                                Beautiful Session Heading
                              </div>
                              <p 
                                style={{ 
                                  fontFamily: paragraphFont,
                                  fontSize: `${paragraphFontSize}px`,
                                  color: paragraphTextColor,
                                  lineHeight: '1.6'
                                }}
                              >
                                This is how your paragraph text will appear in the email template. The font family, size, and color are all customizable to match your brand perfectly.
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="images" className="space-y-8 mt-8">
                        {/* Hero Image customization content */}
                        <div className="grid gap-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full"></div>
                            <span className="text-lg font-semibold text-gray-800">Hero Image Selection</span>
                          </div>
                          
                          {isGenerated && sessions.length > 0 ? (
                            <div className="space-y-4">
                              <p className="text-sm text-gray-600">
                                Choose from the images extracted from your sessions to use as the hero image in your email template.
                              </p>
                              
                              {/* Group images by session for better organization */}
                              {sessions.length > 1 ? (
                                <div className="space-y-8">
                                  {sessions.map((session, sessionIndex) => {
                                    const sessionTitle = session.title || `Session ${sessionIndex + 1}`;
                                    const sessionImages = availableImages.filter((img: any) => img.sessionUrl === session.url);
                                    const currentHero = sessionHeroImages[session.url];
                                    
                                    return (
                                      <div key={session.url} className="border-2 border-gray-100 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white">
                                        <div className="flex items-center gap-3 mb-4">
                                          <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                                          <h3 className="text-lg font-semibold text-gray-800">{sessionTitle}</h3>
                                          {currentHero && (
                                            <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-full">
                                              <Eye className="h-3 w-3 text-blue-600" />
                                              <span className="text-xs text-blue-600 font-medium">Hero Selected</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 auto-rows-fr" key={`session-${session.url}-${forceUpdate}`}>
                                          {sessionImages.map((image: any, imgIndex: number) => (
                                            <div
                                              key={imgIndex}
                                              className={`relative group cursor-pointer rounded-xl overflow-hidden border-4 transition-all duration-300 ${
                                                image.isCurrentHero
                                                  ? 'border-blue-500 shadow-lg scale-105'
                                                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                                              }`}
                                              onClick={() => handleHeroImageChange(image.url, image.sessionUrl)}
                                            >
                                              <div className="aspect-video relative">
                                                <img
                                                  src={image.url}
                                                  alt={image.source}
                                                  className="w-full h-full object-cover"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                                  }}
                                                />
                                                {image.isCurrentHero && (
                                                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                    <div className="bg-blue-500 text-white rounded-full p-2">
                                                      <Eye className="h-4 w-4" />
                                                    </div>
                                                  </div>
                                                )}
                                                                                        {image.isOriginalHero && (
                                          <div className="absolute top-2 left-2">
                                            <div className="bg-green-500 text-white rounded-full px-2 py-1 text-xs font-medium">
                                              Default
                                            </div>
                                          </div>
                                        )}
                                              </div>
                                              <div className="p-3 bg-white">
                                                <p className="text-xs text-gray-600 truncate" title={image.source}>
                                                  {image.source}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                // Single session - use original layout
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4 auto-rows-fr" key={`single-session-${forceUpdate}`}>
                                  {availableImages.map((image: any, index: number) => (
                                    <div
                                      key={index}
                                      className={`relative group cursor-pointer rounded-xl overflow-hidden border-4 transition-all duration-300 ${
                                        image.isCurrentHero
                                          ? 'border-blue-500 shadow-lg scale-105'
                                          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                                      }`}
                                      onClick={() => handleHeroImageChange(image.url, image.sessionUrl)}
                                    >
                                      <div className="aspect-video relative">
                                        <img
                                          src={image.url}
                                          alt={image.source}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
                                          }}
                                        />
                                        {image.isCurrentHero && (
                                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                            <div className="bg-blue-500 text-white rounded-full p-2">
                                              <Eye className="h-4 w-4" />
                                            </div>
                                          </div>
                                        )}
                                        {image.isOriginalHero && (
                                          <div className="absolute top-2 left-2">
                                            <div className="bg-green-500 text-white rounded-full px-2 py-1 text-xs font-medium">
                                              Default
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="p-3 bg-white">
                                        <p className="text-xs text-gray-600 truncate" title={`${image.sessionTitle} - ${image.source}`}>
                                          {image.source}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {Object.keys(sessionHeroImages).length > 0 && (
                                <div className="mt-6 space-y-4">
                                  {Object.entries(sessionHeroImages).map(([sessionUrl, heroImageUrl]) => {
                                    const session = sessions.find(s => s.url === sessionUrl);
                                    const sessionTitle = session?.title || sessionUrl;
                                    return (
                                      <div key={sessionUrl} className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Eye className="h-4 w-4 text-blue-600" />
                                          <span className="text-sm font-medium text-blue-800">
                                            Hero Image for {sessionTitle}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <img
                                            src={heroImageUrl}
                                            alt="Selected hero"
                                            className="w-16 h-16 object-cover rounded-lg border-2 border-blue-300"
                                          />
                                          <div className="flex-1">
                                            <p className="text-sm text-blue-700 font-medium">
                                              This image will be used as the hero image for this session.
                                            </p>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={async () => {
                                                const session = sessions.find(s => s.url === sessionUrl);
                                                
                                                // Set loading state
                                                setIsHeroImageUpdating(true);
                                                
                                                // Reset to the original hero image by removing the custom selection
                                                // This will make it fall back to the default (firstImage)
                                                const newImages = { ...sessionHeroImages };
                                                delete newImages[sessionUrl];
                                                setSessionHeroImages(newImages);
                                                
                                                setHasUnsavedChanges(true);
                                                setForceUpdate(prev => prev + 1);
                                                
                                                // OPTIMIZATION: Immediate update after reset
                                                try {
                                                  await updatePreviewWithHeroImages(newImages);
                                                } finally {
                                                  setIsHeroImageUpdating(false);
                                                }
                                              }}
                                              className="mt-2 text-xs border-blue-300 text-blue-600 hover:bg-blue-100"
                                            >
                                              Reset to Default
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6 mx-auto w-fit">
                                <Image className="h-12 w-12 text-purple-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Images Available</h3>
                              <p className="text-gray-500 max-w-md mx-auto">
                                Generate an email first to see available images from your sessions that you can use as hero images.
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    {/* Update Preview Section */}
                    {isGenerated && (
                      <div className="mt-6 space-y-4">
                        {/* Unsaved Changes Indicator */}
                        {hasUnsavedChanges && (
                          <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                              <span className="text-orange-800 font-medium">You have unsaved customizations</span>
                            </div>
                            <span className="text-orange-600 text-sm">Click "Update Preview" to see your changes</span>
                          </div>
                        )}
                        
                        {/* Update Preview Button */}
                        <div className="flex justify-center">
                          <Button
                            onClick={updatePreview}
                            disabled={isUpdating}
                            className={`gap-2 border-0 text-white font-semibold px-6 sm:px-8 py-2 sm:py-3 shadow-lg transition-all duration-300 text-sm sm:text-base ${
                              hasUnsavedChanges 
                                ? 'sexy-button animate-pulse' 
                                : 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
                            } ${isUpdating ? 'opacity-75 cursor-not-allowed' : ''}`}
                          >
                            <Wand2 className={`h-3 w-3 sm:h-4 sm:w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">{isUpdating ? 'Updating...' : 'Update Preview'}</span>
                            <span className="sm:hidden">{isUpdating ? '...' : 'Update'}</span>
                            {hasUnsavedChanges && !isUpdating && <span className="ml-1 text-xs">•</span>}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Email Preview Panel */}
                <Card className="glass-card border-0 shadow-2xl card-hover">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold text-gray-800">
                            Email Preview
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-1">
                            See how your email looks to recipients • Click "Update Preview" after customizing
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={handleCopyHtml}
                          className="gap-2 sexy-button border-0 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 shadow-lg text-sm sm:text-base"
                        >
                          <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">{htmlCopied ? "✅ Copied!" : "Copy"}</span>
                          <span className="sm:hidden">{htmlCopied ? "✅" : "📋"}</span>
                        </Button>
                        
                        <Button
                          onClick={handleShare}
                          disabled={isSharing}
                          className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 shadow-lg text-sm sm:text-base transition-all duration-300"
                        >
                          <Share2 className={`h-3 w-3 sm:h-4 sm:w-4 ${isSharing ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">{isSharing ? "Creating..." : "Share"}</span>
                          <span className="sm:hidden">{isSharing ? "..." : "🔗"}</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Share Success Banner */}
                  {shareSuccess && (
                    <div className="mx-6 mb-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-green-800 font-semibold">Share Link Created Successfully!</h4>
                          <p className="text-green-700 text-sm mt-1">
                            Your email template has been copied to clipboard and is now shareable at:
                          </p>
                          <div className="mt-2 p-2 bg-white rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                              <code className="text-xs text-green-800 font-mono flex-1 truncate">{shareUrl}</code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigator.clipboard.writeText(shareUrl)}
                                className="h-6 px-2 text-green-600 hover:text-green-800 hover:bg-green-50"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-green-600 text-xs mt-1">Share with your clients!</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShareSuccess(false)}
                          className="text-green-600 hover:text-green-800 hover:bg-green-50"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="p-0 overflow-hidden">
                    <div className="border-2 border-gray-200 rounded-2xl h-[400px] sm:h-[500px] lg:h-[600px] overflow-auto relative bg-white shadow-inner">
                      
                      {/* Hero Image Loading Overlay */}
                      {isHeroImageUpdating && (
                        <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                          <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                            <p className="text-purple-600 font-medium">Updating hero image...</p>
                          </div>
                        </div>
                      )}
                      
                      {isGenerated && (emailHtml || capturedHtml) ? (
                        <div className="h-full">
                          <iframe
                            srcDoc={emailHtml || capturedHtml}
                            className="w-full h-full border-0"
                            title="Email Preview"
                            sandbox="allow-same-origin allow-scripts"
                          />
                        </div>
                      ) : isGenerated ? (
                        <EmailPreview
                          sessionData={{
                            title: sessionData.title,
                            coverImage: sessionData.coverImage,
                            description: sessionData.description,
                            date: sessionData.date,
                            time: sessionData.time,
                            location: sessionData.location,
                            price: "$350"
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                          <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-8 floating-animation">
                            <Mail className="h-20 w-20 text-purple-600" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Create Something Beautiful?</h3>
                          <p className="text-gray-600 max-w-md text-lg leading-relaxed">
                            Enter your Session URLs above and click Generate to see your stunning preview here
                          </p>
                        </div>
                      )}
                    </div>
                    {isGenerated && (capturedHtml || sessions.length > 0) && (
                      <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-t-2 border-gray-100">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <p className="text-sm font-semibold text-green-800">
                              Generation Status: ✅ Success
                            </p>
                          </div>
                          {sessions.length > 1 ? (
                            <div>
                              <p className="text-sm text-gray-700 font-medium">
                                <strong>Sessions Processed:</strong> {sessions.length}
                              </p>
                              <div className="mt-2 space-y-1">
                                {sessions.map((session, index) => (
                                  <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                                    {session.title || `Session ${index + 1}`}
                                    {session.error && <span className="text-red-500">(Error)</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700">
                              <strong>HTML Size:</strong> {capturedHtml.length.toLocaleString()} characters
                            </p>
                          )}
                          <details className="group">
                            <summary className="cursor-pointer font-medium text-sm text-gray-700 hover:text-purple-600 transition-colors duration-200 flex items-center gap-2">
                              <ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform duration-200" />
                              View Email HTML Source
                            </summary>
                            <div className="mt-3 p-4 bg-gray-900 rounded-xl max-h-40 overflow-auto">
                              <pre className="text-xs text-green-400 whitespace-pre-wrap break-all font-mono">
                                {emailHtml.substring(0, 2000)}...
                              </pre>
                            </div>
                          </details>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="glass-card border-0 shadow-2xl card-hover">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-800">Email Preview</CardTitle>
                      <CardDescription className="text-gray-600 mt-1">
                        Your beautiful email will appear here after generation
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
                    <div className="p-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-8 floating-animation">
                      <Mail className="h-20 w-20 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Create Something Beautiful?</h3>
                    <p className="text-gray-600 max-w-md text-lg leading-relaxed">
                      Generate an email above to see your stunning preview here with real-time customization
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Saved Projects Section */}
            <SavedProjects 
              onLoadProject={handleLoadProject}
              refreshTrigger={savedProjectsRefresh}
            />
          </div>
        </div>
      </div>

            {/* Save Project Dialog */}
      <SaveProjectDialog 
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveProjectConfirm}
        isLoading={isSaving}
        error={saveError}
      />

      {/* Loading Modal */}
      <LoadingModal 
        isOpen={isGenerating}
        title="Generating Your Beautiful Email"
        subtitle={`Processing ${urlInputs.filter(input => input.value.trim()).length} session${urlInputs.filter(input => input.value.trim()).length > 1 ? 's' : ''}...`}
      />



    </div>
  );
}

