"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";

interface SessionData {
  title: string;
  coverImage: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: string;
}

interface EmailPreviewProps {
  sessionData?: SessionData;
  onCopyHtml?: () => void;
}

const EmailPreview = ({
  sessionData = {
    title: "Sunset Portrait Session",
    coverImage:
      "https://images.unsplash.com/photo-1623109391520-49ecd2576a7e?w=800&q=80",
    description:
      "Capture beautiful moments during golden hour with a professional portrait session.\n\nThis session includes multiple outfit changes and various poses to create a diverse portfolio of stunning images.",
    date: "Saturday, March 15th, 2024",
    time: "5:30 PM",
    location: "Central Park, New York",
    price: "$350",
  },
  onCopyHtml,
}: EmailPreviewProps) => {
  const generateEmailHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${sessionData.title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header-image {
            width: 100%;
            height: 300px;
            object-fit: cover;
            display: block;
        }
        .content {
            padding: 32px;
        }
        .title {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 20px 0;
            color: #1a1a1a;
            line-height: 1.3;
        }
        .description {
            font-size: 16px;
            margin: 0 0 24px 0;
            color: #4a5568;
            white-space: pre-line;
        }
        .details {
            background-color: #f7fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #2d3748;
            font-size: 14px;
        }
        .detail-value {
            color: #4a5568;
            font-size: 14px;
            text-align: right;
        }
        .price {
            font-size: 24px;
            font-weight: 700;
            color: #2b6cb0;
        }
        .cta-section {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
        }
        .cta-button {
            display: inline-block;
            background-color: #2b6cb0;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background-color: #f7fafc;
            color: #718096;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <img src="${sessionData.coverImage}" alt="${sessionData.title}" class="header-image">
        
        <div class="content">
            <h1 class="title">${sessionData.title}</h1>
            
            <p class="description">${sessionData.description}</p>
            
            <div class="details">
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${sessionData.date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time</span>
                    <span class="detail-value">${sessionData.time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location</span>
                    <span class="detail-value">${sessionData.location}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Investment</span>
                    <span class="detail-value price">${sessionData.price}</span>
                </div>
            </div>
            
            <div class="cta-section">
                <a href="#" class="cta-button">Book Your Session</a>
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for considering our photography services!</p>
        </div>
    </div>
</body>
</html>`;
  };

  const handleCopyHtml = () => {
    const htmlContent = generateEmailHtml();
    navigator.clipboard.writeText(htmlContent).then(() => {
      if (onCopyHtml) {
        onCopyHtml();
      }
    });
  };

  const handleDownloadHtml = () => {
    const htmlContent = generateEmailHtml();
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sessionData.title.replace(/\s+/g, "-").toLowerCase()}-email.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white min-h-screen p-6">
      <Card className="max-w-4xl mx-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Email Preview</h2>
            <div className="flex gap-2">
              <Button
                onClick={handleCopyHtml}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy HTML
              </Button>
              <Button
                onClick={handleDownloadHtml}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="max-w-2xl mx-auto bg-white rounded-xl overflow-hidden shadow-lg">
              <img
                src={sessionData.coverImage}
                alt={sessionData.title}
                className="w-full h-64 object-cover"
              />

              <div className="p-8">
                <h1 className="text-3xl font-bold mb-5 text-gray-900 leading-tight">
                  {sessionData.title}
                </h1>

                <div className="text-gray-600 mb-6 leading-relaxed">
                  {sessionData.description
                    .split("\n\n")
                    .map((paragraph, index) => (
                      <p key={index} className="mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-5 mb-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-semibold text-gray-700 text-sm">
                        Date
                      </span>
                      <span className="text-gray-600 text-sm">
                        {sessionData.date}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-semibold text-gray-700 text-sm">
                        Time
                      </span>
                      <span className="text-gray-600 text-sm">
                        {sessionData.time}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-semibold text-gray-700 text-sm">
                        Location
                      </span>
                      <span className="text-gray-600 text-sm text-right">
                        {sessionData.location}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-semibold text-gray-700 text-sm">
                        Investment
                      </span>
                      <span className="text-blue-600 font-bold text-xl">
                        {sessionData.price}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-6 border-t border-gray-200">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors">
                    Book Your Session
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 text-center py-5 text-gray-500 text-xs">
                <p>Thank you for considering our photography services!</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmailPreview;
