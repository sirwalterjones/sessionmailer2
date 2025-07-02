import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

interface SessionData {
  url: string;
  title: string;
  description: string;
  price: string;
  date: string;
  location: string;
  dateTimePairs?: Array<{date: string, times: string[]}>;
  timeSlots: Array<{time: string, bookingUrl?: string}>;
  images: string[];
  enhancedEmailHtml: string;
  sessionContent: string;
  firstImage: string | null;
  rawHtmlWithButton: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  let browser = null;
  let requestBody: any;
  
  try {
    requestBody = await request.json();
    const { 
      url: requestUrl, 
      urls: requestUrls, 
      sessions: requestSessions,
      customization,
      primaryColor = "#7851a9", 
      secondaryColor = "#6a4c96",
      headingFont = "Playfair Display",
      paragraphFont = "Georgia",
      headingFontSize = 28,
      paragraphFontSize = 16,
      headingTextColor = "#ffffff",
      paragraphTextColor = "#333333",
      sessionHeroImages = {}
    } = requestBody;
    
    // Extract customization parameters if provided
    const finalPrimaryColor = customization?.primaryColor || primaryColor;
    const finalSecondaryColor = customization?.secondaryColor || secondaryColor;
    const finalHeadingFont = customization?.headingFont || headingFont;
    const finalParagraphFont = customization?.paragraphFont || paragraphFont;
    const finalHeadingFontSize = customization?.headingFontSize || headingFontSize;
    const finalParagraphFontSize = customization?.paragraphFontSize || paragraphFontSize;
    const finalHeadingTextColor = customization?.headingTextColor || headingTextColor;
    const finalParagraphTextColor = customization?.paragraphTextColor || paragraphTextColor;
    
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
    
    // Launch browser - use system Chromium in production
    const isProduction = process.env.NODE_ENV === 'production';
    const launchOptions: any = {
      headless: true,
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor"
      ],
    };

    // In production (Fly.io), use system Chromium
    if (isProduction && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    }

