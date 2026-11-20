export const PASTEL_NOTE_COLORS = [
  '#FEF08A', // Yellow
  '#BAF7D0', // Green
  '#BFDBFE', // Blue
  '#FED7AA', // Orange
  '#FBCFE8', // Pink
  '#DDD6FE', // Purple
];

export const SYSTEM_INSTRUCTION_JSON = `
You are an intelligent whiteboard diagramming and brainstorming AI assistant.
You generate structured canvas elements for an infinite collaborative whiteboard.
You MUST ALWAYS respond with ONLY valid, raw JSON conforming exactly to the requested schema.
Do NOT enclose your output in markdown codeblocks (no \`\`\`json or \`\`\`).
Do NOT include any commentary, greetings, or explanations.
`;

export function buildBrainstormPrompt(prompt: string, count: number = 6): string {
  return `
Create ${count} brainstormed ideas for the topic: "${prompt}".
Generate an array of sticky notes arranged in a neat grid (2 to 3 columns, spacing 220px apart).
Return a JSON object with this exact structure:
{
  "notes": [
    {
      "text": "Idea text with brief description",
      "color": "#FEF08A" (choose from yellow: #FEF08A, green: #BAF7D0, blue: #BFDBFE, orange: #FED7AA, pink: #FBCFE8, purple: #DDD6FE),
      "x": number,
      "y": number,
      "width": 180,
      "height": 180
    }
  ]
}
`;
}

export function buildOutlinePrompt(prompt: string): string {
  return `
Create an organized roadmap or outline for: "${prompt}".
Organize into 3 to 5 chronological or logical phases/sections.
For each phase, generate a header card and 2 to 3 milestone sub-points, with connecting arrows between phases.
Return a JSON object with this exact structure:
{
  "elements": [
    {
      "type": "shape",
      "shapeType": "rectangle",
      "text": "Phase 1: Planning",
      "fill": "#E8F5E9",
      "stroke": "#2D6A4F",
      "x": number,
      "y": number,
      "width": 240,
      "height": 120
    }
  ],
  "connectors": [
    {
      "startIndex": 0,
      "endIndex": 1,
      "label": "Next"
    }
  ]
}
`;
}

