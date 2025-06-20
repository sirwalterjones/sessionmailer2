'use client';

import { useState } from 'react';
import { Share2, ExternalLink } from 'lucide-react';

interface SharePageProps {
  data: {
    id: string;
    sessions: Array<{
      url: string;
      title: string;
      html: string;
      firstImage?: string;
      images?: Array<{ url: string; source?: string }>;
    }>;
    emailHtml: string;
    createdAt: string;
    metadata?: {
      primaryColor?: string;
      secondaryColor?: string;
      headingTextColor?: string;
      paragraphTextColor?: string;
    };
  };
}

export default function SharePage({ data }: SharePageProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.sessions.length > 1 ? `${data.sessions.length} Session` : data.sessions[0]?.title || 'Session'} Email Template`,
          text: 'Check out this beautiful email template created with SessionMailer!',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Share URL copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                SessionMailer Template
              </h1>
              <p className="text-gray-600 mt-1">
                {data.sessions.length > 1 
                  ? `${data.sessions.length} Session Email Templates`
                  : data.sessions[0]?.title || 'Session Email Template'
                }
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Create Your Own
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">            
          <div className="p-6">
            <div 
              className="w-full border rounded-lg overflow-hidden"
              style={{ minHeight: '600px' }}
            >
              <iframe
                srcDoc={data.emailHtml}
                className="w-full h-full"
                style={{ minHeight: '600px' }}
                title="Email Template"
              />
            </div>
          </div>
        </div>

        {/* Session Info */}
        {data.sessions.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                Session Details ({data.sessions.length} session{data.sessions.length > 1 ? 's' : ''})
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.sessions.map((session, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    {session.firstImage && (
                      <img
                        src={session.firstImage}
                        alt={session.title}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {session.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {session.images?.length || 0} images available
                    </p>
                    <a
                      href={session.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      View Original Session
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center py-8 border-t">
          <p className="text-gray-600">
            Created with{' '}
            <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              SessionMailer
            </a>{' '}
            - Professional email templates for session photographers
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Generated on {new Date(data.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
} 