    browser = await chromium.launch(launchOptions);
    
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    });
    
    const sessions: SessionData[] = [];
    
    for (const url of urlsToProcess) {
      try {
        const page = await context.newPage();
        
        // Navigate to the URL
        await page.goto(url, { 
          waitUntil: 'networkidle', 
          timeout: 30000 
        });
        
        // Wait for content to load
        await page.waitForTimeout(5000);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);
        
        // Extract structured data from the page
        const extractedData = await page.evaluate(() => {
          // Extract title
          const title = document.querySelector('h1')?.textContent?.trim() || 
                       document.querySelector('title')?.textContent?.trim() || 
                       'Photography Session';
          
                     // Extract description - comprehensive approach
           let description = '';
           
           // Try multiple approaches to find the main content
           const contentSelectors = [
             '.Mobiledoc',
             '[class*="description"]',
             '[class*="content"]',
             '[class*="body"]',
             '[class*="text"]',
             'main',
             '.main-content',
             'article',
             '.article-content'
           ];
           
           let descriptionElement = null;
           for (const selector of contentSelectors) {
             const element = document.querySelector(selector);
             if (element && element.textContent && element.textContent.trim().length > 100) {
               descriptionElement = element;
               break;
             }
           }
           
           if (descriptionElement) {
             // Remove script and style elements first
             const scripts = descriptionElement.querySelectorAll('script, style, noscript');
             scripts.forEach(script => script.remove());
             
             // Get all paragraphs and text content within the description
             const paragraphs = descriptionElement.querySelectorAll('p, div');
             if (paragraphs.length > 0) {
               description = Array.from(paragraphs)
                 .map(p => p.textContent?.trim())
                 .filter(text => text && 
                   text.length > 10 && // Minimum meaningful length
                   text.length < 2000 && 
                   !text.match(/^(book|select|choose|click|powered\s+by)/i) && // Filter out action text
                   !text.match(/^\d+:\d+\s*(AM|PM)/i) && // Filter out time slots
                   !text.match(/^(\{|\}|function|var\s+|const\s+|let\s+|setTimeout|setInterval)/i) && // Filter out JS
                   !text.match(/^(\.|\#)[a-zA-Z_-]+\s*\{/) && // Filter out CSS
                   !text.match(/^(http|https|www\.)/i) && // Filter out URLs
                   !text.match(/^[a-zA-Z0-9+/]{20,}={0,2}$/) && // Filter out base64
                   !text.includes('fbq') && // Filter out Facebook tracking
                   !text.includes('gtag') && // Filter out Google tracking
                   !text.includes('dataLayer') && // Filter out Google Analytics
                   !text.includes('addEventListener') && // Filter out JS event listeners
                   !text.includes('querySelector') && // Filter out JS DOM queries
                   text.split(' ').length > 3) // Must have at least 4 words
                 .slice(0, 10) // Take reasonable amount of paragraphs
                 .join('\n\n');
             } else {
               const text = descriptionElement.textContent?.trim() || '';
               // Apply same filters to full text
               if (text.length > 50 && text.length < 8000 && 
                   !text.includes('function') && 
                   !text.includes('setTimeout') &&
                   !text.includes('fbq') &&
                   !text.includes('gtag')) {
                 description = text;
               }
             }
           }
           
                       // If still no description, try to find the main content area more broadly
            if (!description || description.length < 50) {
              // Look for the largest meaningful text block that's not navigation or header
              const allDivs = document.querySelectorAll('div, section, article, p');
              let largestContent = '';
              
              for (const div of Array.from(allDivs)) {
                // Remove scripts and styles from this element too
                const clonedDiv = div.cloneNode(true) as Element;
                const scripts = clonedDiv.querySelectorAll('script, style, noscript');
                scripts.forEach(script => script.remove());
                
                const text = clonedDiv.textContent?.trim() || '';
                // Skip navigation, headers, scripts, and apply content filters
                if (text.length > largestContent.length && 
                    text.length > 100 && 
                    text.length < 8000 &&
                    !div.closest('nav') && 
                    !div.closest('header') &&
                    !div.closest('footer') &&
                    !div.closest('script') &&
                    !div.closest('style') &&
                    !text.includes('function(') &&
                    !text.includes('setTimeout') &&
                    !text.includes('fbq') &&
                    !text.includes('gtag') &&
                    !text.includes('.addEventListener') &&
                    !text.includes('querySelector') &&
                    !text.match(/^[\{\}\(\);,\s]*$/) && // Not just punctuation
                    text.split(' ').length > 10) { // Must have meaningful word count
                  largestContent = text;
                }
              }
              
              if (largestContent) {
                description = largestContent;
              }
            }
            
            // Final cleanup of description
            if (description) {
              description = description
                .replace(/\s+/g, ' ') // Normalize whitespace first
                .replace(/Book Now|Select Time|Choose Date|Powered by/gi, '') // Remove common booking text
                .replace(/setTimeout\([^)]*\)[^;]*;?/gi, '') // Remove setTimeout calls
                .replace(/function\s*\([^)]*\)[^}]*\}/gi, '') // Remove function definitions
                .replace(/\{[^}]*\}/g, '') // Remove object/CSS blocks
                .replace(/fbq\([^)]*\)[^;]*;?/gi, '') // Remove Facebook tracking
                .replace(/gtag\([^)]*\)[^;]*;?/gi, '') // Remove Google tracking
                .replace(/\.themed_button[^}]*\}/gi, '') // Remove CSS rules
                .replace(/\$\d+\s*\+\s*Tax[^a-zA-Z]*/gi, '') // Remove duplicate pricing
                .replace(/\b\d{1,2}:\d{2}\s*(AM|PM)\b/gi, '') // Remove time slots from description
                .replace(/Choose from \d+ available spots?/gi, '') // Remove slot selection text
                .replace(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s*[A-Za-z]+ \d{1,2},? \d{4}/gi, '') // Remove dates from description
                .split(/[.!]\s+/) // Split into sentences
                .filter(sentence => 
                  sentence.length > 10 && 
                  !sentence.includes('function') &&
                  !sentence.includes('fbq') &&
                  !sentence.includes('gtag') &&
                  sentence.split(' ').length > 2)
                .join('. ') // Rejoin sentences
                .replace(/\s+/g, ' ') // Final whitespace cleanup
                .trim();
              
              // If description is still mostly code or very short, clear it
              if (description.length < 30 || 
                  description.includes('function') || 
                  description.includes('setTimeout') ||
                  description.includes('{') ||
                  description.split(' ').length < 8) {
                description = 'Beautiful photography session available for booking.';
              }
            }
          
          // Extract price
          let price = 'Contact for pricing';
          const priceElements = document.querySelectorAll('*');
                     for (const element of Array.from(priceElements)) {
            const text = element.textContent || '';
            const priceMatch = text.match(/\$\d+(?:\.\d{2})?(?:\s*\+\s*Tax)?/);
            if (priceMatch && element.children.length === 0) { // Only leaf nodes
              price = priceMatch[0];
              break;
            }
          }
          
                     // Extract date-time pairs
           const dateTimePairs: Array<{date: string, times: string[]}> = [];
           const seenDateTimes = new Set<string>();
           
           // Strategy 1: Look for structured session containers or date blocks
           const sessionContainers = document.querySelectorAll('[class*="session"], [class*="date"], [class*="day"], [class*="schedule"], [class*="booking"], [class*="event"], .card, .item, [class*="slot"]');
           
           for (const container of Array.from(sessionContainers)) {
             const containerText = container.textContent?.trim() || '';
             
             // Skip if container is too small or looks like navigation
             if (containerText.length < 10) continue;
             
             const containerClass = container.className.toLowerCase();
             const skipPatterns = ['nav', 'header', 'footer', 'menu', 'logo', 'copyright', 'social', 'breadcrumb'];
             if (skipPatterns.some(pattern => containerClass.includes(pattern))) continue;
             
             // Look for a date in this container
             const dateMatch = containerText.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i);
             
             if (dateMatch) {
               const dateStr = dateMatch[0].trim();
               
               // Find all time slots specifically within this container
               const containerTimes: string[] = [];
               
               // Look for interactive time elements within this container
               const timeElements = container.querySelectorAll('button, a, span, div, [class*="time"], [class*="slot"]');
               
               for (const timeEl of Array.from(timeElements)) {
                 const timeText = timeEl.textContent?.trim() || '';
                 const timeMatch = timeText.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/i);
                 
                 if (timeMatch) {
                   const timeStr = timeMatch[0].trim();
                   if (timeStr.match(/^([1-9]|1[0-2]):[0-5]\d\s*(AM|PM)$/i) && 
                       !containerTimes.includes(timeStr)) {
                     containerTimes.push(timeStr);
                   }
                 }
               }
               
               // If no interactive elements found, search the container text for times
               if (containerTimes.length === 0) {
                 const timeMatches = containerText.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/gi);
                 if (timeMatches) {
                   timeMatches.forEach(time => {
                     const timeStr = time.trim();
                     if (timeStr.match(/^([1-9]|1[0-2]):[0-5]\d\s*(AM|PM)$/i) && 
                         !containerTimes.includes(timeStr)) {
                       containerTimes.push(timeStr);
                     }
                   });
                 }
               }
               
               // Only add if we found times for this date
               if (containerTimes.length > 0) {
                 const uniqueKey = `${dateStr}-${containerTimes.join('-')}`;
                 if (!seenDateTimes.has(uniqueKey)) {
                   seenDateTimes.add(uniqueKey);
                   dateTimePairs.push({
                     date: dateStr,
                     times: containerTimes
                   });
                 }
               }
             }
           }
           
           // Strategy 2: If no structured containers found, try DOM proximity analysis
           if (dateTimePairs.length === 0) {
             const pageText = document.body.textContent || '';
             const datePattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi;
             const allDates = pageText.match(datePattern);
             
             if (allDates) {
               // For each date, find elements nearby that contain times
               allDates.forEach(dateStr => {
                 const cleanDate = dateStr.trim();
                 const dateTimes: string[] = [];
                 
                 // Find all elements that contain this date
                 const dateElements = document.querySelectorAll('*');
                 for (const el of Array.from(dateElements)) {
                   const elText = el.textContent?.trim() || '';
                   if (elText.includes(cleanDate)) {
                     // Look for sibling elements or nearby elements with times
                     const parent = el.parentElement;
                     const siblings = parent ? Array.from(parent.children) : [];
                     const nearbyElements = [el, ...siblings];
                     
                     if (parent) {
                       nearbyElements.push(parent);
                       if (parent.parentElement) {
                         nearbyElements.push(...Array.from(parent.parentElement.children));
                       }
                     }
                     
                     for (const nearbyEl of nearbyElements) {
                       const nearbyText = nearbyEl.textContent?.trim() || '';
                       const timeMatches = nearbyText.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/gi);
                       
                       if (timeMatches) {
                         timeMatches.forEach(time => {
                           const timeStr = time.trim();
                           if (timeStr.match(/^([1-9]|1[0-2]):[0-5]\d\s*(AM|PM)$/i) && 
                               !dateTimes.includes(timeStr)) {
                             dateTimes.push(timeStr);
                           }
                         });
                       }
                     }
                     break; // Found the date, move to next
                   }
                 }
                 
                 if (dateTimes.length > 0) {
                   const uniqueKey = `${cleanDate}-${dateTimes.join('-')}`;
                   if (!seenDateTimes.has(uniqueKey)) {
                     seenDateTimes.add(uniqueKey);
                     dateTimePairs.push({
                       date: cleanDate,
                       times: dateTimes.slice(0, 8) // Limit to 8 times per date
                     });
                   }
                 }
               });
             }
           }
           
           // If no structured date-time pairs found, fall back to separate extraction
           if (dateTimePairs.length === 0) {
             const pageText = document.body.textContent || '';
             
             // Extract all dates
             const dates: string[] = [];
             const datePatterns = [
               /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
               /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
               /\d{1,2}\/\d{1,2}\/\d{4}/g,
               /\d{4}-\d{2}-\d{2}/g
             ];
             
             for (const pattern of datePatterns) {
               const matches = pageText.match(pattern);
               if (matches) {
                 matches.forEach(match => {
                   const cleanMatch = match.trim();
                   if (!dates.includes(cleanMatch)) {
                     dates.push(cleanMatch);
                   }
                 });
                 if (dates.length > 0) break;
               }
             }
             
             // Extract times more carefully - look for booking-related sections
             const allTimes: string[] = [];
             
             // First try to find times in booking/session related sections
             const bookingSections = document.querySelectorAll('[class*="time"], [class*="slot"], [class*="available"], [class*="booking"], [class*="session"], button, .btn, [data-time]');
             
             for (const bookingSection of Array.from(bookingSections)) {
               const sectionText = bookingSection.textContent?.trim() || '';
               const timeMatches = sectionText.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/gi);
               
               if (timeMatches) {
                 timeMatches.forEach(time => {
                   const cleanTime = time.trim();
                   // Filter out obviously wrong times (like years, phone numbers, etc.)
                   if (!allTimes.includes(cleanTime) && 
                       !cleanTime.match(/^(19|20)\d{2}/) && // Not a year
                       cleanTime.match(/^([1-9]|1[0-2]):[0-5]\d\s*(AM|PM)$/i)) { // Valid time format
                     allTimes.push(cleanTime);
                   }
                 });
               }
             }
             
             // If no times found in structured sections, search page text more carefully
             if (allTimes.length === 0) {
               const timePattern = /\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/gi;
               const timeMatches = pageText.match(timePattern);
               if (timeMatches) {
                 // Filter and validate times
                 timeMatches.forEach(time => {
                   const cleanTime = time.trim();
                   if (!allTimes.includes(cleanTime) && 
                       !cleanTime.match(/^(19|20)\d{2}/) && // Not a year
                       cleanTime.match(/^([1-9]|1[0-2]):[0-5]\d\s*(AM|PM)$/i)) { // Valid time format
                     allTimes.push(cleanTime);
                   }
                 });
               }
             }
             
             // Create date-time pairs (each date gets all available times)
             if (dates.length > 0 && allTimes.length > 0) {
               dates.forEach(date => {
                 dateTimePairs.push({
                   date: date,
                   times: allTimes
                 });
               });
             } else if (dates.length > 0) {
               // Just dates, no times
               dates.forEach(date => {
                 dateTimePairs.push({
                   date: date,
                   times: []
                 });
               });
             }
           }
           
           // Legacy format for backward compatibility - show "Multiple Dates" if more than 3 dates
           const allDates = dateTimePairs.map(pair => pair.date);
           const date = allDates.length > 3 ? 'Multiple Dates Available' : allDates.join(', ');
          
                     // Extract location
           let location = '';
           
           // First try to find address in specific location-related elements
           const locationSelectors = ['.location', '.address', '[class*="location"]', '[class*="address"]'];
           for (const selector of locationSelectors) {
             const element = document.querySelector(selector);
             if (element) {
               const text = element.textContent?.trim();
               if (text && text.length < 200) { // Reasonable address length
                 location = text;
                 break;
               }
             }
           }
           
           // If not found, look for address pattern in the DOM more carefully
           if (!location) {
             const addressRegex = /\d+\s+[A-Za-z0-9\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Hwy|Highway|Pkwy|Parkway|Ct|Court|Pl|Place|Way|Circle|Cir)[^,]*,\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}/i;
             
             // Look through all text nodes for a clean address
             const walker = document.createTreeWalker(
               document.body,
               NodeFilter.SHOW_TEXT
             );
             
             let node;
             while (node = walker.nextNode()) {
               const text = node.textContent || '';
               const addressMatch = text.match(addressRegex);
               if (addressMatch && addressMatch[0].length < 100) { // Reasonable address length
                 location = addressMatch[0].trim();
                 break;
               }
             }
           }
           
           // Fallback: look for any address-like pattern in shorter text chunks
           if (!location) {
             const allElements = document.querySelectorAll('div, p, span');
             for (const element of Array.from(allElements)) {
               const text = element.textContent?.trim() || '';
               if (text.length > 10 && text.length < 100) { // Reasonable length
                 const addressMatch = text.match(/\d+.*?(?:Hwy|Highway|St|Street|Ave|Avenue|Rd|Road|Dr|Drive).*?[A-Z]{2}\s*\d{5}/i);
                 if (addressMatch) {
                   location = addressMatch[0].trim();
                   break;
                 }
               }
             }
           }
          
                     // Legacy time slots extraction for backward compatibility
           const timeSlots: Array<{time: string, bookingUrl?: string}> = [];
           const seenTimes = new Set<string>();
           
           // Extract all unique times from dateTimePairs for legacy support
           dateTimePairs.forEach(pair => {
             pair.times.forEach(time => {
               if (!seenTimes.has(time)) {
                 seenTimes.add(time);
                 timeSlots.push({
                   time: time,
                   bookingUrl: `${window.location.href}?time=${encodeURIComponent(time)}`
                 });
               }
             });
           });
           
           // If no times from date-time pairs, fall back to improved extraction method
           if (timeSlots.length === 0) {
             // Look for interactive elements with times
             const timeElements = document.querySelectorAll('button, .time-slot, [class*="time"], [class*="slot"], .slot, a[href*="time"], a[href*="book"], [data-time], .btn, [class*="available"]');
             
             Array.from(timeElements).forEach(element => {
               const text = element.textContent?.trim() || '';
               const timeMatch = text.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/i);
               
               if (timeMatch && !seenTimes.has(timeMatch[0])) {
                 // Validate the time format
                 const timeStr = timeMatch[0].trim();
                 if (timeStr.match(/^([1-9]|1[0-2]):[0-5]\d\s*(AM|PM)$/i)) {
                   seenTimes.add(timeStr);
                   let bookingUrl = '';
                   
                   if (element.tagName === 'A') {
                     bookingUrl = (element as HTMLAnchorElement).href;
                   } else {
                     bookingUrl = `${window.location.href}?time=${encodeURIComponent(timeStr)}`;
                   }
                   
                   timeSlots.push({
                     time: timeStr,
                     bookingUrl: bookingUrl
                   });
                 }
               }
             });
             
             // Final fallback - search page text with better filtering
             if (timeSlots.length === 0) {
               const pageText = document.body.textContent || '';
               const timeMatches = pageText.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/gi);
               if (timeMatches) {
                 // Filter and validate times, limit to reasonable number
                 const validTimes = timeMatches
                   .map(match => match.trim())
                   .filter(time => {
                     return time.match(/^([1-9]|1[0-2]):[0-5]\d\s*(AM|PM)$/i) && // Valid format
                            !time.match(/^(19|20)\d{2}/) && // Not a year
                            !seenTimes.has(time);
                   })
                   .slice(0, 8); // Limit to 8 times
                 
                 validTimes.forEach(cleanTime => {
                   seenTimes.add(cleanTime);
                   timeSlots.push({
                     time: cleanTime,
                     bookingUrl: `${window.location.href}?time=${encodeURIComponent(cleanTime)}`
                   });
                 });
               }
             }
           }
          
          // Extract images
          const images: string[] = [];
          
          // First try meta tags for the main image
          const metaImage = document.querySelector('meta[name="image"], meta[property="og:image"]');
          if (metaImage) {
            const imageUrl = metaImage.getAttribute('content');
            if (imageUrl && !isLogoOrBrandingImage(imageUrl)) {
              images.push(imageUrl);
            }
          }
          
          // Function to check if an image is likely a logo or branding
          function isLogoOrBrandingImage(imageUrl: string): boolean {
            const logoKeywords = [
              'logo', 'brand', 'watermark', 'signature', 'stamp', 'copyright',
              'header', 'nav', 'menu', 'icon', 'favicon', 'badge', 'emblem',
              'photographer', 'photography', 'studio', 'company', 'business',
              'moments', 'candice', 'jones', 'candi', 'by', 'branding'
            ];
            
            const urlLower = imageUrl.toLowerCase();
            
            // Check URL for logo-related keywords
            if (logoKeywords.some(keyword => urlLower.includes(keyword))) {
              return true;
            }
            
            // Check for small image size indicators in filename (common for logos)
            const sizePatterns = [
              /-sm\./,     // -sm.jpg
              /-small\./,  // -small.png
              /-xs\./,     // -xs.jpg
              /-thumb\./,  // -thumb.png
              /-icon\./,   // -icon.svg
              /-md\./,     // -md.png (medium size, often used for logos)
              /-avatar\./  // -avatar.jpg
            ];
            
            if (sizePatterns.some(pattern => pattern.test(urlLower))) {
              return true;
            }
            
            // Check for very small dimensions in filename (common for logos)
            if (urlLower.match(/\d+x\d+/) && urlLower.match(/([1-9]\d{0,2}x[1-9]\d{0,2})/)) {
              const match = urlLower.match(/(\d+)x(\d+)/);
              if (match) {
                const width = parseInt(match[1]);
                const height = parseInt(match[2]);
                // Consider images smaller than 300x300 as potential logos
                if (width < 300 && height < 300) {
                  return true;
                }
              }
            }
            
            // Check for CDN patterns that often serve profile/logo images
            const cdnLogoPatterns = [
              /digitaloceanspaces\.com\/\d+\/[a-f0-9-]+-md\./,  // DigitalOcean spaces with -md suffix
              /digitaloceanspaces\.com\/\d+\/[a-f0-9-]+-sm\./,  // DigitalOcean spaces with -sm suffix
              /digitaloceanspaces\.com\/\d+\/[a-f0-9-]+-thumb\./, // DigitalOcean spaces with -thumb suffix
              /amazonaws\.com\/.*profile/,                        // AWS S3 profile images
              /cloudfront\.net\/.*logo/,                         // CloudFront logo images
              /gravatar\.com/,                                   // Gravatar profile images
              /\/avatars?\//,                                    // Avatar directories
              /\/profiles?\//,                                   // Profile directories
              /\/logos?\//                                       // Logo directories
            ];
            
            if (cdnLogoPatterns.some(pattern => pattern.test(urlLower))) {
              return true;
            }
            
            // Check for common logo file patterns
            if (urlLower.includes('signature') || 
                urlLower.includes('byline') ||
                urlLower.includes('branding') ||
                urlLower.includes('profile') ||
                urlLower.includes('avatar') ||
                urlLower.match(/\b[a-z]+\s+(by|photography|photo|studio|moments)\b/)) {
              return true;
            }
            
            // Check for file naming patterns that suggest logos/branding
            const logoFilePatterns = [
              /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-(sm|md|thumb|small|icon)\./,  // UUID with size suffix
              /^[a-f0-9]{32}-(sm|md|thumb)\./,  // MD5 hash with size suffix
              /\/(sm|md|thumb|small|icon)_/,    // Size prefix in path
            ];
            
            if (logoFilePatterns.some(pattern => pattern.test(urlLower))) {
              return true;
            }
            
            return false;
          }
          
          // Function to check if an element is likely a logo container
          function isLogoContainer(element: Element): boolean {
            const logoClasses = [
              'logo', 'brand', 'header', 'nav', 'navigation', 'menu',
              'photographer', 'studio', 'watermark', 'signature', 'branding',
              'byline', 'moments', 'candice', 'candi', 'jones', 'footer'
            ];
            
            const className = element.className.toLowerCase();
            const id = element.id.toLowerCase();
            const parent = element.parentElement;
            const parentClass = parent ? parent.className.toLowerCase() : '';
            
            // Check element classes and IDs
            if (logoClasses.some(logoClass => 
              className.includes(logoClass) || 
              id.includes(logoClass) ||
              parentClass.includes(logoClass)
            )) {
              return true;
            }
            
            // Check text content for photography business names
            const textContent = element.textContent?.toLowerCase() || '';
            if (textContent.includes('photography') || 
                textContent.includes('photographer') ||
                textContent.includes('moments') ||
                textContent.includes('candice') ||
                textContent.includes('candi') ||
                textContent.includes('jones') ||
                textContent.match(/\b[a-z]+\s+by\s+[a-z]+/i)) {
              return true;
            }
            
            return false;
          }
          
          // Then look for carousel or gallery images
          const imageElements = document.querySelectorAll('img, [style*="background-image"]');
          Array.from(imageElements).forEach(element => {
            let imageUrl = '';
            
            // Skip if it's in a logo container
            if (isLogoContainer(element)) {
              return;
            }
            
            if (element.tagName === 'IMG') {
              const img = element as HTMLImageElement;
              imageUrl = img.src;
              
              // Additional checks for img elements
              const alt = img.alt?.toLowerCase() || '';
              const title = img.title?.toLowerCase() || '';
              
              // Skip images with logo-related alt text or titles
              if (alt.includes('logo') || alt.includes('photographer') || 
                  title.includes('logo') || title.includes('photographer')) {
                return;
              }
              
              // Skip very small images (likely logos)
              if (img.width && img.height && img.width < 200 && img.height < 200) {
                return;
              }
              
            } else {
              const style = (element as HTMLElement).style.backgroundImage;
              const urlMatch = style.match(/url\(["']?(.*?)["']?\)/);
              if (urlMatch) {
                imageUrl = urlMatch[1];
              }
            }
            
            if (imageUrl && 
                imageUrl.startsWith('http') && 
                !isLogoOrBrandingImage(imageUrl) &&
                !images.includes(imageUrl)) {
              images.push(imageUrl);
            }
          });
          
          return {
            title,
            description: description || 'Beautiful photography session available for booking.',
            price,
            date: date || 'Contact for available dates',
            location: location || 'Location details available upon booking',
            dateTimePairs: dateTimePairs,
            timeSlots: timeSlots.slice(0, 8), // Limit to 8 time slots
            images: images.slice(0, 5) // Limit to 5 images
          };
        });
        
        // Apply custom hero image if specified for this session
        const customHeroImage = sessionHeroImages[url];
        if (customHeroImage && extractedData.images.includes(customHeroImage)) {
          // Move the custom hero image to the front
          const filteredImages = extractedData.images.filter(img => img !== customHeroImage);
          extractedData.images = [customHeroImage, ...filteredImages];
        }
        
        // Create enhanced email HTML from extracted data
        const enhancedEmailHtml = createEmailTemplate(extractedData, url, finalPrimaryColor, finalSecondaryColor, finalHeadingFont, finalParagraphFont, finalHeadingFontSize, finalParagraphFontSize, finalHeadingTextColor, finalParagraphTextColor);
        const sessionContent = createSessionContent(extractedData, url, finalPrimaryColor, finalSecondaryColor, finalHeadingFont, finalParagraphFont, finalHeadingFontSize, finalParagraphFontSize, finalHeadingTextColor, finalParagraphTextColor);
        
        // Get traditional HTML for fallback
        const fullHtml = await page.content();
        const pageTitle = await page.title();
        
        // Create raw HTML with button
        const rawHtmlWithButton = fullHtml.replace(
          /<\/body>/i,
          `<div style="text-align: center; margin: 30px 0; padding: 20px;">
            <a href="${url}" style="display: inline-block; background-color: #7851a9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">Book Now</a>
          </div></body>`
        );
        
        sessions.push({
          url,
          title: extractedData.title,
          description: extractedData.description,
          price: extractedData.price,
          date: extractedData.date,
          location: extractedData.location,
          dateTimePairs: extractedData.dateTimePairs,
          timeSlots: extractedData.timeSlots,
          images: extractedData.images,
          enhancedEmailHtml,
          sessionContent,
          rawHtmlWithButton,
          firstImage: extractedData.images[0] || null,
        });
        
        await page.close();
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error);
        sessions.push({
          url,
          title: `Error loading ${url}`,
          description: '',
          price: '',
          date: '',
          location: '',
          timeSlots: [],
          images: [],
          enhancedEmailHtml: '',
          sessionContent: '',
          rawHtmlWithButton: '',
          firstImage: null,
          error: (error as Error).message,
        });
      }
    }
    
    // Generate response
    let emailHtml = "";
    let rawHtml = "";
    
    if (sessions.length === 1) {
      emailHtml = sessions[0].enhancedEmailHtml;
      rawHtml = sessions[0].rawHtmlWithButton;
    } else if (sessions.length > 1) {
      // Combine multiple sessions using just the content portions
      const combinedSessions = sessions
        .map(session => session.sessionContent)
        .join('<div style="margin: 20px 0; text-align: center;"><div style="height: 2px; background: linear-gradient(135deg, #7851a9 0%, #6a4c96 100%); margin: 20px auto; width: 100px; border-radius: 2px;"></div></div>');
      
      // Get font family with fallback for combined sessions
      const headingFontFamily = GOOGLE_FONTS[finalHeadingFont as keyof typeof GOOGLE_FONTS] 
        ? `'${finalHeadingFont}', ${GOOGLE_FONTS[finalHeadingFont as keyof typeof GOOGLE_FONTS]}`
        : "'Playfair Display', serif";
      
      // Generate Google Fonts import URL for combined sessions
      const fontsToImport = [finalHeadingFont, finalParagraphFont].filter((font, index, arr) => 
        font !== 'Georgia' && font !== 'Arial' && arr.indexOf(font) === index
      );
      const googleFontsUrl = fontsToImport.length > 0 
        ? `https://fonts.googleapis.com/css2?${fontsToImport.map(font => `family=${font.replace(/\s+/g, '+')}`).join('&')}&display=swap`
        : '';

      emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photography Sessions</title>
    ${googleFontsUrl ? `<link href="${googleFontsUrl}" rel="stylesheet">` : ''}
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: ${headingFontFamily};
            background: #f5f5f5; 
            line-height: 1.6;
        }
        .sessions-container { 
            max-width: 650px; 
            margin: 0 auto; 
            padding: 20px; 
        }
    </style>
