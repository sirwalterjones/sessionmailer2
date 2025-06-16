"use client";

import { useState, useEffect } from 'react';
import { Camera, Aperture, Timer, Palette, Sparkles } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
}

const photographyFacts = [
  {
    icon: Camera,
    fact: "The first photograph ever taken required an 8-hour exposure time!",
    detail: "Taken by Nicéphore Niépce in 1826"
  },
  {
    icon: Aperture,
    fact: "The human eye can see about 10 million different colors.",
    detail: "That's why color grading is so important in photography"
  },
  {
    icon: Timer,
    fact: "The fastest camera shutter speed can capture 1/8000th of a second.",
    detail: "Perfect for freezing motion like hummingbird wings"
  },
  {
    icon: Palette,
    fact: "The golden hour occurs when the sun is 6° below the horizon.",
    detail: "This creates the warm, soft light photographers love"
  },
  {
    icon: Sparkles,
    fact: "Professional cameras can have over 50 million pixels!",
    detail: "That's enough detail to print a billboard-sized photo"
  },
  {
    icon: Camera,
    fact: "The most expensive photograph ever sold was $4.3 million.",
    detail: "Andreas Gursky's 'Rhein II' broke all records"
  },
  {
    icon: Aperture,
    fact: "Your smartphone camera has more computing power than NASA used to land on the moon.",
    detail: "Modern computational photography is incredible"
  },
  {
    icon: Timer,
    fact: "The rule of thirds was actually borrowed from painting.",
    detail: "It's been helping create balanced compositions for centuries"
  },
  {
    icon: Palette,
    fact: "Black and white photography can be more emotionally powerful than color.",
    detail: "It removes distractions and focuses on mood and composition"
  },
  {
    icon: Sparkles,
    fact: "The word 'photography' means 'drawing with light' in Greek.",
    detail: "From 'photos' (light) and 'graphos' (drawing)"
  }
];

export default function LoadingModal({ isOpen, title = "Generating Your Beautiful Email", subtitle = "Creating something amazing..." }: LoadingModalProps) {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentFactIndex(0);
      setProgress(0);
      return;
    }

    // Rotate facts every 3 seconds
    const factInterval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % photographyFacts.length);
    }, 3000);

    // Simulate progress (just for visual appeal)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // Don't complete until actually done
        return prev + Math.random() * 3;
      });
    }, 200);

    return () => {
      clearInterval(factInterval);
      clearInterval(progressInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentFact = photographyFacts[currentFactIndex];
  const IconComponent = currentFact.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative z-10">
          {/* Main loading animation */}
          <div className="mb-6">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* Title and subtitle */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-600 mb-6">{subtitle}</p>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}% complete</p>
          </div>

          {/* Photography fact */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <IconComponent className="h-5 w-5 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-purple-800 mb-2">Did you know?</h3>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">{currentFact.fact}</p>
            <p className="text-xs text-gray-500 italic">{currentFact.detail}</p>
          </div>

          {/* Fact indicator dots */}
          <div className="flex justify-center mt-4 space-x-1">
            {photographyFacts.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentFactIndex 
                    ? 'bg-purple-500 scale-125' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 