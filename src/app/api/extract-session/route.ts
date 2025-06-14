import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

function extractFirstImage(html: string): string | null {
  console.log("Starting image extraction...");

  // First, try to find meta tag with name="image" (most specific)
  const exactImageMatch = html.match(
    /<meta\s+name=["']image["']\s+content=["']([^"']+)["'][^>]*>/i,
  );
  if (exactImageMatch && exactImageMatch[1]) {
    console.log("Found exact meta name=image tag:", exactImageMatch[1]);
    return exactImageMatch[1];
  }

  // Try reverse order (content first, then name)
  const reverseImageMatch = html.match(
    /<meta\s+content=["']([^"']+)["']\s+name=["']image["'][^>]*>/i,
  );
  if (reverseImageMatch && reverseImageMatch[1]) {
    console.log("Found reverse meta name=image tag:", reverseImageMatch[1]);
    return reverseImageMatch[1];
  }

  // Try with any attributes in between
  const flexibleImageMatch = html.match(
    /<meta[^>]*name=["']image["'][^>]*content=["']([^"']+)["'][^>]*>/i,
  );
  if (flexibleImageMatch && flexibleImageMatch[1]) {
    console.log("Found flexible meta name=image tag:", flexibleImageMatch[1]);
    return flexibleImageMatch[1];
  }

  // Try with content first, flexible attributes
  const flexibleReverseMatch = html.match(
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']image["'][^>]*>/i,
  );
  if (flexibleReverseMatch && flexibleReverseMatch[1]) {
    console.log(
      "Found flexible reverse meta name=image tag:",
      flexibleReverseMatch[1],
    );
    return flexibleReverseMatch[1];
  }

  // Try og:image as high priority backup
  const ogImageMatch = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i,
  );
  if (ogImageMatch && ogImageMatch[1]) {
    console.log("Found og:image tag:", ogImageMatch[1]);
    return ogImageMatch[1];
  }

  // Try twitter:image
  const twitterImageMatch = html.match(
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i,
  );
  if (twitterImageMatch && twitterImageMatch[1]) {
    console.log("Found twitter:image tag:", twitterImageMatch[1]);
    return twitterImageMatch[1];
  }

  // Look for any meta tag containing "image" in the name attribute
  const anyImageMetaMatch = html.match(
    /<meta[^>]*name=["'][^"']*image[^"']*["'][^>]*content=["']([^"']+)["'][^>]*>/gi,
  );
  if (anyImageMetaMatch) {
    console.log("Found meta tags with 'image' in name:", anyImageMetaMatch);
    for (const match of anyImageMetaMatch) {
      const contentMatch = match.match(/content=["']([^"']+)["']/i);
      if (contentMatch && contentMatch[1]) {
        console.log(
          "Extracted image from meta tag with 'image':",
          contentMatch[1],
        );
        return contentMatch[1];
      }
    }
  }

  // Look for the largest/most prominent image in the page
  const imgMatches = html.match(/<img[^>]+>/gi);
  if (imgMatches) {
    let bestImage = null;
    let bestScore = 0;

    console.log(`Found ${imgMatches.length} img tags, analyzing...`);

    for (const imgTag of imgMatches) {
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        const src = srcMatch[1];
        const srcLower = src.toLowerCase();
        let score = 0;

        // Skip obvious non-hero images
        if (
          srcLower.includes("logo") ||
          srcLower.includes("brand") ||
          srcLower.includes("icon") ||
          srcLower.includes("avatar") ||
          srcLower.includes("profile") ||
          srcLower.includes("thumb") ||
          srcLower.includes("small") ||
          srcLower.includes("mini") ||
          srcLower.includes("button")
        ) {
          console.log("Skipping non-hero image:", src);
          continue;
        }

        // Boost score for images that look like hero images
        if (
          srcLower.includes("hero") ||
          srcLower.includes("banner") ||
          srcLower.includes("cover") ||
          srcLower.includes("-lg") || // Large image indicator
          srcLower.includes("_lg") ||
          srcLower.includes("large")
        ) {
          score += 100;
          console.log("Hero image boost for:", src);
        }

        // Boost score for CDN images (often high quality)
        if (
          srcLower.includes("cdn") ||
          srcLower.includes("digitalocean") ||
          srcLower.includes("amazonaws") ||
          srcLower.includes("cloudfront")
        ) {
          score += 50;
          console.log("CDN image boost for:", src);
        }

        // Boost score for larger dimensions mentioned in attributes
        const widthMatch = imgTag.match(/width=["']?(\d+)["']?/i);
        const heightMatch = imgTag.match(/height=["']?(\d+)["']?/i);
        if (widthMatch) {
          const width = parseInt(widthMatch[1]);
          score += Math.min(width / 10, 50); // Cap the width bonus
        }
        if (heightMatch) {
          const height = parseInt(heightMatch[1]);
          score += Math.min(height / 10, 50); // Cap the height bonus
        }

        // Boost score for images with certain classes that suggest importance
        if (imgTag.includes("class=")) {
          const classMatch = imgTag.match(/class=["']([^"']+)["']/i);
          if (classMatch && classMatch[1]) {
            const classes = classMatch[1].toLowerCase();
            if (
              classes.includes("hero") ||
              classes.includes("banner") ||
              classes.includes("cover") ||
              classes.includes("main") ||
              classes.includes("featured")
            ) {
              score += 75;
              console.log("Class boost for:", src, "classes:", classes);
            }
          }
        }

        // Default score for any valid image
        score += 10;

        console.log(`Image: ${src} - Score: ${score}`);

        if (score > bestScore) {
          bestScore = score;
          bestImage = src;
        }
      }
    }

    if (bestImage) {
      console.log("Selected best image with score", bestScore, ":", bestImage);
      return bestImage;
    }
  }

  console.log("No suitable image found in HTML");
  return null;
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

  // Extract date information
  let date = "";
  const dateMatch =
    html.match(
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
    ) ||
    html.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/) ||
    html.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (dateMatch) {
    date = dateMatch[0].trim();
  }

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

function cleanHtmlForEmail(html: string, baseUrl: string): string {
  // Clean the HTML to remove problematic characters that cause brackets in Mailchimp
  let cleanedHtml = html
    // Remove script tags and their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    // Remove style tags and their content - but preserve inline styles
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Remove header, nav, and footer elements that contain logos/branding
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    // Remove elements with logo-related classes or IDs
    .replace(
      /<[^>]*(?:class|id)=["'][^"']*(?:logo|brand|header)[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi,
      "",
    )
    // Remove top navigation divs and site branding
    .replace(
      /<div[^>]*(?:class|id)=["'][^"']*(?:header|nav|top|site|brand)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      "",
    )
    // Fix relative URLs to absolute URLs
    .replace(/src="\//g, `src="${new URL(baseUrl).origin}/`)
    .replace(/href="\//g, `href="${new URL(baseUrl).origin}/`);

  // More targeted character cleaning - only remove specific problematic characters
  cleanedHtml = cleanedHtml
    // Remove specific Unicode characters that cause brackets in Mailchimp
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes to regular quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes to regular quotes
    .replace(/[\u2013\u2014]/g, "-") // En dash and em dash to regular dash
    .replace(/[\u2026]/g, "...") // Ellipsis to three dots
    .replace(/[\u00A0]/g, " ") // Non-breaking space to regular space
    .replace(/[\u200B-\u200F\u2028-\u202F\u205F-\u206F\uFEFF]/g, "") // Zero-width and formatting characters
    // Remove control characters but keep basic formatting
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Convert common HTML entities to safe characters
    .replace(/&[a-zA-Z0-9#]+;/g, (match) => {
      const entityMap = {
        "&quot;": '"',
        "&apos;": "'",
        "&lt;": "<",
        "&gt;": ">",
        "&amp;": "&",
        "&nbsp;": " ",
        "&mdash;": "-",
        "&ndash;": "-",
        "&ldquo;": '"',
        "&rdquo;": '"',
        "&lsquo;": "'",
        "&rsquo;": "'",
        "&hellip;": "...",
        "&bull;": "*",
      };
      return entityMap[match] || match; // Keep unknown entities instead of removing them
    })
    // Clean up extra whitespace but preserve structure
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .trim();

  // Now find and style time slot buttons with more aggressive pattern matching
  cleanedHtml = cleanedHtml
    // Match buttons or links that contain time patterns (like "7:00 PM")
    .replace(
      /<(button|a)[^>]*>\s*\d{1,2}:\d{2}\s*(AM|PM)\s*<\/(button|a)>/gi,
      (match) => {
        const timeText =
          match.match(/>\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*</i)?.[1] || "";
        const tag = match.startsWith("<a") ? "a" : "button";
        const href = match.match(/href=["']([^"']*)["']/i)?.[1] || "";
        const hrefAttr = href ? ` href="${href}"` : "";
        return `<${tag}${hrefAttr} style="display: inline-block; background-color: #7851a9; color: white; padding: 8px 16px; margin: 4px; border-radius: 20px; text-decoration: none; font-size: 14px; border: none; cursor: pointer;">${timeText}</${tag}>`;
      },
    )
    // Also match divs or spans that contain time patterns
    .replace(
      /<(div|span)[^>]*>\s*\d{1,2}:\d{2}\s*(AM|PM)\s*<\/(div|span)>/gi,
      (match) => {
        const timeText =
          match.match(/>\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*</i)?.[1] || "";
        return `<span style="display: inline-block; background-color: #7851a9; color: white; padding: 8px 16px; margin: 4px; border-radius: 20px; text-decoration: none; font-size: 14px; border: none; cursor: pointer;">${timeText}</span>`;
      },
    );

  // Add Book Now button before closing body tag
  cleanedHtml = cleanedHtml.replace(
    /<\/body>/i,
    `
    <div style="text-align: center; margin: 30px 0; padding: 20px;">
      <a href="${baseUrl}" style="display: inline-block; background-color: #7851a9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">Book Now</a>
    </div>
  </body>`,
  );

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

    console.log("Processing URLs:", urlsToProcess);

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

    // Process each URL
    for (const url of urlsToProcess) {
      try {
        const page = await context.newPage();

        console.log("Navigating to URL:", url);

        // Navigate to the page and wait for it to fully load
        await page.goto(url, {
          waitUntil: "networkidle",
          timeout: 60000,
        });

        // Wait for dynamic content and ensure JavaScript has fully rendered
        console.log("Waiting for dynamic content to load...");
        await page.waitForTimeout(12000);

        // Wait for images to load
        await page.waitForLoadState("networkidle");

        // Additional wait to ensure all dynamic content is rendered
        await page.waitForTimeout(3000);

        console.log("Capturing full page HTML...");

        // Get the complete HTML content of the page
        const fullHtml = await page.content();

        // Also get the page title for reference
        const pageTitle = await page.title();

        // Extract first image
        const firstImage = extractFirstImage(fullHtml);
        console.log("Raw extracted image:", firstImage);

        // Convert relative image URL to absolute if needed
        let absoluteImageUrl = firstImage;
        if (firstImage) {
          if (firstImage.startsWith("/")) {
            const domain = new URL(url).origin;
            absoluteImageUrl = domain + firstImage;
            console.log(
              "Converted relative URL to absolute:",
              absoluteImageUrl,
            );
          } else if (firstImage.startsWith("//")) {
            // Protocol-relative URL
            absoluteImageUrl = "https:" + firstImage;
            console.log("Added protocol to URL:", absoluteImageUrl);
          } else if (!firstImage.startsWith("http")) {
            // Relative path without leading slash
            const domain = new URL(url).origin;
            absoluteImageUrl = domain + "/" + firstImage;
            console.log(
              "Converted relative path to absolute:",
              absoluteImageUrl,
            );
          }
        }

        console.log(
          `HTML captured successfully for ${url}, length:`,
          fullHtml.length,
        );
        console.log(`First image found: ${absoluteImageUrl}`);

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
          rawHtmlWithButton,
          firstImage: absoluteImageUrl,
        });

        await page.close();
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error);
        sessions.push({
          url,
          title: `Error loading ${url}`,
          html: "",
          rawHtmlWithButton: "",
          firstImage: null,
          error: error.message,
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
      emailHtml = cleanHtmlForEmail(sessions[0].html, sessions[0].url);
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
    console.error("Error capturing pages:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to capture page content",
        details: error.message,
      },
      { status: 500 },
    );
  } finally {
    // Always close the browser
    if (browser) {
      try {
        await browser.close();
        console.log("Browser closed successfully");
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }
  }
}
