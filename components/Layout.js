import Head from 'next/head';

export default function Layout({ 
  children, 
  title = "Tik Save - TikTok Video Downloader Free API",
  description = "Download TikTok videos, photos, and audio with our free API. Get HD quality videos, detailed metadata, and easy integration.",
  keywords = "tiktok downloader, tiktok api, video download, free api, tiktok video, social media api",
  image = "/og-image.jpg"
}) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Tik Save" />

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />

        {/* Additional Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Tik Save" />
        <meta name="language" content="English" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={siteUrl} />

        {/* Theme Color */}
        <meta name="theme-color" content="#111827" />
        
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <div className="min-h-screen bg-white">
        {children}
      </div>
    </>
  );
}
