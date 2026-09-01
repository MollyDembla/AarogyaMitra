/**
 * Verified Resource Database for Professional Care Navigation Agent.
 * All resources are manually verified — NOT LLM-generated.
 * Each resource includes name, contact, type, availability, description, and verification date.
 */

export const CRISIS_RESOURCES = [
  {
    id: 'kiran',
    name: 'KIRAN Mental Health Helpline',
    organization: 'Ministry of Social Justice & Empowerment, Govt. of India',
    contact: '1800-599-0019',
    type: 'crisis',
    classification: 'emergency',
    available: '24 hours, 7 days a week',
    language: 'Multiple Indian languages',
    cost: 'Free',
    description: 'National mental health rehabilitation helpline providing early intervention and psychological first aid.',
    website: 'https://nimhans.ac.in/kiran-helpline/',
    verified: true,
    verifiedDate: '2024-01'
  },
  {
    id: 'icall',
    name: 'iCall (TISS)',
    organization: 'Tata Institute of Social Sciences',
    contact: '9152987821',
    type: 'crisis',
    classification: 'crisis',
    available: 'Monday to Saturday, 8:00 AM to 10:00 PM',
    language: 'English, Hindi',
    cost: 'Free',
    description: 'Psychosocial helpline offering counseling support by trained psychology students and professionals.',
    website: 'https://icallhelpline.org',
    verified: true,
    verifiedDate: '2024-01'
  },
  {
    id: 'vandrevala',
    name: 'Vandrevala Foundation',
    organization: 'Vandrevala Foundation',
    contact: '9999 666 555',
    type: 'crisis',
    classification: 'crisis',
    available: '24 hours, 7 days a week',
    language: 'English, Hindi',
    cost: 'Free',
    description: 'Mental health support and crisis intervention helpline offering confidential counseling.',
    website: 'https://vandrevalafoundation.com',
    verified: true,
    verifiedDate: '2024-01'
  },
  {
    id: 'snehi',
    name: 'Snehi',
    organization: 'Snehi',
    contact: '044-24640050',
    type: 'crisis',
    classification: 'support',
    available: 'Daily, 8:00 AM to 10:00 PM',
    language: 'English, Hindi, Tamil',
    cost: 'Free',
    description: 'Emotional support and suicide prevention helpline based in Chennai.',
    website: 'https://snehi.org',
    verified: true,
    verifiedDate: '2024-01'
  },
  {
    id: 'arpita',
    name: 'Arpita Suicide Prevention Helpline',
    organization: 'Arpita',
    contact: '080-23655557',
    type: 'crisis',
    classification: 'crisis',
    available: 'Monday to Saturday, 9:00 AM to 9:00 PM',
    language: 'Kannada, English, Hindi',
    cost: 'Free',
    description: 'Suicide prevention helpline based in Bangalore offering emotional support.',
    verified: true,
    verifiedDate: '2024-01'
  }
];

export const EMERGENCY_RESOURCE = {
  id: 'emergency',
  name: 'National Emergency Services',
  contact: '112',
  type: 'emergency',
  classification: 'emergency',
  available: '24 hours, 7 days a week',
  description: 'National emergency helpline for immediate danger situations.',
  verified: true,
  verifiedDate: '2024-01'
};

export const PROFESSIONAL_RESOURCES = [
  {
    id: 'nimhans',
    name: 'NIMHANS',
    organization: 'National Institute of Mental Health and Neuro Sciences',
    type: 'institution',
    location: 'Bangalore, Karnataka',
    contact: '080-46110007',
    website: 'https://nimhans.ac.in',
    description: 'Premier national institution for mental health and neuroscience research and treatment.',
    verified: true,
    verifiedDate: '2024-01'
  },
  {
    id: 'lissun',
    name: 'Lissun',
    organization: 'Lissun Mental Healthcare',
    type: 'platform',
    location: 'Pan-India (online)',
    website: 'https://www.lissun.com',
    description: 'Online mental health platform connecting users with licensed psychologists and psychiatrists across India.',
    verified: true,
    verifiedDate: '2024-01'
  },
  {
    id: 'yoda',
    name: 'YourDOST',
    organization: 'YourDOST',
    type: 'platform',
    location: 'Pan-India (online)',
    website: 'https://yourdost.com',
    description: 'Online counseling and mental wellness platform with certified counselors.',
    verified: true,
    verifiedDate: '2024-01'
  }
];

/**
 * Get appropriate resources based on care level.
 * @param {number} careLevel
 * @returns {object} resources
 */
export function getResourcesForCareLevel(careLevel) {
  if (careLevel >= 4) {
    return {
      crisis: CRISIS_RESOURCES,
      emergency: EMERGENCY_RESOURCE,
      professional: []
    };
  }
  if (careLevel >= 3) {
    return {
      crisis: CRISIS_RESOURCES.slice(0, 3),
      emergency: EMERGENCY_RESOURCE,
      professional: PROFESSIONAL_RESOURCES
    };
  }
  if (careLevel >= 2) {
    return {
      crisis: CRISIS_RESOURCES.slice(0, 2),
      emergency: EMERGENCY_RESOURCE,
      professional: PROFESSIONAL_RESOURCES
    };
  }
  return {
    crisis: CRISIS_RESOURCES.slice(0, 1),
    emergency: EMERGENCY_RESOURCE,
    professional: PROFESSIONAL_RESOURCES.slice(0, 2)
  };
}