export function buildDiagramPrompt(prompt: string, diagramType: string = 'architecture'): string {
  if (diagramType === 'flowchart') {
    return `
Create a complete, detailed, production-quality Flowchart for: "${prompt}".
Design a logical, end-to-end flowchart with 6 to 9 nodes:
- Start and End nodes: shape "circle" (Start: fill "#DCFCE7", stroke "#16A34A"; End: fill "#FEE2E2", stroke "#DC2626")
- Process / Action steps: shape "rectangle" (fill "#E0F2FE", stroke "#0284C7")
- Decision / Conditional branches: shape "diamond" (fill "#FEF3C7", stroke "#D97706")
- Provide 2 branching connectors from decision nodes with labels "Yes / Valid" and "No / Retry".
- Organize nodes sequentially with clean layout coordinates:
  - If horizontal: X coordinates between 100 and 1100, Y between 200 and 450.
  - Nodes should have width 150-180 and height 70-90.
- Connect all nodes with directional connectors and meaningful labels.

Return a JSON object conforming strictly to this format:
{
  "nodes": [
    {
      "label": "User Submit",
      "subtitle": "Form input payload",
      "badge": "START",
      "shape": "circle",
      "fill": "#DCFCE7",
      "stroke": "#16A34A",
      "x": 120,
      "y": 250,
      "width": 110,
      "height": 80
    }
  ],
  "connectors": [
    {
      "fromNodeIndex": 0,
      "toNodeIndex": 1,
      "label": "Click Submit",
      "routing": "smooth"
    }
  ]
}
`;
  }

  if (diagramType === 'er') {
    return `
Create a comprehensive, normalized Entity-Relationship (ER) Database Schema diagram for: "${prompt}".
Design 4 to 6 database entities/tables:
- Shape: "cylinder" or "rectangle"
- fill: "#EDE9FE", stroke: "#7C3AED" (Purple database theme)
- label: Table Name (e.g. "users", "orders", "payments")
- subtitle: Primary & Foreign Keys (e.g. "id (PK), email, created_at" or "id (PK), user_id (FK), total, status")
- badge: "DATABASE"
- X coordinates between 100 and 950, Y coordinates between 150 and 550.
- Connectors between related tables with cardinality labels: "1 : N", "1 : 1", or "N : M".

Return a JSON object conforming strictly to this format:
{
  "nodes": [
    {
      "label": "users",
      "subtitle": "id (PK), email, name, role",
      "badge": "DATABASE",
      "shape": "cylinder",
      "fill": "#EDE9FE",
      "stroke": "#7C3AED",
      "x": 140,
      "y": 200,
      "width": 180,
      "height": 90
    }
  ],
  "connectors": [
    {
      "fromNodeIndex": 0,
      "toNodeIndex": 1,
      "label": "1 : N",
      "routing": "smooth"
    }
  ]
}
`;
  }

  if (diagramType === 'sequence') {
    return `
Create a detailed Protocol & API Sequence Interaction Diagram for: "${prompt}".
Design 4 to 5 system participants and their message exchange flow:
- Participants at top: shape "rectangle" (Client, API Gateway, Service, Database)
- Action steps flowing sequentially downwards with clear step labels ("1. POST /login", "2. Validate Token", "3. SQL Query", "4. 200 OK").
- Connectors ordered with step numbers and protocols.

Return a JSON object conforming strictly to this format:
{
  "nodes": [
    {
      "label": "Web Client",
      "subtitle": "Single Page App",
      "badge": "CLIENT",
      "shape": "rectangle",
      "fill": "#E0F2FE",
      "stroke": "#0284C7",
      "x": 100,
      "y": 150,
      "width": 160,
      "height": 75
    }
  ],
  "connectors": [
    {
      "fromNodeIndex": 0,
      "toNodeIndex": 1,
      "label": "1. HTTPS POST",
      "routing": "smooth"
    }
  ]
}
`;
  }

  // Default: Full Cloud / Microservices Architecture Diagram
  return `
Create a comprehensive, production-grade Software Architecture Diagram for: "${prompt}".
Design a professional, modern multi-tier system with 7 to 10 cohesive components:
1. Presentation Tier (Left, X: 100-140):
   - Client Apps (Web App, Mobile App): shape "rectangle", fill "#E0F2FE", stroke "#0284C7", badge "CLIENT"
2. Edge / Gateway Tier (X: 350-400):
   - API Gateway / Reverse Proxy: shape "diamond", fill "#FEF3C7", stroke "#D97706", badge "GATEWAY", subtitle "SSL & Rate Limiting"
3. Application / Microservices Tier (X: 620-680, vertical spread Y: 130, 290, 450):
   - Auth Service: shape "rectangle", fill "#E8F5E9", stroke "#2D6A4F", badge "SERVICE", subtitle "JWT & Permissions"
   - Core Business Service: shape "rectangle", fill "#E8F5E9", stroke "#2D6A4F", badge "SERVICE", subtitle "Domain Business Logic"
   - Worker / Job Queue: shape "rectangle", fill "#FCE7F3", stroke "#DB2777", badge "WORKER", subtitle "Background Tasks"
4. Data & Persistence Tier (X: 920-980, vertical spread Y: 130, 290, 450):
   - Redis Cache: shape "cylinder", fill "#FCE7F3", stroke "#DB2777", badge "CACHE", subtitle "In-Memory Session Store"
   - PostgreSQL / Primary DB: shape "cylinder", fill "#EDE9FE", stroke "#7C3AED", badge "DATABASE", subtitle "Relational Master Data"
   - Object Storage / S3: shape "cylinder", fill "#EDE9FE", stroke "#7C3AED", badge "STORAGE", subtitle "Media & Asset Storage"

Include directional connectors between components with descriptive labels ("HTTPS / WSS", "gRPC", "SQL Queries", "Pub/Sub", "TCP Cache").
Return a JSON object conforming strictly to this format:
{
  "nodes": [
    {
      "label": "Web Client",
      "subtitle": "React 19 Frontend",
      "badge": "CLIENT",
      "shape": "rectangle",
      "fill": "#E0F2FE",
      "stroke": "#0284C7",
      "x": 100,
      "y": 260,
      "width": 160,
      "height": 75
    }
  ],
  "connectors": [
    {
      "fromNodeIndex": 0,
      "toNodeIndex": 1,
      "label": "HTTPS / WSS",
      "routing": "smooth"
    }
  ]
}
`;
}

export function buildChartPrompt(prompt: string, chartType: string = 'bar'): string {
  return `
Generate structured chart data for: "${prompt}".
Preferred chart type: "${chartType}".
Return a JSON object with this exact structure:
{
  "chartType": "${chartType}", // "bar" | "line" | "pie" | "donut"
  "title": "Descriptive Chart Title",
  "labels": ["Item 1", "Item 2", "Item 3", "Item 4"],
  "datasets": [
    {
      "label": "Metric Name",
      "data": [45, 60, 75, 90],
      "backgroundColor": ["#2D6A4F", "#40916C", "#52B788", "#74C69D"]
    }
  ]
}
`;
}

export function buildEditPrompt(elements: any[], instruction: string): string {
  return `
You are editing whiteboard elements based on user instruction: "${instruction}".
Existing elements to modify:
${JSON.stringify(elements, null, 2)}

Instructions:
1. Preserve the original "id" of each element.
2. Modify or improve the text or data attributes according to the instruction.
3. Return a JSON array of the updated elements:
[
  {
    "id": "preserved-uuid",
    "data": { ...updatedData }
  }
]
`;
}

export function buildSummaryPrompt(elements: any[]): string {
  return `
Analyze all elements on this collaborative whiteboard and provide an executive summary:
${JSON.stringify(elements, null, 2)}

Return a JSON object with this exact structure:
{
  "title": "Whiteboard Executive Summary",
  "overview": "High-level overview of the board content and purpose (2-3 paragraphs)",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "decisions": ["Decision or milestone 1", "Decision 2"],
  "actionItems": ["Action item 1", "Action item 2", "Action item 3"],
  "elementCount": ${elements.length}
}
`;
}
