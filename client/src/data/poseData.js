/**
 * Medically Designated Poses Reference Data & Visual Benchmarks
 * 1. Savasana (Corpse Pose)
 * 2. Balasana (Child's Pose)
 * 3. Viparita Karani (Legs-Up-The-Wall Pose)
 */

export const MEDICALLY_DESIGNATED_POSES = [
  {
    id: 'savasana',
    name: 'Savasana (Corpse Pose)',
    sanskritName: 'Savasana',
    category: 'Restorative Supine Deactivation',
    medicalObjective: 'Evaluates complete neuromuscular relaxation, symmetrical supine alignment, and parasympathetic nervous system recovery.',
    targetAngles: {
      legExtension: { min: 170, max: 180, ideal: 175, label: 'Leg Extension Angle' },
      armAbduction: { min: 20, max: 45, ideal: 30, label: 'Arm-Torso Abduction Angle' },
      spineFlatness: { min: 0, max: 5, ideal: 2, label: 'Supine Spinal Neutral Alignment' },
      neckElevation: { min: 0, max: 8, ideal: 3, label: 'Cervical Neck Angle' }
    },
    referenceForms: {
      correct: {
        title: 'Correct Form (Optimal Alignment)',
        badgeColor: 'emerald',
        description: 'Body rests fully supine on the mat. Legs are comfortably extended with feet naturally relaxed outward. Arms rest 30° away from the torso with palms facing up, allowing shoulder blades to drop down.',
        keypoints: [
          'Limbs fully supported & supine (175°–180° leg extension)',
          'Arms abducted 25°–45° from torso with palms up',
          'Neutral cervical spine without excessive head prop',
          'Symmetrical left/right shoulder and hip balance'
        ],
        svgType: 'savasana-correct'
      },
      moderate: {
        title: 'Moderate Form (Minor Misalignment)',
        badgeColor: 'amber',
        description: 'Arms are pressed tightly against the sides of the torso, feet are held stiffly upright, or slight tension remains in the shoulders and jaw.',
        keypoints: [
          'Arms constrained too close to body (<15° abduction)',
          'Feet held rigid rather than flopped outward',
          'Slight elevation of shoulder blades off mat',
          'Incomplete muscle deactivation'
        ],
        svgType: 'savasana-moderate'
      },
      incorrect: {
        title: 'Incorrect Form (High Risk / Strain)',
        badgeColor: 'rose',
        description: 'Head is propped up too high causing anterior neck compression, knees are flexed high creating hip flexor tension, or spine is hyper-arched off the floor.',
        keypoints: [
          'Cervical spine hyper-flexion (head propped >12° high)',
          'Knees flexed high (>35° knee angle) creating lumbar arch',
          'Tense shoulders shrugged toward ears',
          'Asymmetrical spine distortion on mat'
        ],
        svgType: 'savasana-incorrect'
      }
    }
  },
  {
    id: 'balasana',
    name: 'Balasana (Child\'s Pose)',
    sanskritName: 'Balasana',
    category: 'Spinal Flexion & Hip Decompresssion',
    medicalObjective: 'Evaluates spinal paraspinal muscle lengthening, hip flexion mobility, and shoulder girdle relaxation.',
    targetAngles: {
      hipFoldAngle: { min: 30, max: 55, ideal: 40, label: 'Hip-Pelvis Flexion Angle' },
      kneeFlexAngle: { min: 25, max: 50, ideal: 35, label: 'Knee Flexion Angle' },
      armExtensionAngle: { min: 145, max: 180, ideal: 165, label: 'Shoulder Flexion / Reach' },
      spineCurvature: { min: 140, max: 170, ideal: 155, label: 'Spinal Arc Neutrality' }
    },
    referenceForms: {
      correct: {
        title: 'Correct Form (Optimal Alignment)',
        badgeColor: 'emerald',
        description: 'Knees are comfortably spread, hips rest back toward heels, and forehead rests gently on the mat. Arms reach forward with soft elbows or rest alongside torso.',
        keypoints: [
          'Hips grounded near heels (pelvic flex 35°–45°)',
          'Forehead supported comfortably on mat',
          'Long, decompressed paraspinal muscle lengthening',
          'Relaxed shoulder blades without strain'
        ],
        svgType: 'balasana-correct'
      },
      moderate: {
        title: 'Moderate Form (Minor Misalignment)',
        badgeColor: 'amber',
        description: 'Hips remain elevated 10–15cm away from heels due to tight hip flexors/quads, or elbows are stiffly locked.',
        keypoints: [
          'Hips floating 10–15cm above heels',
          'Elbows hyper-extended or shoulders elevated',
          'Torso un-rested on thighs',
          'Mild neck rotation to side'
        ],
        svgType: 'balasana-moderate'
      },
      incorrect: {
        title: 'Incorrect Form (High Risk / Strain)',
        badgeColor: 'rose',
        description: 'Head hangs in mid-air unsupported causing cervical spine strain, severe knee joint pinch, or rounded upper back thoracic hunching.',
        keypoints: [
          'Head hanging unsupported in mid-air',
          'Extreme strain on knee joints without prop',
          'Hunched upper back kyphosis with restricted breath',
          'Hips completely lifted high in air'
        ],
        svgType: 'balasana-incorrect'
      }
    }
  },
  {
    id: 'viparita-karani',
    name: 'Viparita Karani (Legs-Up-The-Wall)',
    sanskritName: 'Viparita Karani',
    category: 'Inverted Venous Return & Leg Recovery',
    medicalObjective: 'Assesses venous blood flow return, hamstring flexibility, sacral grounding, and parasympathetic tone.',
    targetAngles: {
      hipWallAngle: { min: 80, max: 95, ideal: 90, label: 'Hip-Leg Vertical Angle' },
      kneeExtension: { min: 165, max: 180, ideal: 175, label: 'Knee Extension Up Wall' },
      sacralContact: { min: 0, max: 5, ideal: 1, label: 'Sacrum Wall Proximity' },
      spineFlatness: { min: 0, max: 5, ideal: 2, label: 'Torso Mat Contact' }
    },
    referenceForms: {
      correct: {
        title: 'Correct Form (Optimal Alignment)',
        badgeColor: 'emerald',
        description: 'Sitting bones and sacrum are flush against or near the wall. Legs extend vertically up the wall with soft knees. Torso rests flat and supported on the mat.',
        keypoints: [
          'Hips/sacrum flush against wall (85°–90° angle)',
          'Legs vertically extended up wall (170°–180°)',
          'Spine flat and grounded on floor',
          'Arms resting in T-shape or open palms'
        ],
        svgType: 'viparita-correct'
      },
      moderate: {
        title: 'Moderate Form (Minor Misalignment)',
        badgeColor: 'amber',
        description: 'Hips are 10–15cm away from wall due to tight hamstrings, or knees are moderately bent.',
        keypoints: [
          'Hips spaced 10–15cm away from wall',
          'Knees bent at 145°–160° angle',
          'Mild hamstring tension',
          'Arms resting close to hips'
        ],
        svgType: 'viparita-moderate'
      },
      incorrect: {
        title: 'Incorrect Form (High Risk / Strain)',
        badgeColor: 'rose',
        description: 'Large gap between hips and wall (>25cm), lower lumbar spine hyper-arched off floor, or legs tilting sideways dangerously.',
        keypoints: [
          'Severe hip gap (>25cm away from wall)',
          'Lower back arched high off floor without support',
          'Legs crooked or collapsing sideways',
          'Neck compressed or strained'
        ],
        svgType: 'viparita-incorrect'
      }
    }
  }
];
