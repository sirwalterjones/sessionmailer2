import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

function extractFirstImageFromHtml(html: string): string | null {

  // Meta tag patterns (highest priority)
  const exactImageMatch = html.match(/<meta\s+name=["']image["']\s+content=["']([^"']+)["']/i);
  if (exactImageMatch && exactImageMatch[1]) {
    return exactImageMatch[1];
  }

  const reverseImageMatch = html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']image["']/i);
  if (reverseImageMatch && reverseImageMatch[1]) {
    return reverseImageMatch[1];
  }

  const flexibleImageMatch = html.match(/<meta[^>]*name=["'][^"']*image[^"']*["'][^>]*content=["']([^"']+)["']/i);
  if (flexibleImageMatch && flexibleImageMatch[1]) {
    return flexibleImageMatch[1];
  }

  const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    return ogImageMatch[1];
  }

  const twitterImageMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i);
  if (twitterImageMatch && twitterImageMatch[1]) {
    return twitterImageMatch[1];
  }

  // Look for any meta tags with 'image' in the name
  const anyImageMetaMatch = html.match(/<meta[^>]*name=["'][^"']*image[^"']*["'][^>]*content=["']([^"']+)["']/i);
  if (anyImageMetaMatch && anyImageMetaMatch[1]) {
    return anyImageMetaMatch[1];
  }

  // Parse img tags and score them
  const imgMatches = html.match(/<img[^>]+>/gi);
  if (!imgMatches) {
    return null;
  }

    let bestImage = null;
    let bestScore = 0;

  imgMatches.forEach((imgTag) => {
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    if (!srcMatch) return;

        const src = srcMatch[1];
    const alt = imgTag.match(/alt=["']([^"']*)["']/i)?.[1] || '';
    const classes = imgTag.match(/class=["']([^"']*)["']/i)?.[1] || '';

        // Skip obvious non-hero images
    if (src.includes('logo') || src.includes('icon') || src.includes('avatar') || 
        src.includes('thumb') || src.includes('small') || alt.toLowerCase().includes('logo')) {
      return;
        }

    let score = 0;

    // Hero image indicators (high score)
    if (classes.includes('hero') || classes.includes('main') || classes.includes('featured') ||
        classes.includes('banner') || classes.includes('cover') || alt.toLowerCase().includes('hero')) {
          score += 100;
        }

    // CDN or high-quality image indicators
    if (src.includes('unsplash') || src.includes('pexels') || src.includes('shutterstock') ||
        src.includes('cdn') || src.includes('cloudinary')) {
          score += 50;
        }

    // Size hints in URL
    if (src.includes('1200') || src.includes('1920') || src.includes('large') || 
        src.includes('full') || src.includes('original')) {
      score += 30;
    }

    // Position in DOM (earlier = higher score)
    score += Math.max(0, 50 - imgMatches.indexOf(imgTag));

    // Class-based scoring
    if (classes.includes('large') || classes.includes('big') || classes.includes('primary')) {
      score += 20;
    }

        if (score > bestScore) {
          bestScore = score;
          bestImage = src;
        }
  });

      return bestImage;
}

function extractTextContent(html: string): {
  title: string;
  description: string;
  date: string;
  location: string;
} {
  // Extract title from h1, h2, or title tag
  let title = "";
  const titleMatch =
    html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
    html.match(/<h2[^>]*>([^<]+)<\/h2>/i) ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Extract description from paragraphs or meta description
  let description = "";
  const descMatch =
    html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    ) || html.match(/<p[^>]*>([^<]{50,200})<\/p>/i);
  if (descMatch) {
    description = descMatch[1].trim();
  }

  // Extract date information (support multiple dates)
  const dates: string[] = [];
  const datePatterns = [
    /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    /\b\d{4}-\d{2}-\d{2}\b/g
  ];
  
  for (const pattern of datePatterns) {
    const matches = html.match(pattern);
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
  
  const date = dates.length > 3 ? 'Multiple Dates Available' : (dates.length > 0 ? dates.join(', ') : '');

  // Extract location information
  let location = "";
  const locationMatch =
    html.match(/(?:location|address|venue)[^>]*>([^<]+)</i) ||
    html.match(/\b[A-Z][a-z]+,\s*[A-Z]{2}\b/) ||
    html.match(
      /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd)\b/i,
    );
  if (locationMatch) {
    location = locationMatch[1] || locationMatch[0];
    location = location.trim();
  }

  return { title, description, date, location };
}

