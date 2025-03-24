// src/utils/mediaProcessing.js
// Utilities for processing images and videos before upload

import ImageResizer from 'react-native-image-resizer';
import { Image as ImageCompressor } from 'react-native-compressor';
import { Image } from 'react-native-compressor';
import { FFmpegKit, FFprobeKit, ReturnCode } from 'ffmpeg-kit-react-native';
import createThumbnail from 'react-native-create-thumbnail';

// Maximum dimensions for uploaded images
const MAX_IMAGE_DIMENSION = 1200;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_THUMBNAIL_DIMENSION = 500;
const IMAGE_QUALITY = 80;

// Video constants
const MAX_VIDEO_DIMENSION = 720;
const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_DURATION_SEC = 120;
const VIDEO_BITRATE = '2M';

/**
 * Process an image before upload (resize and compress)
 * @param {Object} image - Image object from image picker
 * @returns {Promise<Object>} Processed image
 */
export const processImage = async (image) => {
  if (!image || !image.uri) {
    throw new Error('Invalid image object');
  }
  
  try {
    // Check if image needs resizing
    const shouldResizeImage = (image.width > MAX_IMAGE_DIMENSION || image.height > MAX_IMAGE_DIMENSION);
    let processedUri = image.uri;
    
    // Resize if needed
    if (shouldResizeImage) {
      // Calculate new dimensions while maintaining aspect ratio
      let newWidth, newHeight;
      if (image.width > image.height) {
        newWidth = MAX_IMAGE_DIMENSION;
        newHeight = Math.floor(image.height * (MAX_IMAGE_DIMENSION / image.width));
      } else {
        newHeight = MAX_IMAGE_DIMENSION;
        newWidth = Math.floor(image.width * (MAX_IMAGE_DIMENSION / image.height));
      }
      
      // Resize the image
      const resizeResult = await ImageResizer.createResizedImage(
        image.uri,
        newWidth,
        newHeight,
        'JPEG',
        IMAGE_QUALITY,
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: true }
      );
      
      processedUri = resizeResult.uri;
    }
    
    // Compress the image
    const compressedImageUri = await ImageCompressor.compress(processedUri, {
      compressionMethod: 'auto',
      maxWidth: MAX_IMAGE_DIMENSION,
      maxHeight: MAX_IMAGE_DIMENSION,
      quality: IMAGE_QUALITY / 100,
    });
    
    // Check final file size
    const fileInfo = await RNFS.stat(compressedImageUri);
    const fileSizeMB = fileInfo.size / (1024 * 1024);
    
    if (fileSizeMB > MAX_IMAGE_SIZE_MB) {
      // Further compress if still too large
      const furtherCompressedImageUri = await ImageCompressor.compress(compressedUri, {
        compressionMethod: 'auto',
        maxWidth: MAX_IMAGE_DIMENSION,
        maxHeight: MAX_IMAGE_DIMENSION,
        quality: (IMAGE_QUALITY - 20) / 100, // Lower quality for larger files
      });
      
      return {
        uri: furtherCompressedImageUri,
        type: 'image/jpeg',
        fileName: image.fileName || `image_${Date.now()}.jpg`,
        width: newWidth || image.width,
        height: newHeight || image.height,
      };
    }
    
    return {
      uri: compressedImageUri,
      type: 'image/jpeg',
      name: image.fileName || `image_${Date.now()}.jpg`,
      width: newWidth || image.width,
      height: newHeight || image.height,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

/**
 * Create a thumbnail from an image
 * @param {string} imageUri - URI of the image
 * @returns {Promise<string>} URI of the thumbnail
 */
export const createImageThumbnail = async (imageUri) => {
  try {
    // Resize the image to thumbnail size
    const thumbnailResult = await ImageResizer.createResizedImage(
      imageUri,
      MAX_THUMBNAIL_DIMENSION,
      MAX_THUMBNAIL_DIMENSION,
      'JPEG',
      70,
      0,
      undefined,
      false,
      { mode: 'contain', onlyScaleDown: true }
    );
    
    return thumbnailResult.uri;
  } catch (error) {
    console.error('Error creating image thumbnail:', error);
    throw error;
  }
};

/**
 * Get video information using FFprobe
 * @param {string} videoUri - URI of the video
 * @returns {Promise<Object>} Video information including duration, width, height
 */
export const getVideoInfo = async (videoUri) => {
  try {
    const session = await FFprobeKit.execute(`-i "${videoUri}" -v quiet -print_format json -show_entries format=duration,bit_rate,size:stream=width,height,codec_type -select_streams v:0`);
    const returnCode = await session.getReturnCode();
    
    if (ReturnCode.isSuccess(returnCode)) {
      const output = await session.getOutput();
      const info = JSON.parse(output);
      
      // Find video stream
      const videoStream = info.streams.find(stream => stream.codec_type === 'video');
      
      // Calculate duration
      const durationSec = info.format.duration ? parseFloat(info.format.duration) : null;
      
      return {
        duration: durationSec ? durationSec * 1000 : null, // Convert to milliseconds
        width: videoStream ? parseInt(videoStream.width) : null,
        height: videoStream ? parseInt(videoStream.height) : null,
        bitrate: info.format.bit_rate ? parseInt(info.format.bit_rate) : null,
        size: info.format.size ? parseInt(info.format.size) : null,
      };
    } else {
      throw new Error(`FFprobe failed with return code ${returnCode}`);
    }
  } catch (error) {
    console.error('Error getting video info:', error);
    throw error;
  }
};

/**
 * Create a thumbnail from a video using FFmpeg
 * @param {string} videoUri - URI of the video
 * @param {number} timestamp - Timestamp in seconds for the thumbnail
 * @returns {Promise<string>} URI of the thumbnail
 */
export const createVideoThumbnailWithFFmpeg = async (videoUri, timestamp = 1) => {
  try {
    const outputPath = `${RNFS.CachesDirectoryPath}/thumb_${Date.now()}.jpg`;
    
    // Create thumbnail with FFmpeg
    const session = await FFmpegKit.execute(`-i "${videoUri}" -ss ${timestamp} -vframes 1 -q:v 2 "${outputPath}"`);
    const returnCode = await session.getReturnCode();
    
    if (ReturnCode.isSuccess(returnCode)) {
      return filteredVideoPath;
    } else {
      // Fallback to react-native-create-thumbnail if FFmpeg fails
      console.warn('FFmpeg thumbnail creation failed, using fallback method');
      const result = await createThumbnail({
        url: videoUri,
        timeStamp: timestamp * 1000,
        quality: 0.8,
      });
      return result.path;
    }
  } catch (error) {
    console.error('Error creating video thumbnail with FFmpeg:', error);
    
    // Fallback to react-native-create-thumbnail
    try {
      const result = await createThumbnail({
        url: videoUri,
        timeStamp: timestamp * 1000,
        quality: 0.8,
      });
      return result.path;
    } catch (fallbackError) {
      console.error('Fallback thumbnail creation failed:', fallbackError);
      throw error;
    }
  }
};

/**
 * Process a video before upload using FFmpeg (resize, compress, create thumbnail)
 * @param {Object} video - Video object from video picker
 * @returns {Promise<Object>} Processed video with thumbnail
 */
export const processVideo = async (video) => {
  if (!video || !video.uri) {
    throw new Error('Invalid video object');
  }
  
  try {
    // Get video info
    let videoMetadata;
    try {
      videoMetadata = await getVideoInfo(video.uri);
    } catch (infoError) {
      console.warn('Error getting video info:', infoError);
      // Continue with limited info from the video object
      videoMetadata = {
        duration: video.duration,
        width: video.width,
        height: video.height,
        size: video.fileSize,
      };
    }
    
    // Check video duration if available
    if (videoMetadata.duration && videoMetadata.duration > MAX_VIDEO_DURATION_SEC * 1000) {
      throw new Error(`Video duration exceeds the maximum limit of ${MAX_VIDEO_DURATION_SEC} seconds`);
    }
    
    // Check if compression is needed
    const videoFileSizeMB = videoInfo.size ? videoInfo.size / (1024 * 1024) : video.fileSize / (1024 * 1024);
    const needsCompression = videoFileSizeMB > MAX_VIDEO_SIZE_MB;
    
    // Check if resize is needed
    const shouldResizeVideo = videoMetadata.width && videoMetadata.height && (
      videoMetadata.width > MAX_VIDEO_DIMENSION || videoMetadata.height > MAX_VIDEO_DIMENSION
    );
    
    // Process video if needed
    let processedUri = video.uri;
    if (needsCompression || shouldResizeVideo) {
      const processedVideoPath = `${RNFS.CachesDirectoryPath}/processed_${Date.now()}.mp4`;
      
      // Construct FFmpeg command
      let command = `-i "${video.uri}"`;
      
      // Add resize filter if needed
      if (needsResize) {
        command += ` -vf "scale='min(${MAX_VIDEO_DIMENSION},iw)':'min(${MAX_VIDEO_DIMENSION},ih)'"`; 
      }
      
      // Add compression parameters
      command += ` -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k`;
      
      // Add max bitrate constraint for larger files
      if (videoFileSizeMB > MAX_VIDEO_SIZE_MB * 1.5) {
        command += ` -b:v ${VIDEO_BITRATE} -maxrate ${VIDEO_BITRATE} -bufsize ${parseInt(VIDEO_BITRATE) * 2}M`;
      }
      
      // Add output filename
      command += ` -movflags +faststart "${processedVideoPath}"`;
      
      // Execute command
      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();
      
      if (ReturnCode.isSuccess(returnCode)) {
        // Check if output file exists
        const exists = await RNFS.exists(processedVideoPath);
        if (!exists) {
          throw new Error('Video processing failed - output file not found');
        }
        
        processedUri = processedVideoPath;
      } else {
        console.error('FFmpeg processing failed with return code:', returnCode);
        const logs = await session.getLogs();
        console.error('FFmpeg logs:', logs);
        throw new Error('Video processing failed');
      }
    }
    
    // Create thumbnail
    const videoThumbnailUri = await createVideoThumbnailWithFFmpeg(processedUri);
    
    // Get final file size
    const finalFileInfo = await RNFS.stat(processedUri);
    const finalVideoFileSizeMB = finalFileInfo.size / (1024 * 1024);
    
    if (finalVideoFileSizeMB > MAX_VIDEO_SIZE_MB * 1.5) {
      console.warn(`Video is still large after compression: ${finalVideoFileSizeMB.toFixed(2)} MB`);
    }
    
    return {
      uri: processedUri,
      thumbnailUri: videoThumbnailUri,
      type: 'video/mp4',
      name: video.fileName || `video_${Date.now()}.mp4`,
      size: finalFileInfo.size,
    };
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
};

/**
 * Trim a video to a specific duration using FFmpeg
 * @param {string} videoUri - URI of the video
 * @param {number} startTime - Start time in seconds
 * @param {number} duration - Duration in seconds
 * @returns {Promise<string>} URI of the trimmed video
 */
export const trimVideo = async (videoUri, startTime, duration) => {
  try {
    const trimmedVideoPath = `${RNFS.CachesDirectoryPath}/trimmed_${Date.now()}.mp4`;
    
    // Construct FFmpeg command for trimming
    const command = `-i "${videoUri}" -ss ${startTime} -t ${duration} -c:v copy -c:a copy "${trimmedVideoPath}"`;
    
    // Execute command
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();
    
    if (ReturnCode.isSuccess(returnCode)) {
      return trimmedVideoPath;
    } else {
      const logs = await session.getLogs();
      console.error('FFmpeg trim logs:', logs);
      throw new Error('Video trimming failed');
    }
  } catch (error) {
    console.error('Error trimming video:', error);
    throw error;
  }
};

/**
 * Apply filters to a video using FFmpeg (like b&w, sepia, etc.)
 * @param {string} videoUri - URI of the video
 * @param {string} filterType - Type of filter to apply
 * @returns {Promise<string>} URI of the filtered video
 */
export const applyVideoFilter = async (videoUri, filterType) => {
  try {
    const filteredVideoPath = `${RNFS.CachesDirectoryPath}/filtered_${Date.now()}.mp4`;
    
    // Determine filter based on type
    let filterCommand;
    switch (filterType) {
      case 'grayscale':
        filterCommand = 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3';
        break;
      case 'sepia':
        filterCommand = 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';
        break;
      case 'vintage':
        filterCommand = 'curves=vintage, vignette';
        break;
      case 'sharpen':
        filterCommand = 'unsharp=5:5:1:5:5:0';
        break;
      default:
        throw new Error(`Unknown filter type: ${filterType}`);
    }
    
    // Construct FFmpeg command
    const command = `-i "${videoUri}" -vf "${filterCommand}" -c:v libx264 -preset medium -c:a copy "${filteredVideoPath}"`;
    
    // Execute command
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();
    
    if (ReturnCode.isSuccess(returnCode)) {
      return outputPath;
    } else {
      const logs = await session.getLogs();
      console.error('FFmpeg filter logs:', logs);
      throw new Error('Video filtering failed');
    }
  } catch (error) {
    console.error('Error applying filter to video:', error);
    throw error;
  }
};

/**
 * Check if a file is too large for upload
 * @param {number} fileSize - File size in bytes
 * @param {string} fileType - MIME type of the file
 * @returns {boolean} Whether the file is too large
 */
export const isFileTooLarge = (fileSize, fileType) => {
  const fileSizeInMB = fileSize / (1024 * 1024);
  if (fileType.startsWith('image')) {
    return fileSizeInMB > MAX_IMAGE_SIZE_MB;
  } else if (fileType.startsWith('video')) {
    return fileSizeInMB > MAX_VIDEO_SIZE_MB;
  }
  // Default to true for unknown file types to prevent uploading unsupported files
  return true;
};

/**
 * Get file extension from mime type
 * @param {string} mimeType - MIME type
 * @returns {string} File extension
 */
export const getFileExtension = (mimeType) => {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    case 'video/mp4':
      return 'mp4';
    case 'video/quicktime':
      return 'mov';
    case 'video/x-msvideo':
      return 'avi';
    default:
      // Default to 'dat' for unknown MIME types
      return 'dat';
  }
};

export default {
  processImage,
  createImageThumbnail,
  processVideo,
  trimVideo,
  applyVideoFilter,
  getVideoInfo,
  isFileTooLarge,
  getFileExtension,
  MAX_IMAGE_SIZE_MB,
  MAX_VIDEO_SIZE_MB,
  MAX_VIDEO_DURATION_SEC,
};
