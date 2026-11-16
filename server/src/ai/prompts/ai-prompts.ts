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
  return `
Create a ${diagramType} diagram for: "${prompt}".
Include relevant components (services, databases, gateways, clients, message queues) with clear labels and coordinate positions (x between 100 and 900, y between 100 and 700).
Include directional connectors between components with descriptive labels.
Return a JSON object with this exact structure:
{
  "nodes": [
    {
      "label": "Client App",
      "shape": "rectangle", // "rectangle" | "circle" | "diamond" | "cylinder"
      "fill": "#E0F2FE",
      "stroke": "#0284C7",
      "x": 100,
      "y": 200,
      "width": 140,
      "height": 70
    }
  ],
  "connectors": [
    {
      "fromNodeIndex": 0,
      "toNodeIndex": 1,
      "label": "HTTPS / GraphQL"
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