async function capturePageAsEmailHtml(page: any, url: string): Promise<string> {
  // Get computed styles for all elements
  const emailHtml = await page.evaluate((originalUrl: string) => {
    // Function to convert computed styles to inline styles
    function getInlineStyles(element: Element): string {
      const computedStyle = window.getComputedStyle(element);
      const importantStyles = [
        'background-color', 'background-image', 'background-size', 'background-position',
        'color', 'font-family', 'font-size', 'font-weight', 'line-height',
        'text-align', 'text-decoration', 'margin', 'padding', 'border',
        'border-radius', 'width', 'height', 'max-width', 'min-height',
        'display', 'float', 'clear', 'position', 'top', 'left', 'right', 'bottom'
      ];
      
      let inlineStyle = '';
      importantStyles.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        if (value && value !== 'initial' && value !== 'normal' && value !== 'auto') {
          // Convert relative units and viewport units to pixels for email compatibility
          let emailValue = value;
          if (value.includes('rem')) {
            const remValue = parseFloat(value) * 16; // Assume 16px base
            emailValue = value.replace(/[\d.]+rem/g, remValue + 'px');
          }
          if (value.includes('vw') || value.includes('vh')) {
            // Convert viewport units to reasonable pixel values
            emailValue = value.replace(/[\d.]+vw/g, '600px').replace(/[\d.]+vh/g, '400px');
          }
          inlineStyle += `${prop}: ${emailValue} !important; `;
        }
      });
      
      return inlineStyle;
    }

    // Remove problematic elements
    const elementsToRemove = [
      'script', 'noscript', 'style[data-styled]', 'link[rel="stylesheet"]',
      'header', 'nav', 'footer', '.header', '.navigation', '.nav', '.footer',
      '[class*="header"]', '[class*="nav"]', '[class*="footer"]', '[class*="menu"]'
    ];
    
    elementsToRemove.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Find the main content area (usually the largest content block)
    const contentSelectors = [
      'main', '.main', '.content', '.container', '.session-details', 
      '.booking-page', '.session-info', '[class*="session"]', '[class*="booking"]'
    ];
    
    let mainContent = null;
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
                  if (element && (element as HTMLElement).offsetHeight > 200) {
        mainContent = element;
        break;
      }
    }
    
    // If no main content found, use body but clean it up
    if (!mainContent) {
      mainContent = document.body;
    }

    // Clone the main content to avoid modifying the original
    const contentClone = mainContent.cloneNode(true) as Element;
    
    // Convert all elements to have inline styles
    function processElement(element: Element) {
      if (element.nodeType === Node.ELEMENT_NODE) {
        const inlineStyles = getInlineStyles(element);
        if (inlineStyles) {
          element.setAttribute('style', inlineStyles);
        }
        
        // Convert images to absolute URLs
        if (element.tagName === 'IMG') {
          const src = element.getAttribute('src');
          if (src && !src.startsWith('http')) {
            const absoluteUrl = new URL(src, window.location.href).href;
            element.setAttribute('src', absoluteUrl);
          }
        }
        
        // Convert links to absolute URLs
        if (element.tagName === 'A') {
          const href = element.getAttribute('href');
          if (href && !href.startsWith('http') && !href.startsWith('mailto')) {
            const absoluteUrl = new URL(href, window.location.href).href;
            element.setAttribute('href', absoluteUrl);
          }
        }
        
        // Process child elements
        Array.from(element.children).forEach(child => processElement(child));
      }
    }
    
    processElement(contentClone);
    
    // Create email-compatible HTML structure
    const emailTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title}</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background: #fff; }
        img { max-width: 100% !important; height: auto !important; display: block; }
        a { color: #0066cc; text-decoration: none; }
        table { border-collapse: collapse; width: 100%; }
        .book-now-btn { 
          display: inline-block !important; 
          background-color: #7851a9 !important; 
          color: white !important; 
          padding: 15px 30px !important; 
          text-decoration: none !important; 
          border-radius: 25px !important; 
          font-weight: bold !important; 
          font-size: 16px !important; 
          margin: 20px 0 !important;
          text-align: center !important;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        ${contentClone.outerHTML}
        <div style="text-align: center; margin: 30px 0; padding: 20px;">
            <a href="${originalUrl}" class="book-now-btn">Book This Session</a>
        </div>
    </div>
</body>
</html>`;
    
    return emailTemplate;
  }, url);
  
  return emailHtml;
}

function cleanHtmlForEmail(html: string, baseUrl: string): string {
  // This is now a fallback function - the main processing should use capturePageAsEmailHtml
  let cleanedHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/src="\//g, `src="${new URL(baseUrl).origin}/`)
    .replace(/href="\//g, `href="${new URL(baseUrl).origin}/`);

  // Convert to email-compatible structure
  cleanedHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photography Session</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f5f5f5; }
        .email-container { max-width: 600px; margin: 0 auto; background: #fff; }
        img { max-width: 100% !important; height: auto !important; display: block; }
        .book-now-btn { 
          display: inline-block !important; 
          background-color: #7851a9 !important; 
          color: white !important; 
          padding: 15px 30px !important; 
          text-decoration: none !important; 
          border-radius: 25px !important; 
          font-weight: bold !important; 
          margin: 20px 0 !important;
        }
    </style>
</head>
<body>
    <div class="email-container">
        ${cleanedHtml.replace(/<\/body>/i, '')}
    <div style="text-align: center; margin: 30px 0; padding: 20px;">
            <a href="${baseUrl}" class="book-now-btn">Book This Session</a>
        </div>
    </div>
</body>
</html>`;

  return cleanedHtml;
}

function combineMultipleSessionsHtml(
  sessions: Array<{
    url: string;
    html: string;
    title: string;
    firstImage: string | null;
  }>,
): string {
  // For multiple sessions, clean each HTML individually and combine them
  const cleanedSessions = sessions.map((session) => {
    if (session.html) {
      return cleanHtmlForEmail(session.html, session.url);
    }
    return `<div style="margin-bottom: 40px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2>${session.title || "Session"}</h2>
      ${session.firstImage ? `<img src="${session.firstImage}" style="max-width: 100%; height: auto; display: block; margin: 0 auto 10px auto; border-radius: 8px;">` : ""}
      <div style="text-align: center; margin: 20px 0;">
        <a href="${session.url}" style="display: inline-block; background-color: #7851a9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">Book Now</a>
      </div>
    </div>`;
  });

  // Ensure images are included in the combined content by adding them at the top of each session
  const contentWithImages = sessions
    .map((session, index) => {
      const sessionContent = cleanedSessions[index];
      const bodyMatch = sessionContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let content = bodyMatch ? bodyMatch[1] : sessionContent;

      // Clean the content with more targeted character removal
      content = content
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
        .replace(
          /<div[^>]*(?:class|id)=["'][^"']*(?:header|nav|logo|brand|top|site)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
          "",
        )
        .replace(
          /^\s*<div[^>]*>[\s\S]*?(?:logo|brand|header)[\s\S]*?<\/div>\s*/gi,
          "",
        )
        // More targeted character cleaning
        .replace(/[\u2018\u2019]/g, "'") // Smart quotes to regular quotes
        .replace(/[\u201C\u201D]/g, '"') // Smart double quotes to regular quotes
        .replace(/[\u2013\u2014]/g, "-") // En dash and em dash to regular dash
        .replace(/[\u2026]/g, "...") // Ellipsis to three dots
        .replace(/[\u00A0]/g, " ") // Non-breaking space to regular space
        .replace(/[\u200B-\u200F\u2028-\u202F\u205F-\u206F\uFEFF]/g, "") // Zero-width and formatting characters
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Control characters
        .trim();

      // Ensure the hero image is prominently displayed at the top
      let imageHtml = "";
      if (session.firstImage) {
        imageHtml = `<div style="text-align: center; margin-bottom: 30px;">
          <img src="${session.firstImage}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" alt="${session.title || "Session Image"}">
        </div>`;
      }

      // Add session title if available
      const titleHtml = session.title
        ? `<h2 style="text-align: center; color: #333; margin-bottom: 20px; font-size: 24px;">${session.title}</h2>`
        : "";

      const separator =
        index > 0
          ? '<div style="margin: 50px 0; border-top: 3px solid #eee; padding-top: 50px;"></div>'
          : "";

      return separator + titleHtml + imageHtml + content;
    })
    .join("");

  // Create a clean combined HTML with minimal head content and no external CSS
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photography Sessions</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9f9f9; }
      .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        ${contentWithImages}
    </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  let browser = null;
  let requestBody: any;

  try {
    requestBody = await request.json();
    const { url: requestUrl, urls: requestUrls } = requestBody;

    // Handle both single URL and multiple URLs
    const urlsToProcess =
      requestUrls && Array.isArray(requestUrls) ? requestUrls : [requestUrl];

    // Validate URLs
    for (const url of urlsToProcess) {
      if (!url || !url.includes("usesession.com")) {
        return NextResponse.json(
          { error: `Invalid URL provided: ${url}` },
          { status: 400 },
        );
      }
    }

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    });

    const sessions = [];

    for (const url of urlsToProcess) {
      try {
        const page = await context.newPage();

        // Navigate to URL
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

        // Wait for content to load
        await page.waitForTimeout(3000);

        // Get enhanced email HTML
        const enhancedEmailHtml = await capturePageAsEmailHtml(page, url);

        // Get page title
        const pageTitle = await page.title();

        // Get full HTML content
        const fullHtml = await page.content();

        // Extract first image
        const firstImage = extractFirstImageFromHtml(fullHtml);

        let absoluteImageUrl = firstImage;
        if (firstImage) {
          if (firstImage.startsWith("/")) {
            const domain = new URL(url).origin;
            absoluteImageUrl = domain + firstImage;
          } else if (firstImage.startsWith("//")) {
            // Protocol-relative URL
            absoluteImageUrl = "https:" + firstImage;
          } else if (!firstImage.startsWith("http")) {
            // Relative path without leading slash
            const domain = new URL(url).origin;
            absoluteImageUrl = domain + "/" + firstImage;
          }
        }

        // Create raw HTML with Book Now button for copying
        const rawHtmlWithButton = fullHtml.replace(
          /<\/body>/i,
          `
    <div style="text-align: center; margin: 30px 0; padding: 20px;">
      <a href="${url}" style="display: inline-block; background-color: #7851a9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">Book Now</a>
    </div>
  </body>`,
        );

        sessions.push({
          url,
          title: pageTitle,
          html: fullHtml,
          enhancedEmailHtml, // Add the enhanced email HTML
          rawHtmlWithButton,
          firstImage: absoluteImageUrl,
        });

        await page.close();
      } catch (error) {
        sessions.push({
          url,
          title: `Error loading ${url}`,
          html: "",
          rawHtmlWithButton: "",
          firstImage: null,
          error: (error as Error).message,
        });
      }
    }

    // Generate combined email HTML for multiple sessions
    let emailHtml;
    let rawHtml;

    if (sessions.length > 1) {
      emailHtml = combineMultipleSessionsHtml(sessions);
      // Generate combined raw HTML for multiple sessions
      const combinedRawHtml = sessions
        .map((session) => session.rawHtmlWithButton || session.html)
        .join(
          '\n\n<div style="margin: 40px 0; border-top: 2px solid #eee; padding-top: 40px;"></div>\n\n',
        );
      rawHtml = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Photography Sessions</title>\n</head>\n<body>\n${combinedRawHtml}\n</body>\n</html>`;
    } else if (sessions.length === 1) {
      // Use enhanced email HTML if available, otherwise fall back to cleaned HTML
      emailHtml = sessions[0].enhancedEmailHtml || cleanHtmlForEmail(sessions[0].html, sessions[0].url);
      rawHtml = sessions[0]?.rawHtmlWithButton || sessions[0]?.html;
    } else {
      emailHtml =
        "<html><body><p>No sessions processed successfully.</p></body></html>";
      rawHtml =
        "<html><body><p>No sessions processed successfully.</p></body></html>";
    }

    // Return the processed data
    return NextResponse.json({
      success: true,
      sessions,
      emailHtml,
      isMultiple: sessions.length > 1,
      timestamp: new Date().toISOString(),
      // Backward compatibility for single URL
      url: sessions[0]?.url,
      title: sessions[0]?.title,
      html: sessions[0]?.html,
      // Add raw HTML with Book Now button for copying - now supports multiple URLs
      rawHtml,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to extract session data: ${(error as Error).message}`,
      },
      { status: 500 },
    );
  } finally {
    if (browser) {
        await browser.close();
    }
  }
}
