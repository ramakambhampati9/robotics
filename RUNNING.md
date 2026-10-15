# How to Run Mallflow Locally

## Prerequisites

- **Node.js** 18+ (for the browser version)
- **Python** 3.10+ (for the Pygame version, optional)

## Browser Version (Recommended)

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open in browser
# http://localhost:5173
```

### Production Build

```bash
npm run build
# Output: dist/index.html (single-file, self-contained)
```

### Preview Production Build

```bash
npm run preview
```

## Pygame Version (Standalone)

### Setup

```bash
# Create virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or: .venv\Scripts\activate  # Windows

# Install Pygame
pip install -r pygame_sim/requirements.txt
```

### Run

```bash
python pygame_sim/main.py
```

### Controls

| Key | Action |
|-----|--------|
| Space | Pause/resume |
| R | Reset scenario |
| S | Cycle speed (0.65x / 1x / 1.5x) |
| 1 | Toggle static risk overlay |
| 2 | Toggle dynamic risk overlay |
| 3 | Toggle human forecasts |
| 4 | Toggle fleet routes |
| + / - | Increase/decrease pedestrian density |
| Mouse click on robot | Focus/unfocus route |
| Mouse drag on slider | Adjust density or risk aversion |
| Escape | Quit |

## Troubleshooting

### "Cannot find module './App'"

Make sure `src/App.tsx` exists. Run `npm run build` to verify.

### Pygame not found

```bash
pip install pygame>=2.5.0
```

### Port already in use

```bash
npm run dev -- --port 3000
```

### Build fails

```bash
rm -rf node_modules dist
npm install
npm run build
```