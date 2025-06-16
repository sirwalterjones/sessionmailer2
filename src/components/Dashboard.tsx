"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import EmailPreview from "@/components/EmailPreview";
import SaveProjectDialog from "@/components/SaveProjectDialog";
import SavedProjects from "@/components/SavedProjects";
import LoadingModal from "@/components/LoadingModal";
import { SavedProject, ProjectCustomization } from "@/lib/supabase";

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
    { id: 1, value: "https://book.usesession.com/s/tFMsifAt84" }
  ]);
  const [nextId, setNextId] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [error, setError] = useState("");
  const [capturedHtml, setCapturedHtml] = useState("");
  const [rawHtml, setRawHtml] = useState("");
  const [emailHtml, setEmailHtml] = useState("");
  const [htmlCopied, setHtmlCopied] = useState(false);
  const [rawHtmlCopied, setRawHtmlCopied] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isGeneratorCollapsed, setIsGeneratorCollapsed] = useState(false);
  const [sessions, setSessions] = useState<Array<{
    url: string;
    title: string;
    html: string;
    firstImage: string | null;
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
  const [paragraphTextColor, setParagraphTextColor] = useState("#6B7280");
  
  // Font customization state
  const [headingFont, setHeadingFont] = useState("Playfair Display");
  const [paragraphFont, setParagraphFont] = useState("Georgia");
  const [headingFontSize, setHeadingFontSize] = useState(28);
  const [paragraphFontSize, setParagraphFontSize] = useState(16);
  
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

  const extractSessionData = async (urlInput: string | string[]) => {
    try {
      const requestBody = Array.isArray(urlInput)
        ? { urls: urlInput, primaryColor, secondaryColor, headingTextColor, paragraphTextColor, headingFont, paragraphFont, headingFontSize, paragraphFontSize }
        : { url: urlInput, primaryColor, secondaryColor, headingTextColor, paragraphTextColor, headingFont, paragraphFont, headingFontSize, paragraphFontSize };

      console.log("Sending request to API:", requestBody);

      // Try the enhanced endpoint first
      const response = await fetch("/api/enhanced-extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        // Fallback to lightweight endpoint if enhanced fails
        console.log("Enhanced endpoint failed, trying lightweight fallback...");
        const lightResponse = await fetch("/api/enhanced-extract-light", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!lightResponse.ok) {
          // Final fallback to original endpoint
          console.log("Lightweight endpoint failed, trying original fallback...");
          const fallbackResponse = await fetch("/api/extract-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });
          
          if (!fallbackResponse.ok) {
            throw new Error("Failed to extract session data");
          }

          const fallbackData = await fallbackResponse.json();
          console.log("Original fallback API response:", fallbackData);
          return fallbackData;
        }

        const lightData = await lightResponse.json();
        console.log("Lightweight API response:", lightData);
        return lightData;
      }

      const data = await response.json();
      console.log("Enhanced API response:", data);
      return data;
    } catch (error) {
      console.error("Error extracting session data:", error);
      throw error;
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

      // Use single URL or multiple URLs based on count
      const urlInput = validUrls.length === 1 ? validUrls[0] : validUrls;
      
      const data = await extractSessionData(urlInput);

      if (data.success) {
        if (data.sessions && Array.isArray(data.sessions)) {
          setSessions(data.sessions);
          
          if (data.sessions.length > 1) {
            // Multiple sessions
            setEmailHtml(data.emailHtml || "");
            setCapturedHtml(data.emailHtml || "");
            setRawHtml(data.rawHtml || "");
          } else if (data.sessions.length === 1) {
            // Single session
            const session = data.sessions[0];
            setEmailHtml(session.enhancedEmailHtml || data.emailHtml || "");
            setCapturedHtml(session.enhancedEmailHtml || data.emailHtml || "");
            setRawHtml(session.rawHtmlWithButton || data.rawHtml || "");
          }
        } else {
          // Legacy single session response
          setEmailHtml(data.emailHtml || "");
          setCapturedHtml(data.emailHtml || "");
          setRawHtml(data.rawHtml || "");
          setSessions([{
            url: validUrls[0],
            title: data.title || "Session",
            html: data.emailHtml || "",
            firstImage: null
          }]);
        }
        
        setIsGenerated(true);
      } else {
        throw new Error(data.error || "Failed to extract session data");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
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
      }

      // Load the email HTML
      setEmailHtml(project.email_html);
      setCapturedHtml(project.email_html);
      
      // Set the URL inputs
      const urls = project.url.includes(', ') ? project.url.split(', ') : [project.url];
      setUrlInputs(urls.map((url, index) => ({ id: index + 1, value: url })));
      setNextId(urls.length + 1);
      
      // Mark as generated
      setIsGenerated(true);
      
      // Create a mock session for compatibility
      setSessions([{
        url: project.url,
        title: project.name,
        html: project.email_html,
        firstImage: null
      }]);

    } catch (error) {
      console.error('Error loading project:', error);
      setError('Failed to load project');
    }
  };

  // Wrapper functions to track changes
  const handlePrimaryColorChange = (color: string) => {
    setPrimaryColor(color);
    if (isGenerated) setHasUnsavedChanges(true);
  };

  const handleSecondaryColorChange = (color: string) => {
    setSecondaryColor(color);
    if (isGenerated) setHasUnsavedChanges(true);
  };

  const handleHeadingTextColorChange = (color: string) => {
    setHeadingTextColor(color);
    if (isGenerated) setHasUnsavedChanges(true);
  };

  const handleParagraphTextColorChange = (color: string) => {
    setParagraphTextColor(color);
    if (isGenerated) setHasUnsavedChanges(true);
  };

  const handleHeadingFontChange = (font: string) => {
    setHeadingFont(font);
    if (isGenerated) setHasUnsavedChanges(true);
  };

  const handleParagraphFontChange = (font: string) => {
    setParagraphFont(font);
    if (isGenerated) setHasUnsavedChanges(true);
  };

  const handleHeadingFontSizeChange = (size: number) => {
    setHeadingFontSize(size);
    if (isGenerated) setHasUnsavedChanges(true);
  };

  const handleParagraphFontSizeChange = (size: number) => {
    setParagraphFontSize(size);
    if (isGenerated) setHasUnsavedChanges(true);
  };

  // Fast client-side styling update - no API calls needed!
  const updatePreview = () => {
    if (!emailHtml && !capturedHtml) return;
    
    // No loading state needed since updates are instant
    try {
      // Get the current HTML content
        const currentHtml = emailHtml || capturedHtml;
        
        // Create a comprehensive style injection with better targeting
        const styleInjection = `
          <style>
            /* Ensure iframe content fits properly */
            body {
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
              overflow-x: hidden !important;
            }
            
            /* Override all heading styles */
            h1, h2, h3, h4, h5, h6, .heading, .title {
              color: ${headingTextColor} !important;
              font-family: '${headingFont}', serif !important;
              font-size: ${headingFontSize}px !important;
              line-height: 1.2 !important;
              margin-bottom: 0.5em !important;
            }
            
            /* Override paragraph styles - more targeted */
            p, .text, .content, .description {
              color: ${paragraphTextColor} !important;
              font-family: '${paragraphFont}', serif !important;
              font-size: ${paragraphFontSize}px !important;
              line-height: 1.5 !important;
              margin-bottom: 1em !important;
            }
            
            /* Target text content in divs and spans more carefully */
            div:not([class*="container"]):not([class*="wrapper"]):not([class*="layout"]) {
              color: ${paragraphTextColor} !important;
              font-family: '${paragraphFont}', serif !important;
              font-size: ${paragraphFontSize}px !important;
            }
            
            span:not([class*="icon"]):not([class*="button"]) {
              color: ${paragraphTextColor} !important;
              font-family: '${paragraphFont}', serif !important;
              font-size: ${paragraphFontSize}px !important;
            }
            
            /* Override background colors */
            .bg-primary, .primary-bg {
              background-color: ${primaryColor} !important;
            }
            
            .bg-secondary, .secondary-bg {
              background-color: ${secondaryColor} !important;
            }
            
            /* Override gradient backgrounds */
            .gradient-bg, .bg-gradient {
              background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%) !important;
            }
            
            /* Override button colors */
            .btn, .button, button {
              background-color: ${primaryColor} !important;
              border-color: ${primaryColor} !important;
              color: white !important;
              padding: 8px 16px !important;
              border-radius: 4px !important;
              text-decoration: none !important;
              display: inline-block !important;
            }
            
            .btn:hover, .button:hover, button:hover {
              background-color: ${secondaryColor} !important;
              border-color: ${secondaryColor} !important;
            }
            
            /* Override link colors */
            a {
              color: ${primaryColor} !important;
            }
            
            a:hover {
              color: ${secondaryColor} !important;
            }
            
            /* Ensure images and media fit properly */
            img {
              max-width: 100% !important;
              height: auto !important;
            }
            
            /* Prevent layout breaking */
            * {
              box-sizing: border-box !important;
            }
            
            /* Ensure containers don't overflow */
            .container, .wrapper, .content-wrapper {
              max-width: 100% !important;
              overflow-x: hidden !important;
            }
          </style>
        `;
        
        let updatedHtml = currentHtml;
        
        // Remove any existing style injections
        updatedHtml = updatedHtml.replace(/<style>[\s\S]*?\/\* Override all heading styles \*\/[\s\S]*?<\/style>/g, '');
        
        // Inject the new styles at the end of the head or beginning of body
        if (updatedHtml.includes('</head>')) {
          updatedHtml = updatedHtml.replace('</head>', `${styleInjection}</head>`);
        } else if (updatedHtml.includes('<body')) {
          updatedHtml = updatedHtml.replace(/(<body[^>]*>)/, `$1${styleInjection}`);
        } else {
          // If no head or body tags, prepend the styles
          updatedHtml = styleInjection + updatedHtml;
        }
        
        // Also update any existing inline styles with regex replacements
        // Update colors in existing inline styles
        updatedHtml = updatedHtml.replace(
          /(style="[^"]*color:\s*)[^;"]+(;?[^"]*")/gi,
          `$1${headingTextColor}$2`
        );
        
        // Update font families in existing inline styles
        updatedHtml = updatedHtml.replace(
          /(style="[^"]*font-family:\s*)[^;"]+(;?[^"]*")/gi,
          `$1'${headingFont}', serif$2`
        );
        
        // Update background colors
        updatedHtml = updatedHtml.replace(
          /(style="[^"]*background-color:\s*)[^;"]+(;?[^"]*")/gi,
          `$1${primaryColor}$2`
        );
        
        // Update the preview
        setEmailHtml(updatedHtml);
        setCapturedHtml(updatedHtml);
        
        // Clear the unsaved changes flag
        setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error updating preview:", error);
    }
  };

  // Note: Removed automatic preview updates to improve performance
  // The initial generation includes all customization parameters
  // Users can manually regenerate if they want to see changes

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-green-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 w-full p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg pulse-glow">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                SessionMailer
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Transform your photo sessions into stunning email templates with AI-powered extraction and beautiful customization
            </p>
            <div className="flex items-center justify-center gap-6 mt-6">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0">
                <Zap className="h-4 w-4 mr-2" />
                AI-Powered
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0">
                <Wand2 className="h-4 w-4 mr-2" />
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
                                className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-400 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                              />
                              <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                            {urlInputs.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeUrlInput(input.id)}
                                className="h-12 px-4 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all duration-300"
                              >
                                <Minus className="h-4 w-4 text-red-500" />
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
                            className="gap-2 border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all duration-300"
                          >
                            <Plus className="h-4 w-4 text-green-500" />
                            Add URL
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
                        className="w-full h-14 text-lg font-semibold sexy-button border-0 text-white relative overflow-hidden"
                      >
                        <div className="flex items-center justify-center gap-3">
                          {isGenerating ? (
                            <>
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                              Generating Magic...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5" />
                              Generate Beautiful Email
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
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          className="gap-2 border-green-300 hover:bg-green-100 transition-all duration-300"
                          onClick={handleSaveProject}
                        >
                          <Save className="h-4 w-4" />
                          Save Project
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Customization and Preview Section */}
            {isGenerated ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
                      <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm">
                        <TabsTrigger value="colors" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                          <Palette className="h-4 w-4" />
                          Colors
                        </TabsTrigger>
                        <TabsTrigger value="typography" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                          <Type className="h-4 w-4" />
                          Typography
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="colors" className="space-y-8 mt-8">
                        {/* Color customization content */}
                        <div className="grid gap-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                            <span className="text-lg font-semibold text-gray-800">Brand Colors</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6">
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

                          <div className="grid grid-cols-2 gap-6">
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
                          
                          <div className="grid grid-cols-2 gap-6">
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

                          <div className="grid grid-cols-2 gap-6">
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
                            className={`gap-2 border-0 text-white font-semibold px-8 py-3 shadow-lg transition-all duration-300 ${
                              hasUnsavedChanges 
                                ? 'sexy-button animate-pulse' 
                                : 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
                            }`}
                          >
                            <Wand2 className="h-4 w-4" />
                            Update Preview
                            {hasUnsavedChanges && <span className="ml-1 text-xs">•</span>}
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
                      <Button
                        onClick={handleCopyHtml}
                        className="gap-2 sexy-button border-0 text-white font-semibold px-6 py-3 shadow-lg"
                      >
                        <Copy className="h-4 w-4" />
                        {htmlCopied ? "✅ Copied!" : "Copy HTML"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-hidden">
                    <div className="border-2 border-gray-200 rounded-2xl h-[600px] overflow-auto relative bg-white shadow-inner">
                      
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
