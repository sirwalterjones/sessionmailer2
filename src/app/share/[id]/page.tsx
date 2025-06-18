import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SharePage from '../../../components/SharePage';

interface SharePageProps {
  params: { id: string };
}

// Generate metadata for Open Graph sharing
export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  try {
    // Use the same URL logic as the share API
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://sessionmailer.com' 
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Fetch the shared content data
    const response = await fetch(`${baseUrl}/api/share/${params.id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return {
        title: 'SessionMailer - Email Template',
        description: 'Professional email templates for session photographers'
      };
    }
    
    const data = await response.json();
    
    // Extract first image from sessions for Open Graph image
    const ogImage = data.sessions?.[0]?.firstImage || data.sessions?.[0]?.images?.[0]?.url || 
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
    
    const title = data.sessions?.length > 1 
      ? `${data.sessions.length} Session Email Templates`
      : data.sessions?.[0]?.title || 'Session Email Template';
    
    const description = data.sessions?.length > 1
      ? `Beautiful email templates for ${data.sessions.length} photography sessions. Professional designs ready to send to clients.`
      : `Professional email template for ${data.sessions?.[0]?.title || 'photography session'}. Beautiful design ready to send to clients.`;

    return {
      title: `${title} | SessionMailer`,
      description,
      openGraph: {
        title: `${title} | SessionMailer`,
        description,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          }
        ],
        type: 'website',
        siteName: 'SessionMailer',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | SessionMailer`,
        description,
        images: [ogImage],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'SessionMailer - Email Template',
      description: 'Professional email templates for session photographers'
    };
  }
}

export default async function Page({ params }: SharePageProps) {
  try {
    // Use the same URL logic as the share API
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://sessionmailer.com' 
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Fetch the shared content data
    const response = await fetch(`${baseUrl}/api/share/${params.id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      notFound();
    }
    
    const data = await response.json();
    
    return <SharePage data={data} />;
  } catch (error) {
    console.error('Error fetching shared content:', error);
    notFound();
  }
} 