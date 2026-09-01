from PIL import Image, ImageDraw, ImageFont
import math
import os

def create_balasana_image():
    # 800 x 600 canvas matching savasana style
    width, height = 800, 600
    img = Image.new('RGB', (width, height), color='#fdfbf7')
    draw = ImageDraw.Draw(img)

    # Background Room & Window Warm Gradient
    for y in range(0, 420):
        r = int(253 - (y / 420.0) * 15)
        g = int(245 - (y / 420.0) * 15)
        b = int(235 - (y / 420.0) * 15)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Window
    draw.rectangle([50, 40, 260, 320], fill='#ffffff', outline='#e2e8f0', width=4)
    draw.line([(155, 40), (155, 320)], fill='#cbd5e1', width=3)
    draw.line([(50, 180), (260, 180)], fill='#cbd5e1', width=3)

    # Plant in window corner
    draw.ellipse([270, 240, 340, 360], fill='#059669')
    draw.ellipse([300, 210, 370, 330], fill='#10b981')
    draw.ellipse([250, 260, 310, 380], fill='#047857')

    # Wooden Floor
    for y in range(420, height):
        r = int(217 - ((y - 420) / 180.0) * 20)
        g = int(180 - ((y - 420) / 180.0) * 20)
        b = int(140 - ((y - 420) / 180.0) * 20)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    # Floor Planks
    for x in range(0, width, 120):
        draw.line([(x, 420), (x - 60, height)], fill='#a16207', width=2)

    # Teal Yoga Mat
    mat_coords = [(100, 440), (740, 440), (700, 560), (60, 560)]
    draw.polygon(mat_coords, fill='#0d9488', outline='#0f766e')

    # Figure: Balasana Child's Pose (Kneeling, hips on heels, torso folded forward, arms extended)
    # Skin tone: #e0a98b, Activewear: Teal Top #0f766e, Slate Pants #475569

    # Lower Legs & Shins flat on mat
    draw.line([(240, 500), (360, 500)], fill='#e0a98b', width=28) # Shins
    draw.ellipse([225, 485, 265, 515], fill='#e0a98b') # Feet

    # Thighs folded
    draw.line([(360, 500), (310, 455)], fill='#475569', width=38) # Thighs

    # Pelvic Hips resting back on heels
    draw.ellipse([280, 425, 350, 485], fill='#334155')

    # Torso folded forward over thighs
    draw.polygon([(320, 440), (480, 470), (470, 505), (310, 475)], fill='#0f766e')

    # Shoulders
    draw.ellipse([450, 455, 510, 515], fill='#0d9488')

    # Extended Arms reaching forward on mat
    draw.line([(480, 485), (630, 495)], fill='#e0a98b', width=20) # Arms
    draw.ellipse([620, 485, 650, 505], fill='#e0a98b') # Hands

    # Head grounded resting on mat
    draw.ellipse([490, 480, 545, 530], fill='#e0a98b') # Head
    draw.polygon([(480, 475), (510, 515), (460, 515)], fill='#1e293b') # Hair

    # Label Banner
    draw.rectangle([30, 30, 380, 75], fill='#0f766e')
    draw.text((45, 42), "BALASANA (CHILD'S POSE)", fill='#ffffff')

    return img

def create_viparita_karani_image():
    # 800 x 600 canvas
    width, height = 800, 600
    img = Image.new('RGB', (width, height), color='#fdfbf7')
    draw = ImageDraw.Draw(img)

    # Background Room & Window
    for y in range(0, 420):
        r = int(253 - (y / 420.0) * 15)
        g = int(245 - (y / 420.0) * 15)
        b = int(235 - (y / 420.0) * 15)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Vertical Wall on Right Side
    draw.rectangle([560, 0, 800, 420], fill='#f1f5f9', outline='#cbd5e1', width=3)
    draw.line([(560, 0), (560, 420)], fill='#94a3b8', width=4)

    # Window on Left
    draw.rectangle([50, 40, 240, 300], fill='#ffffff', outline='#e2e8f0', width=4)
    draw.line([(145, 40), (145, 300)], fill='#cbd5e1', width=3)
    draw.line([(50, 170), (240, 170)], fill='#cbd5e1', width=3)

    # Wooden Floor
    for y in range(420, height):
        r = int(217 - ((y - 420) / 180.0) * 20)
        g = int(180 - ((y - 420) / 180.0) * 20)
        b = int(140 - ((y - 420) / 180.0) * 20)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Teal Yoga Mat leading to wall
    mat_coords = [(80, 450), (580, 450), (580, 560), (40, 560)]
    draw.polygon(mat_coords, fill='#0d9488', outline='#0f766e')

    # Figure: Viparita Karani (Supine flat on back, hips against wall, legs straight up 90° against wall)
    # Head on Left, Hips at Wall (x=530), Legs 90° Vertical (y=160 to y=490)

    # Head flat on mat
    draw.ellipse([140, 480, 195, 530], fill='#e0a98b') # Head
    draw.ellipse([130, 480, 175, 525], fill='#1e293b') # Hair

    # Torso flat on mat
    draw.polygon([(190, 480), (520, 475), (520, 520), (190, 515)], fill='#0f766e')

    # Arms open in T-position
    draw.line([(280, 495), (280, 550)], fill='#e0a98b', width=18)
    draw.ellipse([270, 545, 290, 560], fill='#e0a98b')

    # Hips against wall
    draw.ellipse([490, 460, 555, 525], fill='#334155')

    # LEGS EXTENDED VERTICALLY UP 90° AGAINST WALL!
    draw.line([(540, 470), (540, 170)], fill='#475569', width=34) # Both legs straight up
    draw.ellipse([522, 150, 558, 180], fill='#e0a98b') # Feet at top

    # 90° Angle Alignment Marker
    draw.line([(500, 470), (540, 470)], fill='#f59e0b', width=4)
    draw.line([(540, 470), (540, 430)], fill='#f59e0b', width=4)
    draw.text((440, 430), "90° WALL ALIGNMENT", fill='#f59e0b')

    # Label Banner
    draw.rectangle([30, 30, 430, 75], fill='#0f766e')
    draw.text((45, 42), "VIPARITA KARANI (LEGS-UP-WALL)", fill='#ffffff')

    return img

if __name__ == '__main__':
    img_balasana = create_balasana_image()
    img_viparita = create_viparita_karani_image()

    paths_balasana = [
        'c:/Projects/AarogyaMitra/client/public/poses/balasana_reference.jpg',
        'c:/Projects/AarogyaMitra/client/src/assets/poses/balasana_correct.jpg',
        'c:/Projects/AarogyaMitra/ml-service/datasets/physical_activity/balasana/correct/balasana_correct.jpg'
    ]
    paths_viparita = [
        'c:/Projects/AarogyaMitra/client/public/poses/viparita_karani_reference.jpg',
        'c:/Projects/AarogyaMitra/client/src/assets/poses/viparita_karani_correct.jpg',
        'c:/Projects/AarogyaMitra/ml-service/datasets/physical_activity/viparita_karani/correct/viparita_karani_correct.jpg'
    ]

    for p in paths_balasana:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        img_balasana.save(p, quality=95)
        print(f"Saved Balasana reference image to {p}")

    for p in paths_viparita:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        img_viparita.save(p, quality=95)
        print(f"Saved Viparita Karani reference image to {p}")

    print("Reference image generation completed successfully!")
