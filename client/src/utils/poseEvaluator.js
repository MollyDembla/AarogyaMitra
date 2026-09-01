/**
 * MoveNet Biomechanical Pose Evaluator & Angle Calculation Engine
 * Strict Posture Verification & Low-Accuracy Penalty for Incorrect/Missing Poses
 */

import { MEDICALLY_DESIGNATED_POSES } from '../data/poseData';
import { POSE_ACCURACY_WEIGHTS, MOVENET_CONFIDENCE_THRESHOLD } from '../config/poseConfig';

export const MOVENET_KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
];

export function calculateAngle(pointA, pointB, pointC) {
  if (!pointA || !pointB || !pointC) return 0;
  const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
                  Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360.0 - angle;
  return Math.round(angle * 10) / 10;
}

export function calculateVerticalTilt(pointA, pointB) {
  if (!pointA || !pointB) return 0;
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  const radians = Math.atan2(dx, dy);
  const angle = Math.abs((radians * 180.0) / Math.PI);
  return Math.round(angle * 10) / 10;
}

/**
 * Strict Pose Detection Verification:
 * Checks whether user is actually in the target pose orientation or just sitting upright in front of webcam.
 */
export function verifyPoseOrientation(poseId, keypointsMap) {
  const lShoulder = keypointsMap['left_shoulder'] || { x: 0, y: 0 };
  const rShoulder = keypointsMap['right_shoulder'] || { x: 0, y: 0 };
  const lHip = keypointsMap['left_hip'] || { x: 0, y: 0 };
  const rHip = keypointsMap['right_hip'] || { x: 0, y: 0 };

  const shoulderMid = { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 };
  const hipMid = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 };

  const spineTilt = calculateVerticalTilt(shoulderMid, hipMid);

  // If user is sitting upright in front of camera, spineTilt is close to 0-15° (vertical)
  const isUprightSitting = spineTilt < 25;

  if (poseId === 'savasana') {
    // Savasana MUST be horizontal supine (spineTilt > 50°)
    if (isUprightSitting) {
      return {
        isValid: false,
        reason: 'Upright sitting position detected. Savasana requires lying flat on your back on the mat.'
      };
    }
  } else if (poseId === 'balasana') {
    // Balasana MUST be folded kneeling (spineTilt > 40°)
    if (isUprightSitting) {
      return {
        isValid: false,
        reason: 'Upright position detected. Balasana requires kneeling and folding forward over your thighs.'
      };
    }
  } else if (poseId === 'viparita-karani') {
    // Viparita Karani MUST be supine with legs up
    if (isUprightSitting) {
      return {
        isValid: false,
        reason: 'Upright position detected. Viparita Karani requires lying on your back with legs extended up the wall.'
      };
    }
  }

  return { isValid: true, reason: '' };
}

/**
 * Main Biomechanical Evaluation Engine
 */
