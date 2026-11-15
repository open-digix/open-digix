"""Regenerate self-contained SVGs and PNG exports: python docs/branding/generate.py.

Requires rsvg-convert (librsvg). No network or third-party Python packages.
"""

from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
NAVY, TEAL, PAPER = "#112B45", "#0D9488", "#F6F8FA"


def mark(option, primary=NAVY, accent=TEAL):
    if option == "a":
        # Four independent components form an X; the diamond remains open.
        shapes = [
            ("M136 120H200L240 200V232H208L136 160Z", primary),
            ("M376 120V184L296 240H264V208L336 120Z", accent),
            ("M376 392H312L272 312V280H304L376 352Z", primary),
            ("M136 392V328L216 272H248V304L176 392Z", primary),
        ]
        return ''.join(f'<path d="{d}" fill="{c}"/>' for d, c in shapes)
    if option == "b":
        return (
            f'<path d="M152 144H248C322 144 368 188 368 256S322 368 248 368H152" '
            f'fill="none" stroke="{primary}" stroke-width="48" stroke-linejoin="round"/>'
            f'<path d="M152 256H272M240 224L272 256L240 288" fill="none" '
            f'stroke="{accent}" stroke-width="32" stroke-linecap="square" stroke-linejoin="miter"/>'
        )
    return (
        f'<path fill-rule="evenodd" d="M144 192L256 128L368 192L256 256Z M224 192L256 174L288 192L256 210Z" fill="{accent}"/>'
        f'<path d="M144 240L256 304L368 240V280L256 344L144 280Z" fill="{primary}"/>'
        f'<path d="M144 320L256 384L368 320V360L256 424L144 360Z" fill="{primary}"/>'
    )


def svg(body, view="0 0 512 512", title="DigiX Lab"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" role="img">'
            f'<title>{title}</title>{body}</svg>\n')


# Outline lettering avoids machine-dependent font substitution in exported logos.
LETTERS = {
    "D": '<path fill-rule="evenodd" d="M0 0H30C65 0 82 21 82 50S65 100 30 100H0ZM20 18V82H29C51 82 62 70 62 50S51 18 29 18Z"/>',
    "i": '<path d="M0 30H19V100H0Z"/><circle cx="9.5" cy="10" r="11"/>',
    "g": '<path fill-rule="evenodd" d="M52 30H71V94C71 121 54 134 30 134H8V116H29C45 116 52 109 52 96V94C46 99 39 102 30 102C10 102 0 87 0 66S12 28 32 28C41 28 47 31 52 36ZM36 46C25 46 19 53 19 66S25 85 36 85S53 78 53 66S47 46 36 46Z"/>',
    "X": '<path d="M0 0H24L44 33L64 0H88L56 49L90 100H66L44 65L22 100H-2L32 49Z"/>',
    "L": '<path d="M0 0H18V70H57V86H0Z"/>',
    "A": '<path fill-rule="evenodd" d="M0 86L30 0H51L81 86H62L56 67H25L19 86ZM30 51H51L40 19Z"/>',
    "B": '<path fill-rule="evenodd" d="M0 0H36C57 0 67 9 67 23C67 33 62 39 55 42C66 45 72 52 72 63C72 78 61 86 39 86H0ZM18 16V35H34C44 35 49 32 49 25S44 16 34 16ZM18 50V70H37C48 70 53 67 53 60S48 50 37 50Z"/>',
}


def wordmark(option, dark=False):
    primary, accent = ("#FFFFFF", "#2DD4BF") if dark else (NAVY, TEAL)
    text = ''
    for letter, x in [("D", 0), ("i", 99), ("g", 135), ("i", 225), ("X", 265)]:
        text += f'<g transform="translate({x} 0)" fill="{accent if letter == "X" else primary}">{LETTERS[letter]}</g>'
    lab = ''.join(f'<g transform="translate({x} 0)">{LETTERS[l]}</g>' for l, x in [("L", 0), ("A", 77), ("B", 173)])
    return svg(
        f'<g transform="translate(0 -25) scale(.64)">{mark(option, primary, accent)}</g>'
        f'<g transform="translate(330 85) scale(1.1)">{text}</g>'
        f'<g transform="translate(335 245) scale(.27)" fill="{primary}">{lab}</g>',
        "0 0 780 330", f"DigiX Lab — option {option.upper()} — wordmark")


def write(name, content):
    (ROOT / name).write_text(content, encoding="utf-8")


def export(source, target, width):
    subprocess.run(["rsvg-convert", "-w", str(width), "-o", str(ROOT / "export" / target), str(ROOT / source)], check=True)


def main():
    (ROOT / "export").mkdir(exist_ok=True)
    for option in "abc":
        prefix = f"digix-logo-icon-{option}"
        write(f"{prefix}.svg", svg(mark(option), title=f"DigiX Lab — option {option.upper()}"))
        write(f"{prefix}-mono.svg", svg(mark(option, NAVY, NAVY)))
        write(f"{prefix}-dark.svg", svg(mark(option, "#FFFFFF", "#2DD4BF")))
        write(f"digix-logo-wordmark-{option}.svg", wordmark(option))
        write(f"digix-logo-wordmark-{option}-dark.svg", wordmark(option, True))
        for size in (48, 192, 512, 1024):
            export(f"{prefix}.svg", f"icon-{option}-{size}.png", size)
        export(f"digix-logo-wordmark-{option}.svg", f"wordmark-{option}.png", 1560)
        export(f"digix-logo-wordmark-{option}-dark.svg", f"wordmark-{option}-dark.png", 1560)
    # A is a proposal, not an approved brand choice. Safe-zone radius < 204.8.
    write("digix-logo-wordmark.svg", wordmark("a"))
    write("digix-logo-adaptive-foreground.svg", svg(f'<g transform="translate(76.8 76.8) scale(.7)">{mark("a", "#FFFFFF", "#2DD4BF")}</g>'))
    write("digix-logo-maskable.svg", svg(f'<rect width="512" height="512" fill="{NAVY}"/><g transform="translate(76.8 76.8) scale(.7)">{mark("a", "#FFFFFF", "#2DD4BF")}</g>'))
    export("digix-logo-maskable.svg", "icon-a-maskable-512.png", 512)
    export("digix-logo-adaptive-foreground.svg", "icon-a-foreground-1024.png", 1024)
    export("digix-logo-wordmark.svg", "wordmark.png", 1560)


if __name__ == "__main__":
    main()
