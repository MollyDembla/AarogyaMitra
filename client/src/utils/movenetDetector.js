/**
 * Real-Time MoveNet Pose Detector
 * Detects 17 COCO keypoints from HTML5 Video Element in real-time
 */

import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';

let detector = null;
let isInitializing = false;

export async function initMoveNetDetector() {
  if (detector) return detector;
  if (isInitializing) return null;

  isInitializing = true;
  try {
    await tf.ready();
    await tf.setBackend('webgl');
    const detectorConfig = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
    };
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      detectorConfig
    );
    console.log('MoveNet Detector initialized successfully');
    return detector;
  } catch (err) {
    console.warn('TensorFlow WebGL MoveNet initialization fallback:', err.message);
    detector = null;
    return null;
  } finally {
    isInitializing = false;
  }
}

export async function detectPoseFromVideo(videoElement) {
  if (!videoElement || videoElement.readyState < 2) return null;

  try {
    if (!detector) {
      await initMoveNetDetector();
    }
    if (detector) {
      const poses = await detector.estimatePoses(videoElement, {
        maxPoses: 1,
        flipHorizontal: false
      });
      if (poses && poses.length > 0 && poses[0].keypoints) {
        return poses[0].keypoints;
      }
    }
  } catch (err) {
    // Fallthrough to fast estimation if WebGL context busy
  }

  return null;
}
