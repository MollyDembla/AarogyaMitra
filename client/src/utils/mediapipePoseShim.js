/**
 * Mediapipe Pose ES Module Shim for Vite / Browser compatibility
 * @mediapipe/pose exports globals (window.Pose) instead of ESM exports.
 */
import '../../../node_modules/@mediapipe/pose/pose.js';

export const Pose = typeof window !== 'undefined' ? window.Pose : undefined;
export const POSE_CONNECTIONS = typeof window !== 'undefined' ? window.POSE_CONNECTIONS : undefined;
export const POSE_LANDMARKS = typeof window !== 'undefined' ? window.POSE_LANDMARKS : undefined;
export const POSE_LANDMARKS_LEFT = typeof window !== 'undefined' ? window.POSE_LANDMARKS_LEFT : undefined;
export const POSE_LANDMARKS_RIGHT = typeof window !== 'undefined' ? window.POSE_LANDMARKS_RIGHT : undefined;
export const POSE_LANDMARKS_NEUTRAL = typeof window !== 'undefined' ? window.POSE_LANDMARKS_NEUTRAL : undefined;
export const VERSION = typeof window !== 'undefined' ? window.VERSION : undefined;

export default typeof window !== 'undefined' ? window.Pose : undefined;
