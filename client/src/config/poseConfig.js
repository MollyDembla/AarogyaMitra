/**
 * Central Configuration for Physical Activity Agent Pose Accuracy Engine
 * Configurable weights and evaluation parameters
 */

export const POSE_ACCURACY_WEIGHTS = {
  classificationConfidence: 0.40, // 40% ML Classification Confidence
  angleAlignment: 0.30,            // 30% Joint Angle Alignment
  keypointAlignment: 0.20,         // 20% Keypoint Vector Alignment
  stability: 0.10                  // 10% Temporal Stability
};

export const POSE_SESSION_WEIGHTS = {
  savasana: 0.33,
  balasana: 0.33,
  viparita_karani: 0.34
};

export const MOVENET_CONFIDENCE_THRESHOLD = 0.3; // Reject keypoints below 0.3 confidence
export const TEMPORAL_SMOOTHING_WINDOW = 30;     // 30 frame buffer window for majority voting & stability
