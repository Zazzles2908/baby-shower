// Baby Shower App - API Client
// Simplified API client that calls Vercel API Routes

/**
 * Submit form data to Vercel API
 * @param {string} endpoint - API endpoint (guestbook, pool, quiz, advice, vote)
 * @param {Object} data - Form data to submit
 * @param {File} photoFile - Optional photo file
 * @returns {Promise<Object>} Response
 */
async function submitToAPI(endpoint, data, photoFile) {
  try {
    let submissionData = { ...data };
    
    // Handle photo upload first if present
    if (photoFile) {
      const uploadResult = await uploadPhotoToSupabase(photoFile);
      submissionData.photoURL = uploadResult.url;
    }

    const apiUrl = `${CONFIG.API_BASE_URL}/${endpoint}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'API request failed');
    }

    return {
      result: 'success',
      message: result.message || 'Submission successful!',
      data: result.data,
      milestones: result.milestones || null
    };
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Upload photo to Supabase Storage
 * @param {File} photoFile - Photo file to upload
 * @returns {Promise<Object>} Upload result
 */
async function uploadPhotoToSupabase(photoFile) {
  try {
    // Validate file
    if (photoFile.size > CONFIG.STORAGE.MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum 5MB allowed.');
    }

    if (!CONFIG.STORAGE.ALLOWED_TYPES.includes(photoFile.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.');
    }

    const fileExt = photoFile.name.split('.').pop();
    const fileName = `guestbook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage
    const response = await fetch(`${CONFIG.SUPABASE.URL}/storage/v1/object/${CONFIG.STORAGE.BUCKET}/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.SUPABASE.ANON_KEY}`,
        'Content-Type': photoFile.type,
        'x-upsert': 'true'
      },
      body: photoFile
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    // Return public URL
    const publicUrl = `${CONFIG.SUPABASE.URL}/storage/v1/object/public/${CONFIG.STORAGE.BUCKET}/${filePath}`;
    
    return {
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Photo upload error:', error);
    throw error;
  }
}

// Convenience functions for each endpoint

/**
 * Submit guestbook entry
 */
async function submitGuestbook(data, photoFile) {
  return submitToAPI('guestbook', {
    name: data.name,
    relationship: data.relationship,
    message: data.message
  }, photoFile);
}

/**
 * Submit baby pool prediction
 */
async function submitPool(data) {
  return submitToAPI('pool', {
    name: data.name,
    dateGuess: data.dateGuess,
    timeGuess: data.timeGuess,
    weightGuess: data.weightGuess,
    lengthGuess: data.lengthGuess
  });
}

/**
 * Submit quiz answers
 */
async function submitQuiz(data) {
  return submitToAPI('quiz', {
    name: data.name,
    puzzle1: data.puzzle1,
    puzzle2: data.puzzle2,
    puzzle3: data.puzzle3,
    puzzle4: data.puzzle4,
    puzzle5: data.puzzle5
  });
}

/**
 * Submit advice
 */
async function submitAdvice(data) {
  return submitToAPI('advice', {
    name: data.name,
    adviceType: data.adviceType,
    message: data.message
  });
}

/**
 * Submit name votes
 */
async function submitVote(data) {
  return submitToAPI('vote', {
    name: data.name,
    selectedNames: data.selectedNames
  });
}

/**
 * Check API health
 */
async function checkAPIHealth() {
  try {
    const response = await fetch(CONFIG.API_BASE_URL);
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return { result: 'error', error: 'API not reachable' };
  }
}
