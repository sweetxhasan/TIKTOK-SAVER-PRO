import Head from 'next/head';

export default function Layout({ children, title = "TikTok Downloader API" }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Professional TikTok Video Downloader API" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-white">
        {children}
      </div>
    </>
  );
}
