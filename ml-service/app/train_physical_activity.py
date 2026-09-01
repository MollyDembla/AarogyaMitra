"""
Physical Activity Agent — Training Pipeline for Pose-Specific Classifiers
(Savasana, Balasana, Viparita Karani)
"""

import os
import joblib
import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from physical_activity_features import extract_feature_vector, generate_controlled_augmentations

POSES = ['savasana', 'balasana', 'viparita_karani']
CLASSES = ['correct', 'moderate', 'incorrect']

# Reference synthetic coordinate templates for MoveNet 17 keypoints per pose and class
DEMO_KEYPOINT_TEMPLATES = {
    'savasana': {
        'correct': {'nose': (60, 200), 'left_shoulder': (110, 180), 'right_shoulder': (110, 220), 'left_elbow': (150, 160), 'right_elbow': (150, 240), 'left_wrist': (190, 150), 'right_wrist': (190, 250), 'left_hip': (230, 190), 'right_hip': (230, 210), 'left_knee': (300, 190), 'right_knee': (300, 210), 'left_ankle': (370, 190), 'right_ankle': (370, 210)},
        'moderate': {'nose': (60, 200), 'left_shoulder': (110, 180), 'right_shoulder': (110, 220), 'left_elbow': (150, 185), 'right_elbow': (150, 215), 'left_wrist': (190, 188), 'right_wrist': (190, 212), 'left_hip': (230, 190), 'right_hip': (230, 210), 'left_knee': (300, 190), 'right_knee': (300, 210), 'left_ankle': (370, 190), 'right_ankle': (370, 210)},
        'incorrect': {'nose': (60, 160), 'left_shoulder': (110, 180), 'right_shoulder': (110, 220), 'left_elbow': (150, 160), 'right_elbow': (150, 240), 'left_wrist': (190, 150), 'right_wrist': (190, 250), 'left_hip': (230, 190), 'right_hip': (230, 210), 'left_knee': (300, 165), 'right_knee': (300, 235), 'left_ankle': (370, 190), 'right_ankle': (370, 210)}
    },
    'balasana': {
        'correct': {'nose': (300, 280), 'left_shoulder': (240, 250), 'right_shoulder': (240, 270), 'left_elbow': (310, 250), 'right_elbow': (310, 270), 'left_wrist': (360, 250), 'right_wrist': (360, 270), 'left_hip': (140, 230), 'right_hip': (140, 260), 'left_knee': (200, 290), 'right_knee': (200, 310), 'left_ankle': (120, 280), 'right_ankle': (120, 300)},
        'moderate': {'nose': (290, 260), 'left_shoulder': (230, 240), 'right_shoulder': (230, 260), 'left_elbow': (290, 240), 'right_elbow': (290, 260), 'left_wrist': (340, 240), 'right_wrist': (340, 260), 'left_hip': (140, 200), 'right_hip': (140, 230), 'left_knee': (200, 290), 'right_knee': (200, 310), 'left_ankle': (120, 280), 'right_ankle': (120, 300)},
        'incorrect': {'nose': (280, 210), 'left_shoulder': (220, 230), 'right_shoulder': (220, 250), 'left_elbow': (270, 230), 'right_elbow': (270, 250), 'left_wrist': (310, 230), 'right_wrist': (310, 250), 'left_hip': (140, 160), 'right_hip': (140, 190), 'left_knee': (200, 290), 'right_knee': (200, 310), 'left_ankle': (120, 280), 'right_ankle': (120, 300)}
    },
    'viparita_karani': {
        'correct': {'nose': (60, 320), 'left_shoulder': (120, 310), 'right_shoulder': (120, 330), 'left_elbow': (150, 350), 'right_elbow': (150, 290), 'left_wrist': (180, 360), 'right_wrist': (180, 280), 'left_hip': (260, 315), 'right_hip': (260, 330), 'left_knee': (260, 200), 'right_knee': (260, 190), 'left_ankle': (260, 80), 'right_ankle': (260, 70)},
        'moderate': {'nose': (60, 320), 'left_shoulder': (120, 310), 'right_shoulder': (120, 330), 'left_elbow': (150, 350), 'right_elbow': (150, 290), 'left_wrist': (180, 360), 'right_wrist': (180, 280), 'left_hip': (230, 315), 'right_hip': (230, 330), 'left_knee': (240, 220), 'right_knee': (240, 210), 'left_ankle': (260, 110), 'right_ankle': (260, 100)},
        'incorrect': {'nose': (60, 320), 'left_shoulder': (120, 310), 'right_shoulder': (120, 330), 'left_elbow': (150, 350), 'right_elbow': (150, 290), 'left_wrist': (180, 360), 'right_wrist': (180, 280), 'left_hip': (180, 315), 'right_hip': (180, 330), 'left_knee': (200, 240), 'right_knee': (200, 230), 'left_ankle': (240, 140), 'right_ankle': (240, 130)}
    }
}

def train_pose_models():
    output_dir = os.path.join(os.path.dirname(__file__), 'models', 'physical_activity')
    os.makedirs(output_dir, exist_ok=True)

    print("============================================================")
    print("Physical Activity Agent — Training Pose-Specific Classifiers")
    print("Dataset: 3 Poses x 3 Classes = 9 Prototype Source Images")
    print("============================================================")

    for pose in POSES:
        X = []
        y = []
        source_vectors = {}

        for cls_idx, cls_name in enumerate(CLASSES):
            template = DEMO_KEYPOINT_TEMPLATES[pose][cls_name]
            base_vec = extract_feature_vector(template)
            source_vectors[cls_name] = base_vec

            # Add source vector
            X.append(base_vec)
            y.append(cls_name)

            # Generate 40 controlled synthetic variations
            aug_vecs = generate_controlled_augmentations(template, num_samples=40)
            for vec in aug_vecs:
                X.append(vec)
                y.append(cls_name)

        X = np.array(X)
        y = np.array(y)

        # Train Prototype k-NN Classifier (k=3)
        clf = KNeighborsClassifier(n_neighbors=3, weights='distance')
        clf.fit(X, y)

        train_acc = clf.score(X, y) * 100.0

        model_path = os.path.join(output_dir, f"{pose}_model.joblib")
        joblib.dump({
            'model': clf,
            'pose': pose,
            'classes': CLASSES,
            'source_vectors': source_vectors,
            'feature_version': '1.0-body-relative'
        }, model_path)

        print(f"\n[MODEL GENERATED] {pose.upper()} -> {model_path}")
        print(f"  - Source Images: 3 ({CLASSES})")
        print(f"  - Augmented Samples: {len(X) - 3}")
        print(f"  - Training Accuracy: {train_acc:.1f}%")
        print(f"  - Model Note: Trained on 3 prototype source images; real-world accuracy subject to body framing.")

if __name__ == '__main__':
    train_pose_models()
