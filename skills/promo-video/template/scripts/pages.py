"""Full-page PNGs -> scene images: sharp JPG (2x, height capped) + soft half-size copy for focus pulls.
Pages with "tall": N in video.config.json keep N px (2x) so e.g. a footer far down stays reachable."""
import glob, json, os
from PIL import Image, ImageFilter
Image.MAX_IMAGE_PIXELS = None  # our own screenshots, not untrusted input

MAX_H = 6400  # 3200 CSS px; taller JPGs only cost memory in the renderer
cfg = json.load(open("video.config.json"))
tall = {p["name"]: p["tall"] for p in cfg["pages"] if p.get("tall")}
for f in sorted(glob.glob("public/pages/*.png")):
    n = os.path.basename(f)[:-4]
    im = Image.open(f).convert("RGB")
    im = im.crop((0, 0, im.width, min(im.height, tall.get(n, MAX_H))))
    im.save(f"public/pages/{n}.jpg", quality=90)
    im.resize((im.width // 2, im.height // 2)).filter(ImageFilter.GaussianBlur(6)).save(f"public/pages/{n}_soft.jpg", quality=80)
    print(n, im.size)
