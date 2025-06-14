"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailPreviewProps {
  title?: string;
  coverImage?: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  ctaUrl?: string;
}

// Create a simple EmailPreview component since we don't have access to the actual component
const EmailPreview = ({
  title = "Session Title",
  coverImage = "https://images.unsplash.com/photo-1623109391520-49ecd2576a7e?w=800&q=80",
  description = "Session description goes here",
  date = "Date",
  time = "Time",
  location = "Location",
  ctaUrl = "#",
}: EmailPreviewProps) => {
  return (
    <div className="p-6 bg-white">
      <div className="max-w-full mx-auto">
        <h2 className="text-2xl font-bold text-center mb-4">{title}</h2>

        <div className="mb-6">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-auto rounded-lg object-cover"
            style={{ maxHeight: "300px" }}
          />
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">{description}</p>

          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-gray-800">{date}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Time</p>
                <p className="text-gray-800">{time}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-gray-800">{location}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a
            href={ctaUrl}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md"
          >
            Book Now
          </a>
        </div>
      </div>
    </div>
  );
};

interface DashboardProps {
  isPremium?: boolean;
  savedProjects?: Array<{
    id: string;
    name: string;
    url: string;
    createdAt: string;
  }>;
}

export default function Dashboard({
  isPremium = false,
  savedProjects = [],
}: DashboardProps) {
  const [url, setUrl] = useState("https://book.usesession.com/s/tFMsifAt84");
  const [urls, setUrls] = useState("");
  const [isMultipleMode, setIsMultipleMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [error, setError] = useState("");
  const [capturedHtml, setCapturedHtml] = useState("");
  const [rawHtml, setRawHtml] = useState("");
  const [emailHtml, setEmailHtml] = useState("");
  const [htmlCopied, setHtmlCopied] = useState(false);
  const [rawHtmlCopied, setRawHtmlCopied] = useState(false);
  const [sessions, setSessions] = useState([]);

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

  const extractSessionData = async (urlInput: string | string[]) => {
    try {
      const requestBody = Array.isArray(urlInput)
        ? { urls: urlInput }
        : { url: urlInput };

      const response = await fetch("/api/extract-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to extract session data");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error extracting session data:", error);
      throw error;
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let urlsToProcess;

    if (isMultipleMode) {
      if (!urls.trim()) {
        setError("Please enter at least one URL");
        return;
      }

      urlsToProcess = urls
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      // Validate all URLs
      for (const u of urlsToProcess) {
        if (!u.includes("usesession.com")) {
          setError(`Invalid URL: ${u}. Please enter valid usesession.com URLs`);
          return;
        }
      }
    } else {
      if (!url.trim()) {
        setError("Please enter a URL");
        return;
      }

      if (!url.includes("usesession.com")) {
        setError("Please enter a valid usesession.com URL");
        return;
      }

      urlsToProcess = url;
    }

    setIsGenerating(true);

    try {
      const extractedData = await extractSessionData(urlsToProcess);

      if (extractedData.success) {
        setCapturedHtml(extractedData.html || "");
        setRawHtml(extractedData.rawHtml || extractedData.html || "");
        setEmailHtml(extractedData.emailHtml || "");
        setSessions(extractedData.sessions || []);

        if (extractedData.isMultiple) {
          setSessionData({
            title: `${extractedData.sessions.length} Photography Sessions`,
            coverImage:
              extractedData.sessions[0]?.firstImage ||
              "https://images.unsplash.com/photo-1623109391520-49ecd2576a7e?w=800&q=80",
            description: `Combined email with ${extractedData.sessions.length} sessions`,
            date: new Date(extractedData.timestamp).toLocaleDateString(),
            time: new Date(extractedData.timestamp).toLocaleTimeString(),
            location: "Multiple Sessions",
            ctaUrl: extractedData.sessions[0]?.url || "",
          });
        } else {
          setSessionData({
            title: extractedData.title || "Session Title",
            coverImage:
              extractedData.sessions[0]?.firstImage ||
              "https://images.unsplash.com/photo-1623109391520-49ecd2576a7e?w=800&q=80",
            description: `Captured from: ${extractedData.url}`,
            date: new Date(extractedData.timestamp).toLocaleDateString(),
            time: new Date(extractedData.timestamp).toLocaleTimeString(),
            location: "Captured HTML Content",
            ctaUrl: extractedData.url,
          });
        }

        setIsGenerated(true);
        setError("");
      } else {
        throw new Error(
          extractedData.error || "Failed to capture page content",
        );
      }
    } catch (error) {
      console.error("Extraction error:", error);
      setError(
        "Failed to extract session data. Please check the URL(s) and try again. Make sure the URLs are accessible and contain session information.",
      );
      setIsGenerated(false);
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
    if (!isPremium) {
      // Show upgrade prompt
    }
  };

  return (
    <div className="w-full min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Generate beautiful email templates from your Session URLs
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            {isPremium ? (
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-amber-200 to-yellow-400 text-black"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Premium Account
              </Badge>
            ) : (
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Upgrade to Premium
              </Button>
            )}
          </div>
        </div>

        <Tabs
          defaultValue="generate"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="generate">Generate Email</TabsTrigger>
            <TabsTrigger value="saved" disabled={!isPremium}>
              Saved Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-background">
                <CardHeader>
                  <CardTitle>URL to Email Generator</CardTitle>
                  <CardDescription>
                    Paste your usesession.com URL below to generate an email
                    template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        type="button"
                        variant={!isMultipleMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsMultipleMode(false)}
                      >
                        Single URL
                      </Button>
                      <Button
                        type="button"
                        variant={isMultipleMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsMultipleMode(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Multiple URLs
                      </Button>
                    </div>
                  </div>

                  <form onSubmit={handleUrlSubmit}>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        {isMultipleMode ? (
                          <div>
                            <Textarea
                              placeholder="Enter multiple URLs (one per line):\nhttps://book.usesession.com/s/...\nhttps://book.usesession.com/s/...\nhttps://book.usesession.com/s/..."
                              value={urls}
                              onChange={(e) => setUrls(e.target.value)}
                              className="w-full min-h-[120px]"
                              rows={5}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Enter one URL per line to create a combined email
                              with multiple sessions
                            </p>
                          </div>
                        ) : (
                          <Input
                            placeholder="https://book.usesession.com/s/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full"
                          />
                        )}
                      </div>
                      <Button
                        type="submit"
                        disabled={isGenerating || (!url.trim() && !urls.trim())}
                        className="w-full"
                      >
                        {isGenerating
                          ? "Capturing HTML..."
                          : isMultipleMode
                            ? "Capture & Generate Combined Email"
                            : "Capture & Generate"}
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
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          variant="secondary"
                          className="gap-2"
                          onClick={handleCopyHtml}
                        >
                          <Copy className="h-4 w-4" />
                          {htmlCopied ? "Copied!" : "Copy Email HTML"}
                        </Button>
                        {rawHtml && (
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={handleCopyRawHtml}
                          >
                            <Copy className="h-4 w-4" />
                            {rawHtmlCopied ? "Copied!" : "Copy Raw HTML"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={handleSaveProject}
                          disabled={!isPremium}
                        >
                          <Save className="h-4 w-4" />
                          {isPremium ? "Save Project" : "Save (Premium Only)"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardHeader>
                  <CardTitle>Email Preview</CardTitle>
                  <CardDescription>
                    Preview how your email will look to recipients
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                  <div className="border rounded-md h-[500px] overflow-auto">
                    {isGenerated && (emailHtml || capturedHtml) ? (
                      <div className="h-full">
                        <iframe
                          srcDoc={emailHtml || capturedHtml}
                          className="w-full h-full border-0"
                          title="Email Preview"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    ) : isGenerated ? (
                      <EmailPreview
                        title={sessionData.title}
                        coverImage={sessionData.coverImage}
                        description={sessionData.description}
                        date={sessionData.date}
                        time={sessionData.time}
                        location={sessionData.location}
                        ctaUrl={sessionData.ctaUrl}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <Clipboard className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Enter a Session URL and click Generate to preview your
                          email
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
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <Card className="bg-background">
              <CardHeader>
                <CardTitle>Saved Projects</CardTitle>
                <CardDescription>
                  Access your previously saved email templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedProjects.length > 0 ? (
                  <div className="grid gap-4">
                    {savedProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 border rounded-md"
                      >
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Load
                          </Button>
                          <Button variant="outline" size="sm">
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No saved projects yet
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Premium feature: Save unlimited projects for future use
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
