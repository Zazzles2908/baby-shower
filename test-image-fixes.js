/**
 * Test script to verify image service fixes
 */

(function() {
    'use strict';
    
    console.log('Testing Image Service fixes...');
    
    // Test generateFallbackId with invalid inputs
    console.log('\n=== Testing generateFallbackId ===');
    
    try {
        const result1 = window.ImageService.getFallback(undefined);
        console.log('✅ getFallback(undefined) returned:', result1.type);
        
        const result2 = window.ImageService.getFallback(null);
        console.log('✅ getFallback(null) returned:', result2.type);
        
        const result3 = window.ImageService.getFallback('');
        console.log('✅ getFallback("") returned:', result3.type);
        
    } catch (error) {
        console.error('❌ Error in getFallback:', error.message);
    }
    
    // Test loadImageWithRetry with invalid inputs
    console.log('\n=== Testing loadImageWithRetry ===');
    
    try {
        window.ImageService.loadImage(undefined).then(result => {
            console.log('✅ loadImage(undefined) returned:', result.type);
        }).catch(error => {
            console.error('❌ loadImage(undefined) failed:', error.message);
        });
        
        window.ImageService.loadImage(null).then(result => {
            console.log('✅ loadImage(null) returned:', result.type);
        }).catch(error => {
            console.error('❌ loadImage(null) failed:', error.message);
        });
        
        window.ImageService.loadImage('').then(result => {
            console.log('✅ loadImage("") returned:', result.type);
        }).catch(error => {
            console.error('❌ loadImage("") failed:', error.message);
        });
        
    } catch (error) {
        console.error('❌ Error in loadImageWithRetry:', error.message);
    }
    
    // Test getImageUrl with invalid inputs
    console.log('\n=== Testing getImageUrl ===');
    
    try {
        const url1 = window.ImageService.getImageUrl(undefined);
        console.log('✅ getImageUrl(undefined) returned:', url1);
        
        const url2 = window.ImageService.getImageUrl(null);
        console.log('✅ getImageUrl(null) returned:', url2);
        
        const url3 = window.ImageService.getImageUrl('');
        console.log('✅ getImageUrl("") returned:', url3);
        
    } catch (error) {
        console.error('❌ Error in getImageUrl:', error.message);
    }
    
    console.log('\n=== All tests completed ===');
    
})();