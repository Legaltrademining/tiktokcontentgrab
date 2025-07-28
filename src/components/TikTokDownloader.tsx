import React, { useState } from 'react';
import { Download, Video, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface DownloadLink {
  url: string;
  quality: string;
  hasWatermark: boolean;
}

interface DownloadResult {
  title: string;
  thumbnail: string;
  links: DownloadLink[];
}

const TikTokDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [error, setError] = useState('');

  const isValidTikTokUrl = (url: string): boolean => {
    const tikTokRegex = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)/;
    return tikTokRegex.test(url);
  };

  const parseHtmlResponse = (html: string): DownloadResult => {
    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract title
    const titleElement = doc.querySelector('.video-title, .title, h1, h2');
    const title = titleElement?.textContent?.trim() || 'TikTok Video';
    
    // Extract thumbnail
    const thumbnailElement = doc.querySelector('img[src*="tiktok"], .thumbnail img, .video-thumbnail');
    const thumbnail = thumbnailElement?.getAttribute('src') || '';
    
    // Extract download links
    const downloadLinks: DownloadLink[] = [];
    
    // Look for download buttons or links
    const downloadElements = doc.querySelectorAll('a[href*="download"], .download-btn, .btn-download');
    
    downloadElements.forEach((element, index) => {
      const href = element.getAttribute('href');
      if (href) {
        const text = element.textContent?.toLowerCase() || '';
        const hasWatermark = !text.includes('no watermark') && !text.includes('without watermark');
        const quality = text.includes('hd') ? 'HD' : 'Standard';
        
        downloadLinks.push({
          url: href,
          quality,
          hasWatermark
        });
      }
    });
    
    // If no specific download links found, look for video sources
    if (downloadLinks.length === 0) {
      const videoElements = doc.querySelectorAll('video source, video[src]');
      videoElements.forEach((element, index) => {
        const src = element.getAttribute('src') || element.getAttribute('data-src');
        if (src) {
          downloadLinks.push({
            url: src,
            quality: 'Standard',
            hasWatermark: true
          });
        }
      });
    }
    
    return { title, thumbnail, links: downloadLinks };
  };

  const downloadVideo = async () => {
    if (!url.trim()) {
      setError('Please enter a TikTok URL');
      return;
    }

    if (!isValidTikTokUrl(url)) {
      setError('Please enter a valid TikTok URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Create form data for POST request
      const formData = new FormData();
      formData.append('url', url);
      formData.append('format', 'mp4');

      const response = await fetch('http://localhost:5000/api/download', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url })
});

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const htmlContent = await response.text();
      const parsedResult = parseHtmlResponse(htmlContent);
      
      if (parsedResult.links.length === 0) {
        throw new Error('No download links found in the response');
      }
      
      setResult(parsedResult);
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (downloadUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-cyan-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Video className="h-12 w-12 text-pink-500 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-cyan-600 bg-clip-text text-transparent">
              TikTok Downloader
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Download TikTok videos easily with or without watermark. Just paste the URL and get your video instantly.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-3">
                TikTok Video URL
              </label>
              <input
                type="text"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@username/video/..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400"
                disabled={loading}
              />
            </div>
            <button
              onClick={downloadVideo}
              disabled={loading || !url.trim()}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Download
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-800">Download Ready</h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Video Info */}
              <div className="lg:col-span-1">
                {result.thumbnail && (
                  <img
                    src={result.thumbnail}
                    alt="Video thumbnail"
                    className="w-full aspect-video object-cover rounded-xl mb-4"
                  />
                )}
                <h3 className="font-semibold text-gray-800 mb-2">{result.title}</h3>
                <p className="text-sm text-gray-600">
                  {result.links.length} download option{result.links.length !== 1 ? 's' : ''} available
                </p>
              </div>

              {/* Download Options */}
              <div className="lg:col-span-2">
                <h4 className="font-semibold text-gray-800 mb-4">Download Options</h4>
                <div className="space-y-3">
                  {result.links.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-gray-800">
                            {link.quality} Quality
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            link.hasWatermark 
                              ? 'bg-orange-100 text-orange-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {link.hasWatermark ? 'With Watermark' : 'No Watermark'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">MP4 Format</p>
                      </div>
                      <button
                        onClick={() => handleDownload(link.url, `tiktok-video-${index + 1}.mp4`)}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-gradient-to-r from-pink-500/10 to-cyan-500/10 rounded-3xl p-8 border border-pink-200/50">
          <h3 className="text-xl font-bold text-gray-800 mb-4">How to Use</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                1
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Copy URL</h4>
              <p className="text-gray-600 text-sm">Copy the TikTok video URL from the app or website</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                2
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Paste & Process</h4>
              <p className="text-gray-600 text-sm">Paste the URL and click download to process</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                3
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Download</h4>
              <p className="text-gray-600 text-sm">Choose your preferred quality and download the video</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TikTokDownloader;