</head>
<body>
    <div class="sessions-container">
        ${combinedSessions}
    </div>
</body>
</html>`;
      rawHtml = emailHtml;
    }
    
    return NextResponse.json({
      success: true,
      sessions,
      emailHtml,
      rawHtml,
      isMultiple: sessions.length > 1,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error in enhanced extract:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to extract session data",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }
  }
}

// Popular Google Fonts for email templates
const GOOGLE_FONTS = {
  'Playfair Display': 'serif',
  'Open Sans': 'sans-serif',
  'Lato': 'sans-serif',
  'Montserrat': 'sans-serif',
  'Roboto': 'sans-serif',
  'Poppins': 'sans-serif',
  'Merriweather': 'serif',
  'Lora': 'serif',
  'Source Sans Pro': 'sans-serif',
  'Nunito': 'sans-serif',
  'Inter': 'sans-serif',
  'Crimson Text': 'serif'
};

// Helper function to format description into proper HTML paragraphs for email clients
function formatDescriptionForEmail(description: string, paragraphFont: string = 'Georgia', paragraphFontSize: number = 16, paragraphTextColor: string = "#333333"): string {
  if (!description) return `<p style="font-size: ${paragraphFontSize}px; color: ${paragraphTextColor}; margin: 0 0 20px 0; line-height: 1.7; font-family: Georgia, serif;">Beautiful photography session available for booking.</p>`;
  
  // Split description into sentences and group them into paragraphs
  const sentences = description.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];
  
  sentences.forEach((sentence, index) => {
    currentParagraph.push(sentence.trim());
    
    // Create a new paragraph every 2-3 sentences or if we detect a natural break
    if (currentParagraph.length >= 2 && (
      index === sentences.length - 1 || // Last sentence
      sentence.length > 100 || // Long sentence suggests end of thought
      sentences[index + 1]?.match(/^(However|But|Additionally|Furthermore|Moreover|Also)/i) // Transition words
    )) {
      paragraphs.push(currentParagraph.join(' '));
      currentParagraph = [];
    }
  });
  
  // Add any remaining sentences as a final paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(' '));
  }
  
  // Get font family with fallback
  const fontFamily = GOOGLE_FONTS[paragraphFont as keyof typeof GOOGLE_FONTS] 
    ? `'${paragraphFont}', ${GOOGLE_FONTS[paragraphFont as keyof typeof GOOGLE_FONTS]}`
    : 'Georgia, serif';
  
  // Convert paragraphs to HTML with inline styles for email compatibility
  return paragraphs
    .map(paragraph => `<p style="font-size: ${paragraphFontSize}px; color: ${paragraphTextColor}; margin: 0 0 20px 0; line-height: 1.7; font-family: ${fontFamily};">${paragraph}</p>`)
    .join('');
}

function createEmailTemplate(data: any, originalUrl: string, primaryColor: string = "#7851a9", secondaryColor: string = "#6a4c96", headingFont: string = "Playfair Display", paragraphFont: string = "Georgia", headingFontSize: number = 28, paragraphFontSize: number = 16, headingTextColor: string = "#ffffff", paragraphTextColor: string = "#333333"): string {
  const { title, description, price, date, location, timeSlots, images, dateTimePairs } = data;
  
  // Create image gallery HTML (excluding the first image which is now the hero)
  const imageGallery = images.length > 1 ? `
    <div style="margin: 30px 0; text-align: center;">
      <div class="gallery-container">
        ${images.slice(1, 5).map((img: string, index: number) => `
          <div class="gallery-item">
            <a href="${img}" target="_blank" style="text-decoration: none; display: block;">
              <img src="${img}" alt="${title} - Image ${index + 2}" class="gallery-image"
                   onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.25)'; this.style.borderColor='${primaryColor}'"
                   onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.15)'; this.style.borderColor='transparent'">
            </a>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';
  
  // Create date-time pairs HTML or fallback to legacy time slots
  let schedulingHtml = '';
  
  if (dateTimePairs && dateTimePairs.length > 0 && dateTimePairs.some((pair: any) => pair.times.length > 0)) {
    // New date-time pairs format
    // Always show detailed view with individual dates and times
    schedulingHtml = `
      <div style="margin: 25px 0;">
        <h3 style="font-size: 18px; color: #333; margin: 0 0 15px 0; font-weight: 600;">Available Sessions:</h3>
        <div class="sessions-container">
          ${dateTimePairs.map((pair: any) => `
            <div class="session-date-group" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${primaryColor};">
              <h4 style="margin: 0 0 10px 0; color: ${primaryColor}; font-size: 16px; font-weight: 600;">${pair.date}</h4>
              ${pair.times.length > 0 ? `
                <div class="time-slots-container">
                  ${pair.times.map((time: string) => `
                    <a href="${originalUrl}?date=${encodeURIComponent(pair.date)}&time=${encodeURIComponent(time)}" target="_blank" style="text-decoration: none;">
                      <span class="time-slot" style="cursor: pointer; transition: all 0.3s ease; display: inline-block; margin: 3px 5px 3px 0; padding: 8px 16px; background: white; border: 1px solid #dee2e6; border-radius: 20px; font-size: 14px; color: #333;"
                            onmouseover="this.style.backgroundColor='${primaryColor}'; this.style.color='white'; this.style.borderColor='${primaryColor}'"
                            onmouseout="this.style.backgroundColor='white'; this.style.color='#333'; this.style.borderColor='#dee2e6'">${time}</span>
                    </a>
                  `).join('')}
                </div>
              ` : '<p style="margin: 0; color: #666; font-style: italic;">Time slots to be announced</p>'}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (timeSlots.length > 0) {
    // Fallback to legacy time slots format
    schedulingHtml = `
      <div style="margin: 25px 0;">
        <h3 style="font-size: 18px; color: #333; margin: 0 0 15px 0; font-weight: 600;">Available Times:</h3>
        <div class="time-slots-container">
          ${timeSlots.map((slot: {time: string, bookingUrl?: string}) => `
            <a href="${slot.bookingUrl || originalUrl}" target="_blank" style="text-decoration: none;">
              <span class="time-slot" style="cursor: pointer; transition: all 0.3s ease; display: inline-block; margin: 3px 5px 3px 0; padding: 8px 16px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 20px; font-size: 14px; color: #333;"
                    onmouseover="this.style.backgroundColor='${primaryColor}'; this.style.color='white'; this.style.borderColor='${primaryColor}'"
                    onmouseout="this.style.backgroundColor='#f8f9fa'; this.style.color='#333'; this.style.borderColor='#dee2e6'">${slot.time}</span>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Get font families with fallbacks
  const headingFontFamily = GOOGLE_FONTS[headingFont as keyof typeof GOOGLE_FONTS] 
    ? `'${headingFont}', ${GOOGLE_FONTS[headingFont as keyof typeof GOOGLE_FONTS]}`
    : "'Playfair Display', serif";
  const paragraphFontFamily = GOOGLE_FONTS[paragraphFont as keyof typeof GOOGLE_FONTS] 
    ? `'${paragraphFont}', ${GOOGLE_FONTS[paragraphFont as keyof typeof GOOGLE_FONTS]}`
    : "Georgia, serif";

  // Generate Google Fonts import URL
  const fontsToImport = [headingFont, paragraphFont].filter((font, index, arr) => 
    font !== 'Georgia' && font !== 'Arial' && arr.indexOf(font) === index
  );
  const googleFontsUrl = fontsToImport.length > 0 
    ? `https://fonts.googleapis.com/css2?${fontsToImport.map(font => `family=${font.replace(/\s+/g, '+')}`).join('&')}&display=swap`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${googleFontsUrl ? `<link href="${googleFontsUrl}" rel="stylesheet">` : ''}
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: ${paragraphFontFamily};
            background-color: #ffffff;
            line-height: 1.6;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        .email-wrapper { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #fff;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        .hero-image {
            width: 100%;
            height: auto;
            display: block;
            max-height: 400px;
            object-fit: cover;
        }
        .header {
            background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .content {
            padding: 30px;
        }
        .title {
            font-size: ${headingFontSize}px;
            font-weight: 700;
            margin: 0;
            font-family: ${headingFontFamily};
            color: ${headingTextColor};
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .price {
            font-size: 24px;
            font-weight: 600;
            margin: 15px 0 0 0;
            color: #fff;
        }
        .details-box {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            border-left: 4px solid ${primaryColor};
        }
        .detail-item {
            margin: 10px 0;
            font-size: 15px;
            color: #555;
        }
        .detail-label {
            font-weight: 600;
            color: #333;
            display: inline-block;
            min-width: 70px;
        }
        .book-now-btn { 
            display: inline-block !important; 
            background-color: ${primaryColor} !important;
            color: white !important; 
            padding: 15px 35px !important; 
            text-decoration: none !important; 
            border-radius: 25px !important; 
            font-weight: bold !important; 
            font-size: 16px !important; 
            margin: 20px 0 !important;
            text-align: center !important;
            min-width: 200px !important;
            box-sizing: border-box !important;
        }
        .cta-section {
            text-align: center;
            margin: 30px 0;
            padding: 30px 20px;
            background-color: #fafafa;
            border-radius: 8px;
        }

        .gallery-container {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
            padding: 10px 0;
        }
        .gallery-item {
            position: relative;
            display: inline-block;
        }
        .gallery-image {
            width: 110px;
            height: 110px;
            object-fit: cover;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        .time-slots-container {
            text-align: center;
        }
        .time-slot {
            display: inline-block;
            background-color: #f8f9fa;
            color: #333;
            padding: 8px 16px;
            margin: 4px;
            border-radius: 20px;
            border: 1px solid #dee2e6;
            font-size: 14px;
            font-weight: 500;
        }

        /* Mobile Responsive Styles */
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                margin: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
            }
            .header {
                padding: 25px 20px !important;
            }
            .title {
                font-size: ${Math.max(20, headingFontSize - 4)}px !important;
                line-height: 1.3 !important;
            }
            .price {
                font-size: 20px !important;
            }
            .content {
                padding: 20px !important;
            }
            .details-box {
                padding: 15px !important;
                margin: 20px 0 !important;
            }
            .detail-item {
                font-size: ${Math.max(12, paragraphFontSize - 2)}px !important;
                margin: 8px 0 !important;
            }
            .detail-label {
                display: block !important;
                margin-bottom: 2px !important;
                min-width: auto !important;
            }
            .gallery-container {
                gap: 8px !important;
                padding: 5px 0 !important;
            }
            .gallery-image {
                width: 80px !important;
                height: 80px !important;
            }
            .time-slot {
                padding: 6px 12px !important;
                margin: 2px !important;
                font-size: 13px !important;
            }
            .book-now-btn {
                width: 90% !important;
                max-width: 280px !important;
                padding: 18px 20px !important;
                font-size: 18px !important;
                margin: 25px auto !important;
                display: block !important;
            }
            .cta-section {
                padding: 20px 15px !important;
                margin: 20px 0 !important;
            }

            .hero-image {
                max-height: 250px !important;
            }
        }

        /* Extra small mobile devices */
        @media only screen and (max-width: 480px) {
            .title {
                font-size: ${Math.max(18, headingFontSize - 6)}px !important;
            }
            .price {
                font-size: 18px !important;
            }
            .content {
                padding: 15px !important;
            }
            .gallery-image {
                width: 70px !important;
                height: 70px !important;
            }
            .gallery-container {
                gap: 6px !important;
            }
        }


    </style>
</head>
<body>
    <div class="email-wrapper">
        ${images.length > 0 ? `<img src="${images[0]}" alt="${title}" class="hero-image">` : ''}
        <div class="header">
            <h1 class="title">${title}</h1>
        </div>
        
        <div style="padding: 30px;">
            ${formatDescriptionForEmail(description, paragraphFont, paragraphFontSize, paragraphTextColor)}
            
            ${imageGallery}
            
            <div class="details-box">
                <div class="detail-item">
                    <span class="detail-label">📅 Date:</span> ${date}
                </div>
                <div class="detail-item">
                    <span class="detail-label">📍 Location:</span> ${location}
                </div>
                <div class="detail-item">
                    <span class="detail-label">💰 Price:</span> ${price}
                </div>
            </div>
            
            ${schedulingHtml}
            
            <div class="cta-section">
                <h3 style="margin: 0 0 15px 0; color: ${paragraphTextColor};">Ready to Book?</h3>
                <p style="margin: 0 0 20px 0; color: ${paragraphTextColor}; font-size: 14px;">Secure your spot for this amazing photography session!</p>
                <a href="${originalUrl}" class="book-now-btn">Book This Session</a>
            </div>
        </div>
        

    </div>
</body>
</html>`;
}

function createSessionContent(data: any, originalUrl: string, primaryColor: string = "#7851a9", secondaryColor: string = "#6a4c96", headingFont: string = "Playfair Display", paragraphFont: string = "Georgia", headingFontSize: number = 28, paragraphFontSize: number = 16, headingTextColor: string = "#ffffff", paragraphTextColor: string = "#333333"): string {
  const { title, description, price, date, location, timeSlots, images } = data;
  
  // Create image gallery HTML (excluding the first image which will be the hero)
  const imageGallery = images.length > 1 ? `
    <div style="margin: 30px 0; text-align: center;">
      <div style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 12px; padding: 10px 0;">
        ${images.slice(1, 5).map((img: string, index: number) => `
          <div style="position: relative; display: inline-block;">
            <a href="${img}" target="_blank" style="text-decoration: none; display: block;">
              <img src="${img}" alt="${title} - Image ${index + 2}" 
                   style="width: 110px; height: 110px; object-fit: cover; border-radius: 8px; 
                          box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; 
                          transition: all 0.3s ease; border: 2px solid transparent;
                          max-width: 80px; max-height: 80px;"
                   onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.25)'; this.style.borderColor='${primaryColor}'"
                   onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.15)'; this.style.borderColor='transparent'">
            </a>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';
  
  // Create time slots HTML with booking links
  const timeSlotsHtml = timeSlots.length > 0 ? `
    <div style="margin: 25px 0;">
      <h3 style="font-size: 18px; color: #333; margin: 0 0 15px 0; font-weight: 600;">Available Times:</h3>
      <div style="text-align: center;">
        ${timeSlots.map((slot: {time: string, bookingUrl?: string}) => `
          <a href="${slot.bookingUrl || originalUrl}" target="_blank" style="text-decoration: none;">
            <span style="display: inline-block; background-color: #f8f9fa; color: #333; padding: 8px 16px; margin: 4px; border-radius: 20px; border: 1px solid #dee2e6; font-size: 14px; font-weight: 500;">${slot.time}</span>
          </a>
        `).join('')}
      </div>
    </div>
  ` : '';
  
  // Get font families with fallbacks
  const headingFontFamily = GOOGLE_FONTS[headingFont as keyof typeof GOOGLE_FONTS] 
    ? `'${headingFont}', ${GOOGLE_FONTS[headingFont as keyof typeof GOOGLE_FONTS]}`
    : "'Playfair Display', serif";

  // Return just the content portion without the full HTML document structure
  return `<style>
    @media only screen and (max-width: 600px) {
      .session-wrapper {
        margin: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
      .session-header {
        padding: 25px 20px !important;
      }
      .session-title {
        font-size: 24px !important;
        line-height: 1.3 !important;
      }
      .session-price {
        font-size: 20px !important;
      }
      .session-content {
        padding: 20px !important;
      }
      .session-details {
        padding: 15px !important;
        margin: 20px 0 !important;
      }
      .session-detail-item {
        font-size: 14px !important;
        margin: 8px 0 !important;
      }
      .session-detail-label {
        display: block !important;
        margin-bottom: 2px !important;
        min-width: auto !important;
      }
      .session-gallery img {
        width: 80px !important;
        height: 80px !important;
        max-width: 70px !important;
        max-height: 70px !important;
      }
      .session-gallery > div {
        gap: 8px !important;
        padding: 5px 0 !important;
      }
      .session-time-slot {
        padding: 6px 12px !important;
        margin: 2px !important;
        font-size: 13px !important;
      }
      .session-book-btn {
        width: 90% !important;
        max-width: 280px !important;
        padding: 18px 20px !important;
        font-size: 18px !important;
        margin: 25px auto !important;
        display: block !important;
      }
      .session-cta {
        padding: 20px 15px !important;
        margin: 20px 0 !important;
      }
      .session-hero {
        max-height: 250px !important;
      }
    }
    @media only screen and (max-width: 480px) {
      .session-title {
        font-size: 22px !important;
      }
      .session-price {
        font-size: 18px !important;
      }
      .session-content {
        padding: 15px !important;
      }
      .session-gallery img {
        width: 70px !important;
        height: 70px !important;
        max-width: 60px !important;
        max-height: 60px !important;
      }
      .session-gallery > div {
        gap: 6px !important;
      }
    }
  </style>
  <div class="session-wrapper" style="max-width: 600px; margin: 0 auto; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; margin-bottom: 40px;">
    ${images.length > 0 ? `<img src="${images[0]}" alt="${title}" class="session-hero" style="width: 100%; height: auto; display: block; max-height: 400px; object-fit: cover;">` : ''}
    <div class="session-header" style="background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); color: white; padding: 40px 30px; text-align: center;">
        <h1 class="session-title" style="font-size: ${headingFontSize}px; font-weight: 700; margin: 0; font-family: ${headingFontFamily}; color: ${headingTextColor}; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${title}</h1>
    </div>
    
    <div class="session-content" style="padding: 30px;">
        ${formatDescriptionForEmail(description, paragraphFont, paragraphFontSize, paragraphTextColor)}
        
        <div class="session-gallery">${imageGallery}</div>
        
        <div class="session-details" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid ${primaryColor};">
            <div class="session-detail-item" style="margin: 10px 0; font-size: 15px; color: #555;">
                <span class="session-detail-label" style="font-weight: 600; color: #333; display: inline-block; min-width: 70px;">📅 Date:</span> ${date}
            </div>
            <div class="session-detail-item" style="margin: 10px 0; font-size: 15px; color: #555;">
                <span class="session-detail-label" style="font-weight: 600; color: #333; display: inline-block; min-width: 70px;">📍 Location:</span> ${location}
            </div>
            <div class="session-detail-item" style="margin: 10px 0; font-size: 15px; color: #555;">
                <span class="session-detail-label" style="font-weight: 600; color: #333; display: inline-block; min-width: 70px;">💰 Price:</span> ${price}
            </div>
        </div>
        
        <div style="margin: 25px 0;">
          <h3 style="font-size: 18px; color: #333; margin: 0 0 15px 0; font-weight: 600;">Available Times:</h3>
          <div style="text-align: center;">
            ${timeSlots.map((slot: {time: string, bookingUrl?: string}) => `
              <a href="${slot.bookingUrl || originalUrl}" target="_blank" style="text-decoration: none;">
                <span class="session-time-slot" style="display: inline-block; background-color: #f8f9fa; color: #333; padding: 8px 16px; margin: 4px; border-radius: 20px; border: 1px solid #dee2e6; font-size: 14px; font-weight: 500;">${slot.time}</span>
              </a>
            `).join('')}
          </div>
        </div>
        
        <div class="session-cta" style="text-align: center; margin: 30px 0; padding: 30px 20px; background-color: #fafafa; border-radius: 8px;">
            <h3 style="margin: 0 0 15px 0; color: ${paragraphTextColor};">Ready to Book?</h3>
            <p style="margin: 0 0 20px 0; color: ${paragraphTextColor}; font-size: 14px;">Secure your spot for this amazing photography session!</p>
            <a href="${originalUrl}" class="session-book-btn" style="display: inline-block !important; background-color: ${primaryColor} !important; color: white !important; padding: 15px 35px !important; text-decoration: none !important; border-radius: 25px !important; font-weight: bold !important; font-size: 16px !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important; box-sizing: border-box !important;">Book This Session</a>
        </div>
    </div>
</div>`;
}