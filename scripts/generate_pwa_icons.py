import os
from PIL import Image, ImageDraw, ImageFilter, ImageOps

def create_pwa_icons():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    logo_path = os.path.join(root, 'client', 'public', 'logo.png')
    icons_dir = os.path.join(root, 'client', 'public', 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    if not os.path.exists(logo_path):
        print(f"Error: {logo_path} not found")
        return

    orig_logo = Image.open(logo_path).convert('RGBA')

    # Brand Colors
    navy_bg = (15, 37, 75, 255)       # #0F254B GKA Authentic Deep Navy
    gold_accent = (214, 162, 29, 255)  # #D6A21D GKA Brand Gold

    # Make transparent version of logo if background is off-white (#f4-f6)
    # We create a clean transparent emblem
    logo_data = orig_logo.getdata()
    clean_emblem_data = []
    for item in logo_data:
        r, g, b, a = item
        # If it's near off-white background (#f0 - #ff), make transparent
        if r > 235 and g > 235 and b > 235:
            clean_emblem_data.append((255, 255, 255, 0))
        else:
            clean_emblem_data.append((r, g, b, a))

    emblem_transparent = Image.new('RGBA', orig_logo.size)
    emblem_transparent.putdata(clean_emblem_data)

    # Function to create an icon at given size
    def generate_icon(size, is_maskable=False, is_apple=False):
        # Base canvas
        canvas = Image.new('RGBA', (size, size), navy_bg)
        draw = ImageDraw.Draw(canvas)

        # Draw subtle gold border / geometric styling
        border_width = max(2, int(size * 0.015))
        padding_border = max(2, int(size * 0.02))
        
        if not is_maskable:
            # Elegant corner squircle or round rect frame for 'any' icons
            radius = int(size * 0.22) if not is_apple else int(size * 0.18)
            # Subtle gold inner ring
            ring_margin = max(4, int(size * 0.03))
            draw.rounded_rectangle(
                [ring_margin, ring_margin, size - ring_margin, size - ring_margin],
                radius=radius - ring_margin // 2,
                outline=gold_accent,
                width=border_width
            )

        # Scale emblem to fit safely
        # Safe zone for maskable icons is 80% diameter (60-70% size is optimal)
        if is_maskable:
            target_scale = 0.65
        else:
            target_scale = 0.72

        target_w = int(size * target_scale)
        target_h = int(target_w * (orig_logo.height / orig_logo.width))

        # Check if we should use transparent emblem or bordered white badge
        # In GKA brand, the white background with navy emblem is the original logo!
        # Putting a crisp rounded white/gold card for the logo creates high contrast readability
        badge_size = int(size * (0.68 if is_maskable else 0.76))
        bx = (size - badge_size) // 2
        by = (size - badge_size) // 2

        # Draw white circular or squircle badge
        badge_radius = int(badge_size * 0.26)
        draw.rounded_rectangle(
            [bx, by, bx + badge_size, by + badge_size],
            radius=badge_radius,
            fill=(255, 255, 255, 255),
            outline=gold_accent,
            width=max(1, int(size * 0.012))
        )

        # Place the original logo centered inside the badge
        logo_inside_w = int(badge_size * 0.86)
        logo_inside_h = int(logo_inside_w * (orig_logo.height / orig_logo.width))
        resized_logo = orig_logo.resize((logo_inside_w, logo_inside_h), Image.Resampling.LANCZOS)

        lx = (size - logo_inside_w) // 2
        ly = (size - logo_inside_h) // 2
        canvas.paste(resized_logo, (lx, ly), resized_logo if resized_logo.mode == 'RGBA' else None)

        return canvas

    # Generate required sizes
    targets = [
        ('icon-192.png', 192, False, False),
        ('icon-512.png', 512, False, False),
        ('icon-maskable-192.png', 192, True, False),
        ('icon-maskable-512.png', 512, True, False),
        ('apple-touch-icon.png', 180, False, True),
        ('icon-144.png', 144, False, False),
        ('icon-96.png', 96, False, False),
        ('icon-72.png', 72, False, False),
        ('icon-48.png', 48, False, False),
        ('favicon-32x32.png', 32, False, False),
        ('favicon-16x16.png', 16, False, False),
    ]

    for filename, size, maskable, apple in targets:
        out_img = generate_icon(size, is_maskable=maskable, is_apple=apple)
        out_path = os.path.join(icons_dir, filename)
        out_img.save(out_path, format='PNG', optimize=True)
        print(f"Generated: {out_path} ({size}x{size})")

    # Also save apple-touch-icon.png and favicon.ico in client/public root
    apple_root = os.path.join(root, 'client', 'public', 'apple-touch-icon.png')
    generate_icon(180, False, True).save(apple_root, format='PNG', optimize=True)
    print(f"Generated root Apple touch icon: {apple_root}")

    # Also generate icon-192.png and icon-512.png at client/public root if needed
    generate_icon(192, False, False).save(os.path.join(root, 'client', 'public', 'icon-192.png'), 'PNG')
    generate_icon(512, False, False).save(os.path.join(root, 'client', 'public', 'icon-512.png'), 'PNG')

    print("All PWA icons generated successfully!")

if __name__ == '__main__':
    create_pwa_icons()