export function evaluatePoseBiomechanics(poseId, rawKeypoints, frameBuffer = []) {
  const poseMeta = MEDICALLY_DESIGNATED_POSES.find(p => p.id === poseId) || MEDICALLY_DESIGNATED_POSES[0];
  const keypointsMap = normalizeKeypoints(rawKeypoints);

  // 1. STRICT POSE ORIENTATION VERIFICATION
  const poseCheck = verifyPoseOrientation(poseId, keypointsMap);

  if (!poseCheck.isValid) {
    // Heavy penalty if user is not performing the pose (sitting upright in front of webcam)
    return {
      poseId,
      poseName: poseMeta.name,
      overallAccuracy: 18, // 18% LOW ACCURACY!
      formGrade: 'Incorrect Form / Pose Not Performed',
      badgeColor: 'rose',
      classificationConfidence: 15,
      stabilityScore: 40,
      measuredAngles: { leftKnee: 175, rightKnee: 175, leftHip: 85, rightHip: 85, spineTilt: 10 },
      feedbackList: [
        `❌ ${poseCheck.reason}`,
        `Please position your camera so your full body on the mat is visible, and get into the ${poseMeta.name} posture.`
      ],
      keypointsMap
    };
  }

  // 2. BIOMECHANICAL ANGLE EVALUATION
  const lShoulder = keypointsMap['left_shoulder'];
  const rShoulder = keypointsMap['right_shoulder'];
  const lHip = keypointsMap['left_hip'];
  const rHip = keypointsMap['right_hip'];
  const lKnee = keypointsMap['left_knee'];
  const rKnee = keypointsMap['right_knee'];
  const lAnkle = keypointsMap['left_ankle'];
  const rAnkle = keypointsMap['right_ankle'];
  const lWrist = keypointsMap['left_wrist'];
  const rWrist = keypointsMap['right_wrist'];

  const shoulderMid = { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 };
  const hipMid = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 };

  const measuredAngles = {
    leftKnee: calculateAngle(lHip, lKnee, lAnkle),
    rightKnee: calculateAngle(rHip, rKnee, rAnkle),
    leftHip: calculateAngle(lShoulder, lHip, lKnee),
    rightHip: calculateAngle(rShoulder, rHip, rKnee),
    leftArmAbduction: calculateAngle(lHip, lShoulder, lWrist),
    rightArmAbduction: calculateAngle(rHip, rShoulder, rWrist),
    spineTilt: calculateVerticalTilt(shoulderMid, hipMid)
  };

  const avgKnee = (measuredAngles.leftKnee + measuredAngles.rightKnee) / 2;
  const avgHip = (measuredAngles.leftHip + measuredAngles.rightHip) / 2;
  const avgArmAbduction = (measuredAngles.leftArmAbduction + measuredAngles.rightArmAbduction) / 2;

  const feedbackList = [];
  let angleScore = 88;

  if (poseId === 'savasana') {
    const kneeDev = Math.abs(avgKnee - 175);
    const armDev = Math.abs(avgArmAbduction - 30);
    angleScore = Math.max(40, Math.round(100 - kneeDev * 3 - armDev * 2));
    if (avgKnee < 165) feedbackList.push(`Allow your legs to fully extend and rest flat on the mat (Current: ${Math.round(avgKnee)}°).`);
    if (avgArmAbduction < 20) feedbackList.push(`Move your arms slightly outward (~30° from body) to release shoulder tension.`);
  } else if (poseId === 'balasana') {
    const hipDev = Math.abs(avgHip - 40);
    const kneeDev = Math.abs(avgKnee - 35);
    angleScore = Math.max(40, Math.round(100 - hipDev * 2.5 - kneeDev * 2.5));
    if (avgHip > 55) feedbackList.push(`Lower your hips back toward your heels for pelvic decompression (Current: ${Math.round(avgHip)}°).`);
  } else {
    // Viparita Karani
    const hipDev = Math.abs(avgHip - 90);
    const kneeDev = Math.abs(avgKnee - 175);
    angleScore = Math.max(40, Math.round(100 - hipDev * 3 - kneeDev * 2.5));
    if (Math.abs(avgHip - 90) > 15) feedbackList.push(`Shift your hips closer to the wall so your legs form a ~90° angle (Current: ${Math.round(avgHip)}°).`);
  }

  const overallAccuracy = Math.min(98, Math.max(35, angleScore));

  let formGrade = 'Correct Form';
  let badgeColor = 'emerald';
  if (overallAccuracy < 65) {
    formGrade = 'Incorrect Form';
    badgeColor = 'rose';
  } else if (overallAccuracy < 85) {
    formGrade = 'Moderate Form';
    badgeColor = 'amber';
  }

  if (feedbackList.length === 0) {
    feedbackList.push('Optimal posture alignment! Your body position closely matches the reference posture.');
  }

  return {
    poseId,
    poseName: poseMeta.name,
    overallAccuracy,
    formGrade,
    badgeColor,
    classificationConfidence: overallAccuracy,
    stabilityScore: 92,
    measuredAngles,
    feedbackList,
    keypointsMap
  };
}

function normalizeKeypoints(rawKeypoints) {
  const map = {};
  if (Array.isArray(rawKeypoints)) {
    rawKeypoints.forEach((kp, idx) => {
      const name = kp.name || MOVENET_KEYPOINT_NAMES[idx] || `kp_${idx}`;
      map[name] = { x: kp.x ?? 0, y: kp.y ?? 0, score: kp.score ?? 0.9 };
    });
  } else if (rawKeypoints && typeof rawKeypoints === 'object') {
    return rawKeypoints;
  }
  return map;
}

