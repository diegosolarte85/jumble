# Graph-Based Co-Founder Matching UI

## Tech Stack Additions

- **react-force-graph** - Physics-based 2D graph visualization
- **framer-motion** - Smooth animations for sidebars, modals, and UI transitions
- **@floating-ui/react** - Tooltips and popovers for hover states

## Design System Foundation

### Color Palette (CSS Variables)

- **Dark Mode (Primary)**: Deep space blacks (#0a0a0f) with electric accent colors
- **Light Mode**: Clean whites with vibrant node colors
- **Node Colors**: Match score gradient (cold blue -> warm orange -> hot magenta)
- **Edge Colors**: Skill complementarity (cyan), Idea alignment (amber), Role match (violet)

### Typography

- **Headings**: Space Grotesk or JetBrains Mono for tech feel
- **Body**: Outfit or Geist for readability

## File Structure

```
app/
├── (auth)/
│   └── login/page.tsx          # Auth entry (placeholder)
├── graph/
│   └── page.tsx                # Main graph exploration view
├── components/
│   ├── graph/
│   │   ├── GraphCanvas.tsx     # React Force Graph wrapper
│   │   ├── UserNode.tsx        # Custom node rendering
│   │   ├── MatchEdge.tsx       # Edge styling logic
│   │   └── GraphControls.tsx   # Zoom/pan/reset controls
│   ├── sidebar/
│   │   ├── ProfileSidebar.tsx  # Profile detail panel
│   │   ├── SkillBadge.tsx      # Skill visualization
│   │   └── MatchReason.tsx     # "Why this match?" component
│   ├── filters/
│   │   └── FilterPanel.tsx     # Discovery filters
│   └── ui/
│       ├── Button.tsx          # Base button component
│       ├── Slider.tsx          # Filter sliders
│       └── ThemeToggle.tsx     # Light/dark mode
├── hooks/
│   ├── useGraphData.ts         # Fetch and transform match data
│   └── useTheme.ts             # Theme management
├── lib/
│   └── graph-utils.ts          # Node positioning, scoring helpers
└── globals.css                 # Design tokens, animations
```

## Key Implementation Details

### 1. GraphCanvas Component ([`app/components/graph/GraphCanvas.tsx`](app/components/graph/GraphCanvas.tsx))

- Wrap `react-force-graph-2d` with custom node/link rendering
- Current user node centered with distinct styling (larger, glowing border)
- Match nodes sized by experience/portfolio strength
- Node color intensity mapped to match score (0-100%)
- Force simulation: attract high matches, repel low scores
- Custom link particles for "connection strength" animation

### 2. Node Interactions

- **Hover**: Tooltip with name, top skill, match percentage
- **Click**: Open ProfileSidebar with animated slide-in
- **Drag**: Reposition nodes, physics re-settle
- **Double-click**: Focus/zoom on node cluster

### 3. Edge Design

- Line thickness = overall match strength
- Dashed vs solid = pending vs established connection
- Color segments for multi-factor matching (idea, skills, role)
- Animated particles flowing on high-compatibility edges

### 4. ProfileSidebar Component ([`app/components/sidebar/ProfileSidebar.tsx`](app/components/sidebar/ProfileSidebar.tsx))

- Slide-in from right (Framer Motion)
- Sections: Bio, Skills (visual proficiency bars), Idea Pitch, Required Skills, Portfolio, Commitment
- "Why this match?" mini-graph showing embedding overlap
- Action buttons: Connect, Save, Hide (with keyboard shortcuts)

### 5. FilterPanel Component ([`app/components/filters/FilterPanel.tsx`](app/components/filters/FilterPanel.tsx))

- Floating panel (bottom-left or collapsible drawer)
- Industry multi-select (nodes cluster/fade by selection)
- Skill-based sliders (technical, business, design emphasis)
- Startup stage filter (idea/mvp/launched)
- Commitment level toggle
- Real-time graph re-rendering on filter changes

### 6. Dark/Light Mode ([`app/globals.css`](app/globals.css))

- CSS custom properties with `prefers-color-scheme` detection
- Manual toggle with localStorage persistence
- Dark: Deep blacks, neon accents, glowing nodes
- Light: Clean white, vibrant solid colors, subtle shadows

## API Integration

Uses existing endpoints:

- `GET /api/matches/recommendations` - Fetch match candidates with scores
- `GET /api/users/[id]` - Full profile for sidebar
- `POST /api/swipes` - Record connect/hide actions (right/left swipe equivalent)

## Visual Effects

- Node hover glow with box-shadow animation
- Edge pulse animation on high-compatibility links
- Smooth camera transitions on node focus
- Particle effects on link hover
- Staggered fade-in for initial graph population
