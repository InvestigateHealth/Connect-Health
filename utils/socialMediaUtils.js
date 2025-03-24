// src/utils/socialMediaUtils.js
import { Linking } from 'react-native';
import Share, { Social } from 'react-native-share';
/**
 * Utility class for handling social media links and sharing functionality.
 * 
 * This class provides various static methods to:
 * - Extract content IDs from social media URLs.
 * - Share content via SMS and email.
 * - Open URLs in the appropriate app or browser.
  static URL_PATTERNS = {
 * - Detect social media platforms from URLs.
 * 
 * Usage:
 * 
 * 1. Extract content ID from a URL:
 *    const contentId = SocialMediaUtils.extractContentId(url);
 * 
 * 2. Share content via SMS:
 *    const success = await SocialMediaUtils.shareViaSMS(message, url);
 * 
 * 3. Share content via email:
 *    const success = await SocialMediaUtils.shareViaEmail(subject, body, url);
 * 
 * 4. Open a URL:
 *    const success = await SocialMediaUtils.openUrl(url);
 * 
 * 5. Share content to any available share target:
 *    const result = await SocialMediaUtils.shareContent(options);
 * 
 * 6. Detect social media platform from a URL:
 *    const platform = SocialMediaUtils.detectPlatform(url);
 */
export default class SocialMediaUtils {
  /**
   * Regular expressions for extracting content from social media URLs
   */
  static URL_REGEX = {
    // Extract Facebook post/video IDs
    FACEBOOK_POST: /facebook\.com\/(?:[^\/]+\/posts\/|permalink\.php\?story_fbid=|[^\/]+\/(?:videos|photos|permalink)\/|watch\/\?v=)(\d+)/i,
    // Extract Instagram post IDs
    INSTAGRAM_POST: /instagram\.com\/p\/([a-zA-Z0-9_-]+)/i,
    // Extract Twitter IDs
    TWITTER_STATUS: /twitter\.com\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/i,
    // Extract YouTube video IDs
    YOUTUBE_VIDEO: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
  };
  
  // Define supported social media platforms and their URL patterns
  static SOCIAL_MEDIA_PLATFORMS = {
    FACEBOOK: {
      name: 'Facebook',
      urlPatterns: [
        'facebook.com',
        'fb.com',
        'fb.watch',
        'm.facebook.com'
      ],
      icon: 'facebook',
      color: '#3b5998'
    },
    INSTAGRAM: {
      name: 'Instagram',
      urlPatterns: [
        'instagram.com',
        'instagr.am',
        'instagram.co'
      ],
      icon: 'instagram',
      color: '#e1306c'
    },
    LINKEDIN: {
      name: 'LinkedIn',
      urlPatterns: [
        'linkedin.com',
        'lnkd.in'
      ],
      icon: 'linkedin',
      color: '#0077b5'
    },
    TWITTER: {
      name: 'Twitter',
      urlPatterns: [
        'twitter.com',
        'x.com',
        't.co'
      ],
      icon: 'twitter',
      color: '#1da1f2'
    },
    YOUTUBE: {
      name: 'YouTube',
      urlPatterns: [
        'youtube.com',
        'youtu.be'
      ],
      icon: 'youtube',
      color: '#ff0000'
    },
    TIKTOK: {
      name: 'TikTok',
      urlPatterns: [
        'tiktok.com',
        'vm.tiktok.com'
      ],
      icon: 'music',
      color: '#000000'
    },
    SUBSTACK: {
      name: 'Substack',
      urlPatterns: [
        'substack.com'
      ],
      icon: 'file-text',
      color: '#ff6719'
    },
    MEDIUM: {
      name: 'Medium',
      urlPatterns: [
        'medium.com'
      ],
      icon: 'type',
      color: '#00ab6c'
    }
  };

  /**
   * Extract content ID from social media URL
   * @param {string} url - Social media URL
   * @returns {string|null} - Extracted content ID or null
   */
  static extractContentId(url) {
    if (!url) return null;
    
    // Try each regex pattern
    for (const key in this.URL_REGEX) {
      if (this.URL_REGEX.hasOwnProperty(key)) {
        const regex = this.URL_REGEX[key];
        const match = url.match(regex);
        if (match) {
          // Different platforms have different match group indexes
          if (key === 'TWITTER_STATUS') {
            return { username: match[1], statusId: match[2] };
          }
          return match[1]; // Most platforms have the ID in the first capture group
        }
      }
    }
    
    return null;
  }
  
  /**
   * Share content via SMS
   * @param {string} message - Message to share
   * @param {string} url - Optional URL to include
   * @returns {Promise<boolean>} - Success status
   */
  static async shareViaSMS(message, url = '') {
    try {
      const content = url ? `${message}: ${url}` : message;
      const smsOptions = {
        title: 'Share via SMS',
        message: content,
        social: Share.Social.SMS
      };
      
      await Share.shareSingle(smsOptions);
      return true;
    } catch (error) {
      console.error('Error sharing via SMS:', error);
      return false;
    }
  }
  
  /**
   * Share content via email
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @param {string} url - Optional URL to include
   * @returns {Promise<boolean>} - Success status
   */
  static async shareViaEmail(subject, body, url = '') {
    try {
      const content = url ? `${body}\n\n${url}` : body;
      const emailOptions = {
        title: 'Share via Email',
        subject: subject,
        message: content,
        social: Share.Social.EMAIL
      };
      
      await Share.shareSingle(emailOptions);
      return true;
    } catch (error) {
      console.error('Error sharing via email:', error);
      return false;
    }
  }
  
  /**
   * Open a URL in appropriate app or browser
   * @param {string} url - URL to open
   * @returns {Promise<boolean>} - Success status
   */
  static async openUrl(url) {
    if (!url) return false;
    
    try {
      // Check if the URL can be opened by some app on the device
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        console.warn(`Cannot open URL: ${url}`);
        return false;
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      return false;
    }
  }
  
  /**
   * Share content to any available share target
   * @param {Object} options - Share options
   * @param {string} options.message - Message to share
   * @param {string} options.url - URL to share
   * @returns {Promise<Object>} - Share result
   */
  static async shareContent(options = {}) {
    const defaultOptions = {
      message: '',
      url: '',
    };
    
    const shareOptions = {...defaultOptions, ...options};
    
    try {
      const result = await Share.open(shareOptions);
      return result;
    } catch (error) {
      console.error('Error sharing content:', error);
      throw error;
    }
  }

  /**
   * Detect social media platform from URL
   * @param {string} url - The URL to check
   * @returns {Object|null} - Platform object or null if not a social media URL
   */
  static detectPlatform(url) {
    if (!url) {
      return null;
    }
    
    const cleanUrl = url.toLowerCase();
    
    for (const platform in this.SOCIAL_MEDIA_PLATFORMS) {
      const details = this.SOCIAL_MEDIA_PLATFORMS[platform];
      if (details.urlPatterns.some(pattern => url.toLowerCase().includes(pattern))) {
        return {
          platform,
          ...details
        };
      }
    }
  }
}