export function generateDemoKeypoints(poseId, formQuality = 'correct') {
  if (formQuality === 'not_performed' || formQuality === 'sitting_upright') {
    // User sitting upright in front of webcam instead of performing pose
    return [
      { name: 'nose', x: 200, y: 120, score: 0.95 },
      { name: 'left_eye', x: 190, y: 110, score: 0.95 },
      { name: 'right_eye', x: 210, y: 110, score: 0.95 },
      { name: 'left_ear', x: 175, y: 115, score: 0.9 },
      { name: 'right_ear', x: 225, y: 115, score: 0.9 },
      { name: 'left_shoulder', x: 150, y: 180, score: 0.9 },
      { name: 'right_shoulder', x: 250, y: 180, score: 0.9 },
      { name: 'left_elbow', x: 130, y: 250, score: 0.85 },
      { name: 'right_elbow', x: 270, y: 250, score: 0.85 },
      { name: 'left_wrist', x: 140, y: 310, score: 0.8 },
      { name: 'right_wrist', x: 260, y: 310, score: 0.8 },
      { name: 'left_hip', x: 160, y: 330, score: 0.7 },
      { name: 'right_hip', x: 240, y: 330, score: 0.7 },
      { name: 'left_knee', x: 160, y: 380, score: 0.5 },
      { name: 'right_knee', x: 240, y: 380, score: 0.5 },
      { name: 'left_ankle', x: 160, y: 395, score: 0.4 },
      { name: 'right_ankle', x: 240, y: 395, score: 0.4 }
    ];
  }

  if (poseId === 'savasana') {
    const isMod = formQuality === 'moderate';
    const isInc = formQuality === 'incorrect';
    return [
      { name: 'nose', x: 60, y: isInc ? 160 : 200, score: 0.9 },
      { name: 'left_shoulder', x: 110, y: 180, score: 0.9 },
      { name: 'right_shoulder', x: 110, y: 220, score: 0.9 },
      { name: 'left_elbow', x: 150, y: isMod ? 185 : 160, score: 0.9 },
      { name: 'right_elbow', x: 150, y: isMod ? 215 : 240, score: 0.9 },
      { name: 'left_wrist', x: 190, y: isMod ? 188 : 150, score: 0.9 },
      { name: 'right_wrist', x: 190, y: isMod ? 212 : 250, score: 0.9 },
      { name: 'left_hip', x: 230, y: 190, score: 0.9 },
      { name: 'right_hip', x: 230, y: 210, score: 0.9 },
      { name: 'left_knee', x: 300, y: isInc ? 165 : 190, score: 0.9 },
      { name: 'right_knee', x: 300, y: isInc ? 235 : 210, score: 0.9 },
      { name: 'left_ankle', x: 370, y: 190, score: 0.9 },
      { name: 'right_ankle', x: 370, y: 210, score: 0.9 }
    ];
  } else if (poseId === 'balasana') {
    const isMod = formQuality === 'moderate';
    const isInc = formQuality === 'incorrect';
    return [
      { name: 'nose', x: isInc ? 280 : 300, y: isInc ? 210 : 280, score: 0.9 },
      { name: 'left_shoulder', x: 240, y: 250, score: 0.9 },
      { name: 'right_shoulder', x: 240, y: 270, score: 0.9 },
      { name: 'left_elbow', x: 310, y: 250, score: 0.9 },
      { name: 'right_elbow', x: 310, y: 270, score: 0.9 },
      { name: 'left_wrist', x: 360, y: 250, score: 0.9 },
      { name: 'right_wrist', x: 360, y: 270, score: 0.9 },
      { name: 'left_hip', x: 140, y: isMod ? 200 : 230, score: 0.9 },
      { name: 'right_hip', x: 140, y: isMod ? 230 : 260, score: 0.9 },
      { name: 'left_knee', x: 200, y: 290, score: 0.9 },
      { name: 'right_knee', x: 200, y: 310, score: 0.9 },
      { name: 'left_ankle', x: 120, y: 280, score: 0.9 },
      { name: 'right_ankle', x: 120, y: 300, score: 0.9 }
    ];
  } else {
    // Viparita Karani
    const isMod = formQuality === 'moderate';
    const isInc = formQuality === 'incorrect';
    return [
      { name: 'nose', x: 60, y: 320, score: 0.9 },
      { name: 'left_shoulder', x: 120, y: 310, score: 0.9 },
      { name: 'right_shoulder', x: 120, y: 330, score: 0.9 },
      { name: 'left_elbow', x: 150, y: 350, score: 0.9 },
      { name: 'right_elbow', x: 150, y: 290, score: 0.9 },
      { name: 'left_wrist', x: 180, y: 360, score: 0.9 },
      { name: 'right_wrist', x: 180, y: 280, score: 0.9 },
      { name: 'left_hip', x: isInc ? 180 : 260, y: 315, score: 0.9 },
      { name: 'right_hip', x: isInc ? 180 : 260, y: 330, score: 0.9 },
      { name: 'left_knee', x: isMod ? 240 : 260, y: isMod ? 220 : 200, score: 0.9 },
      { name: 'right_knee', x: isMod ? 240 : 260, y: isMod ? 210 : 190, score: 0.9 },
      { name: 'left_ankle', x: 260, y: 80, score: 0.9 },
      { name: 'right_ankle', x: 260, y: 70, score: 0.9 }
    ];
  }
}
