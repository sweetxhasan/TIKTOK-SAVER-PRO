import axios from 'axios';

const userAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36'
];

export class TikTokDownloader {
    getRandomUserAgent() {
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    validateTikTokUrl(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }

        const tiktokPatterns = [
            /https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/,
            /https?:\/\/(www\.)?tiktok\.com\/t\/[\w-]+\//,
            /https?:\/\/(vm|vt)\.tiktok\.com\/[\w-]+\//,
            /https?:\/\/(www\.)?tiktok\.com\/embed\/[\w-]+/,
            /https?:\/\/(www\.)?tiktok\.com\/v\/\d+\.html/,
            /https?:\/\/(www\.)?tiktok\.com\/[\w@.-]+\/video\/\d+/,
        ];
        
        return tiktokPatterns.some(pattern => pattern.test(url.trim()));
    }

    async downloadTikTok(tiktokUrl) {
        if (!this.validateTikTokUrl(tiktokUrl)) {
            throw new Error('Invalid TikTok URL. Please provide a valid TikTok video URL. Examples: https://www.tiktok.com/@username/video/123456789, https://vm.tiktok.com/ABC123/');
        }

        try {
            const userAgent = this.getRandomUserAgent();
            
            const formData = new URLSearchParams();
            formData.append('url', tiktokUrl.trim());
            
            const response = await axios({
                method: 'POST',
                url: 'https://www.tikwm.com/api/',
                data: formData,
                timeout: 30000, // 30 seconds timeout
                headers: {
                    'User-Agent': userAgent,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'Origin': 'https://www.tikwm.com',
                    'Referer': 'https://www.tikwm.com/',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.data) {
                throw new Error('No response data received from TikTok service');
            }

            return this.parseResponse(response.data);
        } catch (error) {
            console.error('TikTok download error:', error.message);
            
            if (error.code === 'ECONNABORTED') {
                throw new Error('Request timeout. Please try again.');
            } else if (error.response) {
                throw new Error(`TikTok service error: ${error.response.status}`);
            } else if (error.request) {
                throw new Error('Network error. Please check your connection and try again.');
            } else {
                throw new Error('Service temporarily unavailable. Please try again.');
            }
        }
    }

    parseResponse(data) {
        if (!data) {
            throw new Error('No data received from TikTok API');
        }

        if (data.code !== 0 && data.code !== undefined) {
            throw new Error(data.msg || 'TikTok API returned an error');
        }

        if (!data.data) {
            throw new Error('No media data found in TikTok response');
        }

        const videoData = data.data;
        const isPhotoPost = videoData.images && videoData.images.length > 0;
        
        // Video qualities
        const qualities = [];
        if (videoData.hdplay) {
            qualities.push({ 
                type: 'hd', 
                url: videoData.hdplay, 
                label: 'HD Quality'
            });
        }
        if (videoData.play) {
            qualities.push({ 
                type: 'standard', 
                url: videoData.play, 
                label: 'Standard Quality'
            });
        }

        if (qualities.length === 0 && !isPhotoPost) {
            throw new Error('No download links found for this video');
        }

        // Music info
        const musicInfo = videoData.music_info || {};
        
        // Author info
        const authorInfo = videoData.author || {};
        
        // Images for photo posts
        const images = isPhotoPost ? (videoData.images || []).map((img, index) => ({
            id: index + 1,
            url: img
        })) : [];

        const title = videoData.title || 'TikTok Video';
        const filename = this.generateFilename(title, videoData.duration || 0);

        return {
            success: true,
            type: isPhotoPost ? 'photos' : 'video',
            data: {
                title: title,
                description: videoData.title || '',
                duration: videoData.duration || 0,
                thumbnail: videoData.cover || this.generatePlaceholderAvatar(),
                filename: filename,
                author: {
                    id: authorInfo.unique_id || 'unknown',
                    name: authorInfo.nickname || 'Unknown User',
                    username: authorInfo.unique_id || 'unknown',
                    avatar: authorInfo.avatar || this.generatePlaceholderAvatar(),
                    verified: authorInfo.verified || false,
                    followers: this.formatCount(authorInfo.follower_count || 0)
                },
                statistics: {
                    likes: this.formatCount(videoData.digg_count || 0),
                    comments: this.formatCount(videoData.comment_count || 0),
                    shares: this.formatCount(videoData.share_count || 0),
                    views: this.formatCount(videoData.play_count || 0),
                    downloads: this.formatCount(videoData.download_count || 0)
                },
                music: {
                    title: musicInfo.title || 'Original Sound',
                    author: musicInfo.author || 'Unknown Artist',
                    url: musicInfo.play || '',
                    cover: musicInfo.cover || ''
                },
                download_links: {
                    video: qualities,
                    audio: musicInfo.play ? [{
                        type: 'audio',
                        url: musicInfo.play,
                        label: 'Audio Only'
                    }] : [],
                    images: images
                },
                created_time: videoData.create_time || Date.now()
            }
        };
    }

    generateFilename(title, duration) {
        const cleanTitle = title
            .replace(/[^\w\s]/gi, '')
            .split(' ')
            .slice(0, 14)
            .join(' ')
            .trim() || 'tiktok_video';
        
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const timeString = minutes > 0 ? `${minutes}m${seconds}s` : `${seconds}s`;
        
        return `${cleanTitle}_${timeString}`.replace(/\s+/g, '_');
    }

    formatCount(count) {
        if (typeof count === 'string') return count;
        
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    }

    generatePlaceholderAvatar() {
        return `https://ui-avatars.com/api/?name=TikTok&background=667eea&color=fff&size=128`;
    }
}
