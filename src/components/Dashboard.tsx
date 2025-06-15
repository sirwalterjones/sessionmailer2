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
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";



import EmailPreview from "@/components/EmailPreview";

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
  const [isUpdatingPreview, setIsUpdatingPreview] = useState(false);
  const [isGeneratorCollapsed, setIsGeneratorCollapsed] = useState(false);
  const [sessions, setSessions] = useState<Array<{
    url: string;
    title: string;
    html: string;
    firstImage: string | null;
    error?: string;
  }>>([]);
  
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
        // Fallback to original endpoint if enhanced fails
        console.log("Enhanced endpoint failed, trying fallback...");
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
        console.log("Fallback API response:", fallbackData);
        return fallbackData;
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

      // Determine if we're processing single or multiple URLs
      const urlInput = validUrls.length === 1 ? validUrls[0] : validUrls;
      
      const data = await extractSessionData(urlInput);

      if (data.error || !data.success) {
        throw new Error(data.error || "Failed to extract session data");
      }

      // Handle the response data based on the API structure
      if (data.sessions && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
        
        if (data.sessions.length > 1) {
          // Multiple sessions response
          setEmailHtml(data.emailHtml || "");
          setCapturedHtml(data.emailHtml || "");
          setRawHtml(data.rawHtml || "");
        } else if (data.sessions.length === 1) {
          // Single session response
          const session = data.sessions[0];
          setEmailHtml(session.enhancedEmailHtml || data.emailHtml || "");
          setCapturedHtml(session.enhancedEmailHtml || data.emailHtml || "");
          setRawHtml(session.rawHtmlWithButton || data.rawHtml || "");
          
          // Update session data for preview
          setSessionData({
            title: session.title || "Session Title",
            coverImage: session.firstImage || sessionData.coverImage,
            description: session.description || "Session description",
            date: session.date || "Date TBD",
            time: Array.isArray(session.timeSlots) 
              ? session.timeSlots.map((slot: any) => typeof slot === 'object' ? slot.time : slot).join(", ") 
              : "Time TBD",
            location: session.location || "Location TBD",
            ctaUrl: session.url || "#",
          });
        }
      } else {
        // Fallback for unexpected response structure
        throw new Error("Invalid response structure from server");
      }

      setIsGenerated(true);
      setIsGeneratorCollapsed(true); // Auto-minimize the generator when email is generated
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateEmailHtml = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${sessionData.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { padding: 30px; text-align: center; }
        .title { font-size: 28px; font-weight: bold; color: #333; margin-bottom: 20px; }
        .image { width: 100%; height: auto; display: block; }
        .content { padding: 30px; }
        .description { font-size: 16px; line-height: 1.6; color: #666; margin-bottom: 25px; }
        .details { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .detail-label { font-weight: bold; color: #333; }
        .detail-value { color: #666; }
        .cta { text-align: center; }
        .cta-button { display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .cta-button:hover { background-color: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${sessionData.title}</h1>
        </div>
        
        <img src="${sessionData.coverImage}" alt="${sessionData.title}" class="image">
        
        <div class="content">
            <p class="description">${sessionData.description}</p>
            
            <div class="details">
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${sessionData.date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${sessionData.time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${sessionData.location}</span>
                </div>
            </div>
            
            <div class="cta">
                <a href="${sessionData.ctaUrl}" class="cta-button">Book Now</a>
            </div>
        </div>
    </div>
</body>
</html>`;
  };

  const handleCopyHtml = async () => {
    try {
      const htmlContent = emailHtml || generateEmailHtml();
      await navigator.clipboard.writeText(htmlContent);
      setHtmlCopied(true);
      setTimeout(() => setHtmlCopied(false), 2000);
      console.log("HTML copied to clipboard successfully");
    } catch (error) {
      console.error("Failed to copy HTML to clipboard:", error);
      // Fallback: create a temporary textarea element
      const textArea = document.createElement("textarea");
      textArea.value = emailHtml || generateEmailHtml();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setHtmlCopied(true);
      setTimeout(() => setHtmlCopied(false), 2000);
    }
  };

  const handleCopyRawHtml = async () => {
    try {
      await navigator.clipboard.writeText(rawHtml);
      setRawHtmlCopied(true);
      setTimeout(() => setRawHtmlCopied(false), 2000);
      console.log("Raw HTML copied to clipboard successfully");
    } catch (error) {
      console.error("Failed to copy raw HTML to clipboard:", error);
      const textArea = document.createElement("textarea");
      textArea.value = rawHtml;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setRawHtmlCopied(true);
      setTimeout(() => setRawHtmlCopied(false), 2000);
    }
  };

  const handleSaveProject = () => {
    // In a real implementation, this would save the project to the user's account
    console.log('Save project functionality would be implemented here');
  };

  // Real-time preview update function
  const updatePreview = async () => {
    if (!isGenerated || !sessions.length) return;
    
    setIsUpdatingPreview(true);
    try {
      // Get the original URLs from sessions
      const urlsToRegenerate = sessions.map(session => session.url);
      
      const requestBody = urlsToRegenerate.length > 1
        ? { 
            urls: urlsToRegenerate, 
            primaryColor, 
            secondaryColor, 
            headingFont, 
            paragraphFont, 
            headingFontSize, 
            paragraphFontSize,
            headingTextColor,
            paragraphTextColor
          }
        : { 
            url: urlsToRegenerate[0], 
            primaryColor, 
            secondaryColor, 
            headingFont, 
            paragraphFont, 
            headingFontSize, 
            paragraphFontSize,
            headingTextColor,
            paragraphTextColor
          };

      const response = await fetch("/api/enhanced-extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.sessions && Array.isArray(data.sessions)) {
          if (data.sessions.length > 1) {
            // Multiple sessions response
            setEmailHtml(data.emailHtml || "");
            setCapturedHtml(data.emailHtml || "");
            setRawHtml(data.rawHtml || "");
          } else if (data.sessions.length === 1) {
            // Single session response
            const session = data.sessions[0];
            setEmailHtml(session.enhancedEmailHtml || data.emailHtml || "");
            setCapturedHtml(session.enhancedEmailHtml || data.emailHtml || "");
            setRawHtml(session.rawHtmlWithButton || data.rawHtml || "");
          }
        }
      }
    } catch (error) {
      console.error("Error updating preview:", error);
    } finally {
      setIsUpdatingPreview(false);
    }
  };

  // Real-time preview updates when colors or fonts change (only after initial generation)
  useEffect(() => {
    // Only update preview if email has been generated and we have sessions data
    if (!isGenerated || !sessions.length) return;
    
    const timeoutId = setTimeout(() => {
      updatePreview();
    }, 500); // Debounce updates by 500ms

    return () => clearTimeout(timeoutId);
  }, [primaryColor, secondaryColor, headingFont, paragraphFont, headingFontSize, paragraphFontSize, headingTextColor, paragraphTextColor, isGenerated, sessions]);

  return (
    <div className="w-full p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Generator</h1>
            <p className="text-muted-foreground mt-1">
              Transform your photo sessions into beautiful email templates
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            {/* Premium badge removed - no premium version */}
          </div>
        </div>

        <div className="space-y-8">
          {/* URL Generator Section - Always at top, collapsible when preview loads */}
          <Card className="bg-background">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>URL to Email Generator</CardTitle>
                  <CardDescription>
                    Enter your usesession.com URLs below to generate an email template. 
                    Add multiple URLs to create a combined email.
                  </CardDescription>
                </div>
                {isGenerated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsGeneratorCollapsed(!isGeneratorCollapsed)}
                    className="gap-2"
                  >
                    {isGeneratorCollapsed ? "Expand" : "Minimize"}
                    {isGeneratorCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </CardHeader>
            {(!isGenerated || !isGeneratorCollapsed) && (
              <CardContent>
                <form onSubmit={handleUrlSubmit}>
                  <div className="grid gap-4">
                    <div className="space-y-3">
                      {urlInputs.map((input, index) => (
                        <div key={input.id} className="flex gap-2">
                          <Input
                            placeholder="https://book.usesession.com/s/..."
                            value={input.value}
                            onChange={(e) => updateUrlInput(input.id, e.target.value)}
                            className="flex-1"
                          />
                          {urlInputs.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeUrlInput(input.id)}
                              className="px-3"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      <div className="flex justify-between items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addUrlInput}
                          className="gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add URL
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          {urlInputs.length === 1 ? "Single session email" : `Combined email with ${urlInputs.length} sessions`}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isGenerating || urlInputs.every(input => !input.value.trim())}
                      className="w-full"
                    >
                      {isGenerating ? "Capturing HTML..." : "Capture & Generate"}
                    </Button>
                  </div>
                </form>

                {error && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {isGenerated && (
                  <div className="mt-6">
                    <Separator className="my-4" />
                    <h3 className="text-lg font-medium mb-4">
                      Email Generated!
                    </h3>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        className="gap-2"
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

          {/* Customization and Preview Section - Side by side when preview loads */}
          {isGenerated ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Customization Options - Left side */}
              <Card className="bg-background">
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Customize Your Email
                    </CardTitle>
                    <CardDescription>
                      Adjust colors and typography to match your brand. Changes update automatically.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="colors" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="colors" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Colors
                      </TabsTrigger>
                      <TabsTrigger value="typography" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Typography
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="colors" className="space-y-6 mt-6">
                      {/* Header Background Colors */}
                      <div className="grid gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium">Header Background</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Primary Color</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-10 h-10 rounded-lg border cursor-pointer"
                              />
                              <Input
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="text-xs font-mono"
                                placeholder="#7851a9"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Secondary Color</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="w-10 h-10 rounded-lg border cursor-pointer"
                              />
                              <Input
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="text-xs font-mono"
                                placeholder="#6a4c96"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Preview</label>
                          <div 
                            className="h-8 rounded-lg border"
                            style={{
                              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                            }}
                          />
                        </div>
                      </div>

                      {/* Text Colors */}
                      <div className="grid gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                          <span className="text-sm font-medium">Text Colors</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Heading Color</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={headingTextColor}
                                onChange={(e) => setHeadingTextColor(e.target.value)}
                                className="w-10 h-10 rounded-lg border cursor-pointer"
                              />
                              <Input
                                value={headingTextColor}
                                onChange={(e) => setHeadingTextColor(e.target.value)}
                                className="text-xs font-mono"
                                placeholder="#1F2937"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Paragraph Color</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={paragraphTextColor}
                                onChange={(e) => setParagraphTextColor(e.target.value)}
                                className="w-10 h-10 rounded-lg border cursor-pointer"
                              />
                              <Input
                                value={paragraphTextColor}
                                onChange={(e) => setParagraphTextColor(e.target.value)}
                                className="text-xs font-mono"
                                placeholder="#6B7280"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="typography" className="space-y-6 mt-6">
                      {/* Font Selection */}
                      <div className="grid gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                          <span className="text-sm font-medium">Font Families</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Heading Font</label>
                            <select
                              value={headingFont}
                              onChange={(e) => setHeadingFont(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
                            >
                              {googleFonts.map(font => (
                                <option key={font} value={font}>{font}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Paragraph Font</label>
                            <select
                              value={paragraphFont}
                              onChange={(e) => setParagraphFont(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
                            >
                              {googleFonts.map(font => (
                                <option key={font} value={font}>{font}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      {/* Font Size Controls */}
                      <div className="grid gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                          <span className="text-sm font-medium">Font Sizes</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Heading Size</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="20"
                                max="48"
                                value={headingFontSize}
                                onChange={(e) => setHeadingFontSize(Number(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <Input
                                type="number"
                                min="20"
                                max="48"
                                value={headingFontSize}
                                onChange={(e) => setHeadingFontSize(Number(e.target.value))}
                                className="w-16 text-xs text-center"
                              />
                              <span className="text-xs text-muted-foreground">px</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Paragraph Size</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="12"
                                max="24"
                                value={paragraphFontSize}
                                onChange={(e) => setParagraphFontSize(Number(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <Input
                                type="number"
                                min="12"
                                max="24"
                                value={paragraphFontSize}
                                onChange={(e) => setParagraphFontSize(Number(e.target.value))}
                                className="w-16 text-xs text-center"
                              />
                              <span className="text-xs text-muted-foreground">px</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Typography Preview */}
                      <div className="grid gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                          <span className="text-sm font-medium">Preview</span>
                        </div>
                        <div className="p-4 bg-muted rounded-lg border">
                          <div 
                            className="font-bold mb-3"
                            style={{ 
                              fontFamily: headingFont,
                              fontSize: `${headingFontSize}px`,
                              color: headingTextColor,
                              lineHeight: '1.2'
                            }}
                          >
                            Sample Heading Text
                          </div>
                          <p 
                            style={{ 
                              fontFamily: paragraphFont,
                              fontSize: `${paragraphFontSize}px`,
                              color: paragraphTextColor,
                              lineHeight: '1.6'
                            }}
                          >
                            This is how your paragraph text will appear in the email template. You can see the font family, size, and color applied here.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Email Preview - Right side */}
              <Card className="bg-background">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Email Preview
                      {isUpdatingPreview && (
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Preview how your email will look to recipients
                      {isGenerated && " • Changes update automatically"}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleCopyHtml}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-4 py-2 shadow-lg whitespace-nowrap flex items-center"
                  >
                    <Copy className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-shrink-0">{htmlCopied ? "✅ Copied!" : "Copy HTML"}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden">
                <div className="border rounded-md h-[500px] overflow-auto relative">
                  {/* Loading overlay */}
                  {isUpdatingPreview && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        <p className="text-sm text-muted-foreground">Updating preview...</p>
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
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <Clipboard className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Enter Session URLs and click Generate to preview your email
                      </p>
                    </div>
                  )}
                </div>
                {isGenerated && (capturedHtml || sessions.length > 0) && (
                  <div className="p-4 border-t">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <strong>Capture Status:</strong> ✅ Success
                      </p>
                      {sessions.length > 1 ? (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            <strong>Sessions Processed:</strong>{" "}
                            {sessions.length}
                          </p>
                          <div className="mt-2 space-y-1">
                            {sessions.map((session, index) => (
                              <div
                                key={index}
                                className="text-xs text-muted-foreground"
                              >
                                • {session.title || `Session ${index + 1}`}{" "}
                                {session.error && "(Error)"}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          <strong>HTML Size:</strong>{" "}
                          {capturedHtml.length.toLocaleString()} characters
                        </p>
                      )}
                      <details className="">
                        <summary className="cursor-pointer font-medium text-sm text-muted-foreground hover:text-foreground">
                          View Email HTML Source
                        </summary>
                        <div className="mt-2 p-3 bg-muted rounded-md max-h-32 overflow-auto">
                          <pre className="text-xs whitespace-pre-wrap break-all">
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
            <Card className="bg-background">
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <CardDescription>
                  Preview how your email will look to recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <Clipboard className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Generate an email to see the preview
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Saved Projects Section - Removed premium requirement */}
        </div>
      </div>
    </div>
  );
}
