import { NextRequest, NextResponse } from "next/server";
import * as cheerio from 'cheerio';

interface SessionData {
  url: string;
  title: string;
  description: string;
  price: string;
  date: string;
  location: string;
  timeSlots: Array<{time: string, bookingUrl?: string}>;
  images: string[];
  enhancedEmailHtml: string;
  sessionContent: string;
  firstImage: string | null;
  rawHtmlWithButton: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { 
      url: requestUrl, 
      urls: requestUrls, 
      primaryColor = "#7851a9", 
      secondaryColor = "#6a4c96",
      headingFont = "Playfair Display",
      paragraphFont = "Georgia",
      headingFontSize = 28,
      paragraphFontSize = 16,
      headingTextColor = "#ffffff",
      paragraphTextColor = "#333333"
    } = requestBody;
    
    const urlsToProcess = requestUrls && Array.isArray(requestUrls) ? requestUrls : [requestUrl];
    
    // Validate URLs
    for (const url of urlsToProcess) {
      if (!url || !url.includes("usesession.com")) {
        return NextResponse.json(
          { error: `Invalid URL provided: ${url}` },
          { status: 400 }
        );
      }
    }
    
    const sessions: SessionData[] = [];
    
    for (const url of urlsToProcess) {
      try {
        console.log("Fetching URL:", url);
        
        // Fetch the HTML content with better headers
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.status}`);
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extract data using enhanced cheerio parsing
        const extractedData = extractSessionDataFromHTML($, url);
        
        // If we didn't get good content, create fallback data
        if (!extractedData.description || extractedData.description.length < 50) {
          extractedData.description = createFallbackDescription(url);
        }
        
        // Create email template
        const enhancedEmailHtml = createEmailTemplate(extractedData, url, primaryColor, secondaryColor, headingFont, paragraphFont, headingFontSize, paragraphFontSize, headingTextColor, paragraphTextColor);
        
        // Create session content
        const sessionContent = createSessionContent(extractedData, url, primaryColor, secondaryColor, headingFont, paragraphFont, headingFontSize, paragraphFontSize, headingTextColor, paragraphTextColor);
        
        const sessionData: SessionData = {
          url: url,
          title: extractedData.title,
          description: extractedData.description,
          price: extractedData.price,
          date: extractedData.date,
          location: extractedData.location,
          timeSlots: extractedData.timeSlots,
          images: extractedData.images,
          enhancedEmailHtml: enhancedEmailHtml,
          sessionContent: sessionContent,
          firstImage: extractedData.images[0] || null,
          rawHtmlWithButton: enhancedEmailHtml
        };
        
        sessions.push(sessionData);
        
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        // Create a more detailed fallback session
        const fallbackSession = createFallbackSession(url, primaryColor, secondaryColor, headingFont, paragraphFont, headingFontSize, paragraphFontSize, headingTextColor, paragraphTextColor);
        sessions.push(fallbackSession);
      }
    }
    
    // Create combined email HTML for multiple sessions
    let combinedEmailHtml = "";
    if (sessions.length > 1) {
      combinedEmailHtml = createMultiSessionEmailTemplate(sessions, primaryColor, secondaryColor, headingFont, paragraphFont, headingFontSize, paragraphFontSize, headingTextColor, paragraphTextColor);
    }
    
    return NextResponse.json({
      success: true,
      sessions: sessions,
      emailHtml: combinedEmailHtml || sessions[0]?.enhancedEmailHtml || "",
      rawHtml: combinedEmailHtml || sessions[0]?.rawHtmlWithButton || ""
    });
    
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error",
        sessions: []
      },
      { status: 500 }
    );
  }
}

function extractSessionDataFromHTML($: cheerio.Root, url: string) {
  // Extract title with multiple fallbacks
  const title = $('h1').first().text().trim() || 
               $('title').text().trim() || 
               $('[class*="title"]').first().text().trim() ||
               $('[class*="heading"]').first().text().trim() ||
               'Photography Session';
  
  // Enhanced description extraction
  let description = '';
  
  // Try multiple content selectors in order of preference
  const contentSelectors = [
    '.Mobiledoc',
    '[class*="description"]',
    '[class*="content"]',
    '[class*="body"]',
    '[class*="text"]',
    '[class*="about"]',
    '[class*="details"]',
    'main',
    '.main-content',
    'article',
    '.article-content',
    '[data-testid*="description"]',
    '[data-testid*="content"]'
  ];
  
  for (const selector of contentSelectors) {
    const element = $(selector);
    if (element.length && element.text().trim().length > 100) {
      description = element.text().trim();
      break;
    }
  }
  
  // If no description found, try to get the largest meaningful text block
  if (!description || description.length < 50) {
    let largestText = '';
    $('div, section, article, p, span').each((_index: number, el: cheerio.Element) => {
      const $el = $(el);
      const text = $el.text().trim();
      
      // Skip navigation, headers, footers, and small elements
      if (text.length > largestText.length && 
          text.length > 100 && 
          text.length < 8000 &&
          !$el.closest('nav').length &&
          !$el.closest('header').length &&
          !$el.closest('footer').length &&
          !$el.closest('script').length &&
          !$el.closest('style').length &&
          !text.match(/^(book|select|choose|click|powered\s+by|copyright|©)/i) &&
          !text.match(/^\d+:\d+\s*(AM|PM)/i) &&
          text.split(' ').length > 10) {
        largestText = text;
      }
    });
    
    if (largestText) {
      description = largestText;
    }
  }
  
  // Clean up description
  if (description) {
    description = description
      .replace(/\s+/g, ' ')
      .replace(/Book Now|Select Time|Choose Date|Powered by|Copyright|©/gi, '')
      .replace(/\n+/g, ' ')
      .trim();
  }
  
  // Enhanced image extraction
  const images: string[] = [];
  $('img').each((_index: number, img: cheerio.Element) => {
    const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy');
    if (src && 
        !src.includes('logo') && 
        !src.includes('icon') && 
        !src.includes('avatar') &&
        !src.includes('button') &&
        src.length > 10) {
      // Convert relative URLs to absolute
      try {
        const absoluteUrl = src.startsWith('http') ? src : new URL(src, url).href;
        if (!images.includes(absoluteUrl)) {
          images.push(absoluteUrl);
        }
      } catch (e) {
        // Skip invalid URLs
      }
    }
  });
  
  // Add some high-quality fallback images if none found
  if (images.length === 0) {
    images.push(
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    );
  }
  
  // Extract price with multiple selectors
  const price = $('[class*="price"], .price, [data-price], [class*="cost"], .cost').first().text().trim() || '';
  
  // Extract date with multiple selectors
  const date = $('[class*="date"], .date, [data-date], [class*="when"], .when, [class*="schedule"]').first().text().trim() || 
               extractDateFromText($('body').text()) || 'Date TBD';
  
  // Extract location with multiple selectors
  const location = $('[class*="location"], .location, [data-location], [class*="where"], .where, [class*="venue"], .venue, [class*="address"]').first().text().trim() || 
                   'Location TBD';
  
  // Extract time slots with enhanced detection
  const timeSlots: Array<{time: string, bookingUrl?: string}> = [];
  $('[class*="time"], .time, [data-time], [class*="slot"], .slot').each((_index: number, el: cheerio.Element) => {
    const time = $(el).text().trim();
    if (time && time.match(/\d+:\d+/)) {
      timeSlots.push({ time });
    }
  });
  
  // If no time slots found, try to extract from general text
  if (timeSlots.length === 0) {
    const bodyText = $('body').text();
    const timeMatches = bodyText.match(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)/g);
    if (timeMatches) {
      timeMatches.slice(0, 5).forEach(time => {
        timeSlots.push({ time: time.trim() });
      });
    }
  }
  
  return {
    title,
    description,
    price,
    date,
    location,
    timeSlots,
    images
  };
}

function extractDateFromText(text: string): string | null {
  // Try to extract dates from text content
  const datePatterns = [
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/i,
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
    /\b\d{4}-\d{2}-\d{2}\b/
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

function createFallbackDescription(url: string): string {
  return `Join us for an exclusive photography session! This carefully curated experience offers professional photography services in a beautiful setting. Whether you're looking to capture special moments, create stunning portraits, or document important milestones, our skilled photographers will work with you to create images you'll treasure forever.

Our sessions are designed to be comfortable and enjoyable, allowing your personality to shine through in every shot. We provide guidance on posing, lighting, and composition to ensure you get the best possible results.

Book your session today and let us help you create beautiful memories that will last a lifetime.`;
}

function createFallbackSession(url: string, primaryColor: string, secondaryColor: string, headingFont: string, paragraphFont: string, headingFontSize: number, paragraphFontSize: number, headingTextColor: string, paragraphTextColor: string): SessionData {
  const fallbackData = {
    title: "Photography Session",
    description: createFallbackDescription(url),
    price: "Contact for pricing",
    date: "Date TBD",
    location: "Location TBD",
    timeSlots: [{ time: "Time TBD" }],
    images: [
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  };
  
  const enhancedEmailHtml = createEmailTemplate(fallbackData, url, primaryColor, secondaryColor, headingFont, paragraphFont, headingFontSize, paragraphFontSize, headingTextColor, paragraphTextColor);
  
  return {
    url: url,
    title: fallbackData.title,
    description: fallbackData.description,
    price: fallbackData.price,
    date: fallbackData.date,
    location: fallbackData.location,
    timeSlots: fallbackData.timeSlots,
    images: fallbackData.images,
    enhancedEmailHtml: enhancedEmailHtml,
    sessionContent: `Session: ${fallbackData.title}\nDescription: ${fallbackData.description}\nBooking URL: ${url}`,
    firstImage: fallbackData.images[0],
    rawHtmlWithButton: enhancedEmailHtml,
    error: "Limited content extraction - using fallback data"
  };
}

function createEmailTemplate(data: any, originalUrl: string, primaryColor: string = "#7851a9", secondaryColor: string = "#6a4c96", headingFont: string = "Playfair Display", paragraphFont: string = "Georgia", headingFontSize: number = 28, paragraphFontSize: number = 16, headingTextColor: string = "#ffffff", paragraphTextColor: string = "#333333"): string {
  const firstImage = data.images[0] || 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=${headingFont.replace(' ', '+')}:wght@400;700&family=${paragraphFont.replace(' ', '+')}:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: '${paragraphFont}', serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f5f5f5; 
            color: ${paragraphTextColor};
            font-size: ${paragraphFontSize}px;
            line-height: 1.6;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
        }
        .header { 
            background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
            padding: 40px 30px; 
            text-align: center; 
        }
        .title { 
            font-family: '${headingFont}', serif;
            font-size: ${headingFontSize}px; 
            font-weight: 700; 
            color: ${headingTextColor}; 
            margin: 0; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .image-container {
            position: relative;
            overflow: hidden;
        }
        .main-image { 
            width: 100%; 
            height: 300px; 
            object-fit: cover; 
            display: block; 
        }
        .content { 
            padding: 40px 30px; 
        }
        .description { 
            font-size: ${paragraphFontSize}px; 
            line-height: 1.8; 
            color: ${paragraphTextColor}; 
            margin-bottom: 30px; 
            text-align: justify;
        }
        .details { 
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 25px; 
            border-radius: 8px; 
            margin-bottom: 30px; 
            border-left: 4px solid ${primaryColor};
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 12px; 
            align-items: center;
        }
        .detail-row:last-child {
            margin-bottom: 0;
        }
        .detail-label { 
            font-weight: 600; 
            color: #2c3e50;
            font-size: ${Math.max(14, paragraphFontSize - 2)}px;
        }
        .detail-value { 
            color: ${paragraphTextColor};
            font-size: ${Math.max(14, paragraphFontSize - 2)}px;
            text-align: right;
        }
        .cta { 
            text-align: center; 
            margin-top: 30px;
        }
        .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
            color: white; 
            padding: 15px 35px; 
            text-decoration: none; 
            border-radius: 50px; 
            font-weight: 600;
            font-size: ${Math.max(16, paragraphFontSize)}px;
            box-shadow: 0 4px 15px rgba(120, 81, 169, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover { 
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(120, 81, 169, 0.4);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer-text {
            color: #6c757d;
            font-size: ${Math.max(12, paragraphFontSize - 4)}px;
            margin: 0;
        }
        @media (max-width: 600px) {
            .container { margin: 10px; }
            .header { padding: 30px 20px; }
            .title { font-size: ${Math.max(20, headingFontSize - 8)}px; }
            .content { padding: 30px 20px; }
            .details { padding: 20px; }
            .cta-button { padding: 12px 25px; font-size: ${Math.max(14, paragraphFontSize - 2)}px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${data.title}</h1>
        </div>
        
        <div class="image-container">
            <img src="${firstImage}" alt="${data.title}" class="main-image">
        </div>
        
        <div class="content">
            <div class="description">${formatDescriptionForEmail(data.description, paragraphFont, paragraphFontSize, paragraphTextColor)}</div>
            
            <div class="details">
                <div class="detail-row">
                    <span class="detail-label">📅 Date:</span>
                    <span class="detail-value">${data.date}</span>
                </div>
                ${data.timeSlots.length > 0 ? `
                <div class="detail-row">
                    <span class="detail-label">⏰ Time:</span>
                                         <span class="detail-value">${data.timeSlots.map((slot: {time: string, bookingUrl?: string}) => slot.time).join(', ')}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">📍 Location:</span>
                    <span class="detail-value">${data.location}</span>
                </div>
                ${data.price ? `
                <div class="detail-row">
                    <span class="detail-label">💰 Price:</span>
                    <span class="detail-value">${data.price}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="cta">
                <a href="${originalUrl}" class="cta-button">Book Your Session</a>
            </div>
        </div>
        
        <div class="footer">
            <p class="footer-text">Ready to capture your special moments? Click the button above to secure your booking!</p>
        </div>
    </div>
</body>
</html>`;
}

function createSessionContent(data: any, originalUrl: string, primaryColor: string, secondaryColor: string, headingFont: string, paragraphFont: string, headingFontSize: number, paragraphFontSize: number, headingTextColor: string, paragraphTextColor: string): string {
  return `Session: ${data.title}\nDescription: ${data.description}\nDate: ${data.date}\nLocation: ${data.location}\nBooking URL: ${originalUrl}`;
}

function createMultiSessionEmailTemplate(sessions: SessionData[], primaryColor: string, secondaryColor: string, headingFont: string, paragraphFont: string, headingFontSize: number, paragraphFontSize: number, headingTextColor: string, paragraphTextColor: string): string {
  const sessionCards = sessions.map(session => `
    <div class="session-card">
      <img src="${session.firstImage || 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}" alt="${session.title}" class="session-image">
      <div class="session-content">
        <h3 class="session-title">${session.title}</h3>
        <p class="session-description">${session.description.substring(0, 150)}...</p>
        <div class="session-details">
          <p><strong>Date:</strong> ${session.date}</p>
          <p><strong>Location:</strong> ${session.location}</p>
        </div>
        <a href="${session.url}" class="session-cta">Book This Session</a>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photography Sessions Available</title>
    <link href="https://fonts.googleapis.com/css2?family=${headingFont.replace(' ', '+')}:wght@400;700&family=${paragraphFont.replace(' ', '+')}:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body { font-family: '${paragraphFont}', serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0; }
        .main-title { font-family: '${headingFont}', serif; font-size: ${headingFontSize + 4}px; color: ${headingTextColor}; margin: 0; }
        .sessions-grid { display: grid; gap: 20px; padding: 20px; background: white; }
        .session-card { border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
        .session-image { width: 100%; height: 200px; object-fit: cover; }
        .session-content { padding: 20px; }
        .session-title { font-family: '${headingFont}', serif; font-size: ${headingFontSize - 4}px; color: ${primaryColor}; margin: 0 0 10px 0; }
        .session-description { color: ${paragraphTextColor}; margin-bottom: 15px; }
        .session-details { background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
        .session-cta { display: inline-block; background: ${primaryColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 25px; }
        @media (max-width: 600px) { .sessions-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="main-title">Available Photography Sessions</h1>
        </div>
        <div class="sessions-grid">
            ${sessionCards}
        </div>
    </div>
</body>
</html>`;
}

function formatDescriptionForEmail(description: string, paragraphFont: string = 'Georgia', paragraphFontSize: number = 16, paragraphTextColor: string = "#333333"): string {
  if (!description) return '';
  
  // Clean and format the description
  const cleaned = description
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split into paragraphs and format
  const paragraphs = cleaned.split(/\n\n|\. (?=[A-Z])/).filter(p => p.trim().length > 0);
  
  return paragraphs
    .map(p => `<p style="margin-bottom: 15px; color: ${paragraphTextColor}; font-size: ${paragraphFontSize}px; line-height: 1.6;">${p.trim()}</p>`)
    .join('');
} 