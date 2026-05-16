// Content moderation service for uploads

// List of keywords that typically indicate inappropriate content
const INAPPROPRIATE_KEYWORDS = [
  'adult', 'nsfw', 'explicit', 'nude', 'naked', 'sexy', 'xxx', 'porn',
  'violence', 'gore', 'blood', 'brutal', 'graphic', 'kill', 'death',
  'weapon', 'gun', 'knife', 'bomb'
];

// Moderate tags from AI analysis
export function analyzeTagsForContent(tags, safeSearch = {}) {
  const flagged = {
    isFlagged: false,
    reasons: [],
    severity: 'safe', // 'safe', 'warning', 'blocked'
    safeSearch
  };

  if (!tags || !Array.isArray(tags)) {
    return flagged;
  }

  const lowerCaseTags = tags.map(tag => tag.toLowerCase());

  // Check for inappropriate keywords in tags
  for (const tag of lowerCaseTags) {
    for (const keyword of INAPPROPRIATE_KEYWORDS) {
      if (tag.includes(keyword)) {
        flagged.isFlagged = true;
        flagged.reasons.push(`Potential inappropriate content detected: "${tag}"`);
        flagged.severity = 'warning';
      }
    }
  }

  // Check safe search results
  if (safeSearch) {
    const levels = ['VERY_LIKELY', 'LIKELY'];
    
    if (levels.includes(safeSearch.adult)) {
      flagged.isFlagged = true;
      flagged.reasons.push('Adult content detected');
      flagged.severity = 'blocked';
    }
    
    if (levels.includes(safeSearch.violence)) {
      flagged.isFlagged = true;
      flagged.reasons.push('Violent content detected');
      flagged.severity = 'blocked';
    }
    
    if (levels.includes(safeSearch.racy)) {
      flagged.isFlagged = true;
      flagged.reasons.push('Inappropriate imagery detected');
      flagged.severity = 'warning';
    }
  }

  return flagged;
}

// Validate upload based on moderation results
export function validateUpload(moderationResult, forceUpload = false) {
  const response = {
    canUpload: true,
    warnings: [],
    blocked: false
  };

  if (!moderationResult.isFlagged) {
    return response;
  }

  if (moderationResult.severity === 'blocked') {
    response.blocked = true;
    response.canUpload = false;
    response.warnings = moderationResult.reasons;
    return response;
  }

  if (moderationResult.severity === 'warning' && !forceUpload) {
    response.canUpload = false;
    response.warnings = moderationResult.reasons;
    return response;
  }

  return response;
}

// Sanitize description for inappropriate content
export function sanitizeDescription(description) {
  if (!description) return '';
  
  // Remove excessive special characters, links, etc.
  let sanitized = description
    .replace(/[<>]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .trim();

  // Limit length
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000) + '...';
  }

  return sanitized;
}

// Filter inappropriate words from user input
export function filterInappropriateContent(text) {
  if (!text) return '';

  const badWords = [
    'xxx', 'porn', 'explicit', 'nude', 'naked', 'nsfw'
  ];

  let filtered = text.toLowerCase();
  for (const word of badWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  }

  return filtered;
}

export default {
  analyzeTagsForContent,
  validateUpload,
  sanitizeDescription,
  filterInappropriateContent
};
