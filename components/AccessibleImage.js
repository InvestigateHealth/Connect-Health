// src/components/AccessibleImage.js
// Accessible image component that respects user accessibility settings

import React from 'react';
import { Image, View, StyleSheet, Platform } from 'react-native';
import { ColorMatrix, saturate } from 'react-native-color-matrix-image-filters';
import { Svg, Defs, Filter, FeColorMatrix } from 'react-native-svg';
import FastImage from 'react-native-fast-image';
import { useAccessibility } from '../hooks/useAccessibility';

/**
 * AccessibleImage component that respects accessibility settings
 * 
 * @param {Object} props - Component props containing the following properties:
 * @param {Object|number} props.source - Image source (uri object or require)
 * @param {Object} props.style - Style for the image container
 * @param {string} props.accessibilityLabel - Accessibility description for screen readers
 * @param {boolean} [props.useFastImage=true] - Whether to use FastImage for performance
 * @param {string} props.resizeMode - Image resize mode (cover, contain, stretch, center) (default: 'cover')
 * @param {boolean} [props.showBorder=false] - Whether to show a border around the image
 * @returns {React.Component} Accessible image component
 */
const AccessibleImage = ({
  source,
  style,
  accessibilityLabel,
  useFastImage = true,
  resizeMode = 'cover',
  showBorder = false,
  ...props
}) => {
  const { highContrast, grayscale, screenReaderEnabled } = useAccessibility();
  
  // Create wrapper styles based on accessibility settings
  const getWrapperStyle = () => {
    const wrapperStyles = [];
    
    if (showBorder || highContrast) {
      wrapperStyles.push(styles.highContrastBorder);
    }
    
    return wrapperStyles;
  };
  
  // Apply grayscale filter if needed
  const getFilterStyle = () => grayscale ? { width: '100%', height: '100%' } : {};
  
  // Prepare accessibility props
  const accessibilityProps = {
    accessible: true,
    accessibilityLabel: accessibilityLabel || null,
    accessibilityRole: 'image',
    accessibilityHint: accessibilityLabel ? undefined : null,
  };
  
  // For Android, we need a different approach for grayscale
  const getAndroidGrayscaleStyle = () => {
    if (Platform.OS === 'android' && grayscale) {
      return { tintColor: '#000', opacity: 0.5 };
    }
    return {};
  };
  
  // FastImage supports accessibility props directly
  if (useFastImage) {
    return (
      <View style={[styles.wrapper, ...getWrapperStyle(), style]}>
        <FastImage
          style={[styles.image, getFilterStyle(), getAndroidGrayscaleStyle()]}
          source={source}
          resizeMode={
            FastImage.resizeMode[
              resizeMode === 'cover'
                ? 'cover'
                : resizeMode === 'contain'
                ? 'contain'
                : resizeMode === 'stretch'
                ? 'stretch'
                : 'cover'
            ]
          }
          {...accessibilityProps}
          {...props}
        />
      </View>
    );
  }
  
  // Regular Image component
  return (
    <View style={[styles.wrapper, ...getWrapperStyle(), style]}>
      {grayscale ? (
        <Svg style={styles.image}>
          <Defs>
            <Filter id="grayscale">
              <FeColorMatrix
                type="matrix"
                values="0.33 0.33 0.33 0 0
                        0.33 0.33 0.33 0 0
                        0.33 0.33 0.33 0 0
                        0 0 0 1 0"
              />
            </Filter>
          </Defs>
          <Image
            source={source}
            style={[styles.image, getAndroidGrayscaleStyle()]}
            resizeMode={resizeMode}
            {...accessibilityProps}
            {...props}
          />
        </Svg>
        ) : (
          <>
            <Image
              source={source}
              style={[
                styles.image,
                getFilterStyle(),
                getAndroidGrayscaleStyle(),
                grayscale && Platform.OS !== 'android' ? { filter: 'grayscale(100%)' } : {},
              ]}
              resizeMode={resizeMode}
              {...accessibilityProps}
              {...props}
            />
            {grayscale && Platform.OS !== 'android' && (
              <Svg style={styles.image}>
                <Defs>
                  <Filter id="grayscale">
                    <FeColorMatrix
                      type="matrix"
                      values="0.33 0.33 0.33 0 0
                              0.33 0.33 0.33 0 0
                              0.33 0.33 0.33 0 0
                              0 0 0 1 0"
                    />
                  </Filter>
                </Defs>
              </Svg>
            )}
              </>
            )}
          </View>
        );
      };
      
      const styles = StyleSheet.create({
        wrapper: {
          overflow: 'hidden',
        },
        image: {
          width: '100%',
          height: '100%',
        },
        highContrastBorder: {
          borderWidth: 1,
          borderColor: '#000',
        },
      });
      
      export default AccessibleImage;
