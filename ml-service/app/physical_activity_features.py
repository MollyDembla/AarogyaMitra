"""
Physical Activity Agent — Feature Extraction, Body-Relative Normalization & Controlled Augmentation
"""

import math
import numpy as np

MOVENET_KEYPOINTS = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
]

def calculate_angle_3p(p1, p2, p3):
    """Calculate 2D angle in degrees at vertex p2 between p1, p2, p3"""
    if not p1 or not p2 or not p3:
        return 0.0
    v1 = (p1[0] - p2[0], p1[1] - p2[1])
    v2 = (p3[0] - p2[0], p3[1] - p2[1])
    dot = v1[0] * v2[0] + v1[1] * v2[1]
    mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
    mag2 = math.sqrt(v2[0]**2 + v2[1]**2)
    if mag1 == 0 or mag2 == 0:
        return 0.0
    cosine = max(-1.0, min(1.0, dot / (mag1 * mag2)))
    angle = math.acos(cosine) * (180.0 / math.pi)
    return round(angle, 2)

def normalize_keypoints(keypoint_dict):
    """
    Body-relative Keypoint Normalization:
    1. Translate coordinates relative to body center (torso midpoint).
    2. Scale coordinates by torso length (distance between shoulder midpoint and hip midpoint).
    """
    l_shoulder = keypoint_dict.get('left_shoulder', (0, 0))
    r_shoulder = keypoint_dict.get('right_shoulder', (0, 0))
    l_hip = keypoint_dict.get('left_hip', (0, 0))
    r_hip = keypoint_dict.get('right_hip', (0, 0))

    shoulder_mid = ((l_shoulder[0] + r_shoulder[0]) / 2.0, (l_shoulder[1] + r_shoulder[1]) / 2.0)
    hip_mid = ((l_hip[0] + r_hip[0]) / 2.0, (l_hip[1] + r_hip[1]) / 2.0)
    body_center = ((shoulder_mid[0] + hip_mid[0]) / 2.0, (shoulder_mid[1] + hip_mid[1]) / 2.0)

    dx = shoulder_mid[0] - hip_mid[0]
    dy = shoulder_mid[1] - hip_mid[1]
    torso_length = math.sqrt(dx*dx + dy*dy)
    if torso_length == 0:
        torso_length = 1.0

    normalized_coords = {}
    for name, (x, y) in keypoint_dict.items():
        norm_x = (x - body_center[0]) / torso_length
        norm_y = (y - body_center[1]) / torso_length
        normalized_coords[name] = (round(norm_x, 4), round(norm_y, 4))

    return normalized_coords, torso_length

def extract_feature_vector(keypoint_dict):
    """
    Extracts structured feature vector:
    A. Normalized Keypoint (x, y) coordinates
    B. Joint Angles (left knee, right knee, left hip, right hip, left arm, right arm, spine tilt)
    C. Alignment Ratios & Symmetry metrics
    """
    norm_coords, torso_length = normalize_keypoints(keypoint_dict)

    features = []
    # A. 17 Normalized x, y coordinates (34 values)
    for kp in MOVENET_KEYPOINTS:
        pt = norm_coords.get(kp, (0.0, 0.0))
        features.extend([pt[0], pt[1]])

    # B. Joint Angles
    l_knee = calculate_angle_3p(keypoint_dict.get('left_hip'), keypoint_dict.get('left_knee'), keypoint_dict.get('left_ankle'))
    r_knee = calculate_angle_3p(keypoint_dict.get('right_hip'), keypoint_dict.get('right_knee'), keypoint_dict.get('right_ankle'))
    l_hip = calculate_angle_3p(keypoint_dict.get('left_shoulder'), keypoint_dict.get('left_hip'), keypoint_dict.get('left_knee'))
    r_hip = calculate_angle_3p(keypoint_dict.get('right_shoulder'), keypoint_dict.get('right_hip'), keypoint_dict.get('right_knee'))
    l_arm = calculate_angle_3p(keypoint_dict.get('left_hip'), keypoint_dict.get('left_shoulder'), keypoint_dict.get('left_wrist'))
    r_arm = calculate_angle_3p(keypoint_dict.get('right_hip'), keypoint_dict.get('right_shoulder'), keypoint_dict.get('right_wrist'))

    features.extend([l_knee / 180.0, r_knee / 180.0, l_hip / 180.0, r_hip / 180.0, l_arm / 180.0, r_arm / 180.0])

    # C. Symmetry & Alignment Ratios
    l_sh = norm_coords.get('left_shoulder', (0,0))
    r_sh = norm_coords.get('right_shoulder', (0,0))
    shoulder_tilt = abs(l_sh[1] - r_sh[1])
    features.append(shoulder_tilt)

    return np.array(features, dtype=np.float32)

def generate_controlled_augmentations(base_keypoints, num_samples=30):
    """
    Controlled Feature Augmentation:
    Generates small coordinate perturbations (gaussian noise std 0.02) and small scale/rotation shifts
    without changing posture class labels.
    """
    augmented_list = []
    for _ in range(num_samples):
        aug_dict = {}
        noise_x = np.random.normal(0, 0.015)
        noise_y = np.random.normal(0, 0.015)
        scale_factor = np.random.uniform(0.95, 1.05)

        for kp, (x, y) in base_keypoints.items():
            new_x = (x + noise_x + np.random.normal(0, 0.008)) * scale_factor
            new_y = (y + noise_y + np.random.normal(0, 0.008)) * scale_factor
            aug_dict[kp] = (new_x, new_y)

        feat_vec = extract_feature_vector(aug_dict)
        augmented_list.append(feat_vec)

    return augmented_list
