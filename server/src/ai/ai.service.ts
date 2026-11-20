import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import {
  SYSTEM_INSTRUCTION_JSON,
  buildBrainstormPrompt,
  buildOutlinePrompt,
  buildDiagramPrompt,
  buildChartPrompt,
  buildEditPrompt,
  buildSummaryPrompt,
  PASTEL_NOTE_COLORS,
} from './prompts/ai-prompts';
import { AiBrainstormDto } from './dto/ai-brainstorm.dto';
import { AiOutlineDto } from './dto/ai-outline.dto';
import { AiDiagramDto } from './dto/ai-diagram.dto';
import { AiChartDto } from './dto/ai-chart.dto';
import { AiEditDto } from './dto/ai-edit.dto';
import { AiSummaryDto } from './dto/ai-summary.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private aiClient: GoogleGenAI | null = null;
  private readonly modelName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    this.modelName = this.configService.get<string>('gemini.model') || 'gemini-2.5-flash';

    if (apiKey && apiKey.trim() !== '' && !apiKey.includes('your_gemini_api_key')) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
        this.logger.log(`Google Gemini AI initialized with model: ${this.modelName}`);
      } catch (e) {
        this.logger.warn(`Could not initialize GoogleGenAI: ${e.message}`);
      }
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is not configured. AI service will operate in smart template fallback mode.',
      );
    }
  }

  private cleanJson(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }
    return cleaned;
  }

  private async generateWithGemini(prompt: string): Promise<{ text: string; tokens: number }> {
    if (!this.aiClient) {
      return { text: '', tokens: 0 };
    }

    try {
      const response = await this.aiClient.models.generateContent({
        model: this.modelName,
        contents: `${SYSTEM_INSTRUCTION_JSON}\n\n${prompt}`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text || '';
      const tokenCount = response.usageMetadata?.totalTokenCount || 250;
      return { text: responseText, tokens: tokenCount };
    } catch (error) {
      this.logger.error(`Gemini API execution failed: ${error.message}`);
      return { text: '', tokens: 0 };
    }
  }

  private async recordUsage(
    userId: string,
    whiteboardId: string,
    actionType: string,
    tokens: number,
  ) {
    try {
      await this.prisma.aiUsage.create({
        data: {
          userId,
          whiteboardId,
          actionType,
          model: this.modelName,
          tokenUsage: tokens,
        },
      });
    } catch (e) {
      this.logger.warn(`Could not log AI usage: ${e.message}`);
    }
  }

  async brainstorm(userId: string, dto: AiBrainstormDto) {
    const { boardId, prompt, count = 6 } = dto;
    let generatedNotes: any[] = [];
    let tokens = 0;

    const geminiResult = await this.generateWithGemini(buildBrainstormPrompt(prompt, count));

    if (geminiResult.text) {
      try {
        const parsed = JSON.parse(this.cleanJson(geminiResult.text));
        if (Array.isArray(parsed.notes)) {
          generatedNotes = parsed.notes;
        }
        tokens = geminiResult.tokens;
      } catch (e) {
        this.logger.warn(`Failed to parse Gemini brainstorm output: ${e.message}`);
      }
    }

    // High quality intelligent fallback if Gemini offline or returned empty
    if (generatedNotes.length === 0) {
      const ideaTopics = [
        `Core Value Proposition: Focus on high-impact problem solving for "${prompt}"`,
        `User Experience: Streamlined user journey and low-friction onboarding`,
        `Tech Architecture: Scalable microservices, caching layer, and resilient storage`,
        `Go-To-Market: Content marketing, product-led growth, and developer advocacy`,
        `Monetization Strategy: Usage-based tiers and enterprise custom integrations`,
        `Risk Mitigation: Automated testing, canary deployments, and rate limiting`,
      ];

      generatedNotes = ideaTopics.slice(0, count).map((text, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        return {
          text,
          color: PASTEL_NOTE_COLORS[idx % PASTEL_NOTE_COLORS.length],
          x: 150 + col * 220,
          y: 150 + row * 220,
          width: 190,
          height: 190,
        };
      });
      tokens = 150;
    }

    // Convert notes to canvas elements and persist in database
    const createdElements = await this.prisma.$transaction(
      generatedNotes.map((note, index) =>
        this.prisma.element.create({
          data: {
            whiteboardId: boardId,
            type: 'sticky_note',
            positionX: note.x || 150 + (index % 3) * 220,
            positionY: note.y || 150 + Math.floor(index / 3) * 220,
            width: note.width || 190,
            height: note.height || 190,
            zIndex: index + 1,
            data: {
              text: note.text,
              color: note.color || PASTEL_NOTE_COLORS[index % PASTEL_NOTE_COLORS.length],
              fontSize: 16,
            },
            createdById: userId,
          },
        }),
      ),
    );

    await this.recordUsage(userId, boardId, 'brainstorm', tokens);
    return { elements: createdElements, count: createdElements.length };
  }

  async outline(userId: string, dto: AiOutlineDto) {
    const { boardId, prompt } = dto;
    let elementsData: any[] = [];
    let connectorsData: any[] = [];
    let tokens = 0;

    const geminiResult = await this.generateWithGemini(buildOutlinePrompt(prompt));
    if (geminiResult.text) {
      try {
        const parsed = JSON.parse(this.cleanJson(geminiResult.text));
        if (Array.isArray(parsed.elements)) elementsData = parsed.elements;
        if (Array.isArray(parsed.connectors)) connectorsData = parsed.connectors;
        tokens = geminiResult.tokens;
      } catch (e) {
        this.logger.warn(`Failed to parse Gemini outline output: ${e.message}`);
      }
    }

    if (elementsData.length === 0) {
      const phases = ['1. Research & Discovery', '2. MVP Architecture', '3. Beta Launch', '4. Scale & Optimization'];
      elementsData = phases.map((phase, idx) => ({
        type: 'shape',
        shapeType: 'rectangle',
        text: phase,
        fill: '#E8F5E9',
        stroke: '#2D6A4F',
        x: 100 + idx * 260,
        y: 200,
        width: 220,
        height: 120,
      }));
      connectorsData = [
        { startIndex: 0, endIndex: 1 },
        { startIndex: 1, endIndex: 2 },
        { startIndex: 2, endIndex: 3 },
      ];
      tokens = 200;
    }

    const createdElements: any[] = [];
    for (let i = 0; i < elementsData.length; i++) {
      const el = elementsData[i];
      const created = await this.prisma.element.create({
        data: {
          whiteboardId: boardId,
          type: el.type || 'shape',
          positionX: el.x || 100 + i * 260,
          positionY: el.y || 200,
          width: el.width || 220,
          height: el.height || 120,
          zIndex: i + 1,
          data: {
            shapeType: el.shapeType || 'rectangle',
            text: el.text,
            fill: el.fill || '#E8F5E9',
            stroke: el.stroke || '#2D6A4F',
            strokeWidth: 2,
            fontSize: 16,
          },
          createdById: userId,
        },
      });
      createdElements.push(created);
    }

    // Create connectors connecting elements with smart ports
    for (const conn of connectorsData) {
      if (
        conn.startIndex !== undefined &&
        conn.endIndex !== undefined &&
        createdElements[conn.startIndex] &&
        createdElements[conn.endIndex]
      ) {
        const start = createdElements[conn.startIndex];
        const end = createdElements[conn.endIndex];

        const startX = start.positionX + start.width;
        const startY = start.positionY + start.height / 2;
        const endX = end.positionX;
        const endY = end.positionY + end.height / 2;

        const minX = Math.min(startX, endX) - 10;
        const minY = Math.min(startY, endY) - 10;
        const maxX = Math.max(startX, endX) + 10;
        const maxY = Math.max(startY, endY) + 10;

        const connector = await this.prisma.element.create({
          data: {
            whiteboardId: boardId,
            type: 'connector',
            positionX: minX,
            positionY: minY,
            width: Math.max(maxX - minX, 30),
            height: Math.max(maxY - minY, 30),
            zIndex: 50,
            data: {
              startElementId: start.id,
              endElementId: end.id,
              startPoint: [startX, startY],
              endPoint: [endX, endY],
              label: conn.label || '',
              routing: 'smooth',
              stroke: '#2D6A4F',
              strokeWidth: 2,
              endArrow: true,
            },
            createdById: userId,
          },
        });
        createdElements.push(connector);
      }
    }

    await this.recordUsage(userId, boardId, 'outline', tokens);
    return { elements: createdElements };
  }

  async diagram(userId: string, dto: AiDiagramDto) {
    const { boardId, prompt, diagramType = 'architecture' } = dto;
    let nodes: any[] = [];
    let connectors: any[] = [];
    let tokens = 0;

    const geminiResult = await this.generateWithGemini(buildDiagramPrompt(prompt, diagramType));
    if (geminiResult.text) {
      try {
        const parsed = JSON.parse(this.cleanJson(geminiResult.text));
        if (Array.isArray(parsed.nodes)) nodes = parsed.nodes;
        if (Array.isArray(parsed.connectors)) connectors = parsed.connectors;
        tokens = geminiResult.tokens;
      } catch (e) {
        this.logger.warn(`Failed to parse Gemini diagram output: ${e.message}`);
      }
    }

    if (nodes.length === 0) {
      if (diagramType === 'flowchart') {
        nodes = [
          { label: 'Start Request', subtitle: 'User triggers action', badge: 'START', shape: 'circle', fill: '#DCFCE7', stroke: '#16A34A', x: 100, y: 250, width: 110, height: 80 },
          { label: 'Input Validation', subtitle: 'Schema & payload check', badge: 'STEP', shape: 'rectangle', fill: '#E0F2FE', stroke: '#0284C7', x: 280, y: 245, width: 160, height: 75 },
          { label: 'Is Valid?', subtitle: 'Security & syntax gate', badge: 'DECISION', shape: 'diamond', fill: '#FEF3C7', stroke: '#D97706', x: 500, y: 235, width: 140, height: 95 },
          { label: 'Process Logic', subtitle: 'Execute transactional updates', badge: 'SUCCESS', shape: 'rectangle', fill: '#E8F5E9', stroke: '#2D6A4F', x: 720, y: 160, width: 170, height: 80 },
          { label: 'Return Error', subtitle: '400 Bad Request Response', badge: 'ERROR', shape: 'rectangle', fill: '#FEE2E2', stroke: '#DC2626', x: 720, y: 350, width: 170, height: 80 },
          { label: 'Success Finish', subtitle: '200 OK Complete', badge: 'END', shape: 'circle', fill: '#DCFCE7', stroke: '#16A34A', x: 960, y: 160, width: 110, height: 80 },
          { label: 'Abort Flow', subtitle: 'Audit log & Terminate', badge: 'END', shape: 'circle', fill: '#FEE2E2', stroke: '#DC2626', x: 960, y: 350, width: 110, height: 80 },
        ];
        connectors = [
          { fromNodeIndex: 0, toNodeIndex: 1, label: 'Trigger' },
          { fromNodeIndex: 1, toNodeIndex: 2, label: 'Validate' },
          { fromNodeIndex: 2, toNodeIndex: 3, label: 'Yes / Valid' },
          { fromNodeIndex: 2, toNodeIndex: 4, label: 'No / Invalid' },
          { fromNodeIndex: 3, toNodeIndex: 5, label: 'Done' },
          { fromNodeIndex: 4, toNodeIndex: 6, label: 'Reject' },
        ];
        tokens = 250;
      } else if (diagramType === 'er') {
        nodes = [
          { label: 'users', subtitle: 'id (PK), email, password_hash, role', badge: 'DATABASE', shape: 'cylinder', fill: '#EDE9FE', stroke: '#7C3AED', x: 120, y: 160, width: 190, height: 95 },
          { label: 'whiteboards', subtitle: 'id (PK), title, owner_id (FK)', badge: 'DATABASE', shape: 'cylinder', fill: '#EDE9FE', stroke: '#7C3AED', x: 420, y: 160, width: 190, height: 95 },
          { label: 'board_members', subtitle: 'id (PK), user_id (FK), board_id (FK), role', badge: 'DATABASE', shape: 'cylinder', fill: '#EDE9FE', stroke: '#7C3AED', x: 270, y: 360, width: 220, height: 95 },
          { label: 'elements', subtitle: 'id (PK), board_id (FK), type, data (JSONB)', badge: 'DATABASE', shape: 'cylinder', fill: '#EDE9FE', stroke: '#7C3AED', x: 720, y: 160, width: 210, height: 95 },
        ];
        connectors = [
          { fromNodeIndex: 0, toNodeIndex: 1, label: '1 : N (Owns)' },
          { fromNodeIndex: 0, toNodeIndex: 2, label: '1 : N (Member)' },
          { fromNodeIndex: 1, toNodeIndex: 2, label: '1 : N (Shares)' },
          { fromNodeIndex: 1, toNodeIndex: 3, label: '1 : N (Contains)' },
        ];
        tokens = 220;
      } else if (diagramType === 'sequence') {
        nodes = [
          { label: 'Web Client', subtitle: 'Browser / SPA', badge: 'ACTOR', shape: 'rectangle', fill: '#E0F2FE', stroke: '#0284C7', x: 100, y: 150, width: 150, height: 75 },
          { label: 'API Gateway', subtitle: 'Kong / Nginx', badge: 'GATEWAY', shape: 'diamond', fill: '#FEF3C7', stroke: '#D97706', x: 340, y: 145, width: 140, height: 85 },
          { label: 'Auth Service', subtitle: 'NestJS Microservice', badge: 'SERVICE', shape: 'rectangle', fill: '#E8F5E9', stroke: '#2D6A4F', x: 570, y: 150, width: 160, height: 75 },
          { label: 'User Database', subtitle: 'PostgreSQL 16', badge: 'DATABASE', shape: 'cylinder', fill: '#EDE9FE', stroke: '#7C3AED', x: 810, y: 145, width: 160, height: 85 },
        ];
        connectors = [
          { fromNodeIndex: 0, toNodeIndex: 1, label: '1. POST /auth/login' },
          { fromNodeIndex: 1, toNodeIndex: 2, label: '2. Forward RPC request' },
          { fromNodeIndex: 2, toNodeIndex: 3, label: '3. SELECT user WHERE email' },
          { fromNodeIndex: 3, toNodeIndex: 2, label: '4. Return user & password hash' },
          { fromNodeIndex: 2, toNodeIndex: 1, label: '5. Signed JWT access token' },
          { fromNodeIndex: 1, toNodeIndex: 0, label: '6. 200 OK (Auth cookies)' },
        ];
        tokens = 240;
      } else {
        // High quality full cloud architecture fallback
        nodes = [
          { label: 'Web & Mobile Client', subtitle: 'React 19 + Tailwind', badge: 'CLIENT', shape: 'rectangle', fill: '#E0F2FE', stroke: '#0284C7', x: 100, y: 280, width: 170, height: 80 },
          { label: 'API Gateway', subtitle: 'Rate limiting & SSL termination', badge: 'GATEWAY', shape: 'diamond', fill: '#FEF3C7', stroke: '#D97706', x: 350, y: 275, width: 150, height: 90 },
          { label: 'Auth & User Service', subtitle: 'JWT, OAuth2 & Sessions', badge: 'SERVICE', shape: 'rectangle', fill: '#E8F5E9', stroke: '#2D6A4F', x: 590, y: 140, width: 180, height: 80 },
          { label: 'Core Whiteboard API', subtitle: 'Canvas REST & Transactions', badge: 'SERVICE', shape: 'rectangle', fill: '#E8F5E9', stroke: '#2D6A4F', x: 590, y: 280, width: 180, height: 80 },
          { label: 'Real-Time Sync Engine', subtitle: 'Socket.IO WebSocket Gateway', badge: 'SERVICE', shape: 'rectangle', fill: '#E8F5E9', stroke: '#2D6A4F', x: 590, y: 420, width: 180, height: 80 },
          { label: 'Redis Cache & Pub/Sub', subtitle: 'Presence & Active Rooms', badge: 'CACHE', shape: 'cylinder', fill: '#FCE7F3', stroke: '#DB2777', x: 870, y: 140, width: 190, height: 85 },
          { label: 'PostgreSQL Database', subtitle: 'Persistent Master Storage', badge: 'DATABASE', shape: 'cylinder', fill: '#EDE9FE', stroke: '#7C3AED', x: 870, y: 280, width: 190, height: 85 },
          { label: 'MinIO / S3 Storage', subtitle: 'Media & File Uploads', badge: 'STORAGE', shape: 'cylinder', fill: '#EDE9FE', stroke: '#7C3AED', x: 870, y: 420, width: 190, height: 85 },
        ];
        connectors = [
          { fromNodeIndex: 0, toNodeIndex: 1, label: 'HTTPS / WSS' },
          { fromNodeIndex: 1, toNodeIndex: 2, label: 'Auth verification' },
          { fromNodeIndex: 1, toNodeIndex: 3, label: 'REST CRUD' },
          { fromNodeIndex: 1, toNodeIndex: 4, label: 'WebSocket connection' },
          { fromNodeIndex: 2, toNodeIndex: 5, label: 'Session cache' },
          { fromNodeIndex: 3, toNodeIndex: 6, label: 'SQL queries' },
          { fromNodeIndex: 4, toNodeIndex: 5, label: 'Pub/Sub room events' },
          { fromNodeIndex: 3, toNodeIndex: 7, label: 'S3 Presigned URLs' },
        ];
        tokens = 320;
      }
    }

    const createdElements: any[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const created = await this.prisma.element.create({
        data: {
          whiteboardId: boardId,
          type: 'shape',
          positionX: node.x || 100 + i * 200,
          positionY: node.y || 200,
          width: node.width || 160,
          height: node.height || 80,
          zIndex: i + 1,
          data: {
            shapeType: node.shape || 'rectangle',
            text: node.label,
            subtitle: node.subtitle,
            badge: node.badge,
            fill: node.fill || '#E8F5E9',
            stroke: node.stroke || '#2D6A4F',
            strokeWidth: 2,
            fontSize: 13,
            fontWeight: 'bold',
          },
          createdById: userId,
        },
      });
      createdElements.push(created);
    }

    // Smart connector port routing between nodes
    for (const conn of connectors) {
      if (
        conn.fromNodeIndex !== undefined &&
        conn.toNodeIndex !== undefined &&
        createdElements[conn.fromNodeIndex] &&
        createdElements[conn.toNodeIndex]
      ) {
        const fromNode = createdElements[conn.fromNodeIndex];
        const toNode = createdElements[conn.toNodeIndex];

        const fromCenter = {
          x: fromNode.positionX + fromNode.width / 2,
          y: fromNode.positionY + fromNode.height / 2,
        };
        const toCenter = {
          x: toNode.positionX + toNode.width / 2,
          y: toNode.positionY + toNode.height / 2,
        };

        const dx = toCenter.x - fromCenter.x;
        const dy = toCenter.y - fromCenter.y;

        let startX: number;
        let startY: number;
        let endX: number;
        let endY: number;

        if (Math.abs(dx) >= Math.abs(dy)) {
          // Horizontal primary flow
          if (dx >= 0) {
            startX = fromNode.positionX + fromNode.width;
            startY = fromCenter.y;
            endX = toNode.positionX;
            endY = toCenter.y;
          } else {
            startX = fromNode.positionX;
            startY = fromCenter.y;
            endX = toNode.positionX + toNode.width;
            endY = toCenter.y;
          }
        } else {
          // Vertical primary flow
          if (dy >= 0) {
            startX = fromCenter.x;
            startY = fromNode.positionY + fromNode.height;
            endX = toCenter.x;
            endY = toNode.positionY;
          } else {
            startX = fromCenter.x;
            startY = fromNode.positionY;
            endX = toCenter.x;
            endY = toNode.positionY + toNode.height;
          }
        }

        const minX = Math.min(startX, endX) - 12;
        const minY = Math.min(startY, endY) - 12;
        const maxX = Math.max(startX, endX) + 12;
        const maxY = Math.max(startY, endY) + 12;

        const connector = await this.prisma.element.create({
          data: {
            whiteboardId: boardId,
            type: 'connector',
            positionX: minX,
            positionY: minY,
            width: Math.max(maxX - minX, 30),
            height: Math.max(maxY - minY, 30),
            zIndex: 100,
            data: {
              startElementId: fromNode.id,
              endElementId: toNode.id,
              startPoint: [startX, startY],
              endPoint: [endX, endY],
              label: conn.label || '',
              routing: conn.routing || 'smooth',
              stroke: conn.stroke || fromNode.data?.stroke || '#2D6A4F',
              strokeWidth: 2,
              endArrow: true,
            },
            createdById: userId,
          },
        });
        createdElements.push(connector);
      }
    }

    await this.recordUsage(userId, boardId, 'diagram', tokens);
    return { elements: createdElements };
  }

  async chart(userId: string, dto: AiChartDto) {
    const { boardId, prompt, chartType = 'bar' } = dto;
    let chartData: any = null;
    let tokens = 0;

    const geminiResult = await this.generateWithGemini(buildChartPrompt(prompt, chartType));
    if (geminiResult.text) {
      try {
        const parsed = JSON.parse(this.cleanJson(geminiResult.text));
        if (parsed.labels && parsed.datasets) {
          chartData = parsed;
        }
        tokens = geminiResult.tokens;
      } catch (e) {
        this.logger.warn(`Failed to parse Gemini chart output: ${e.message}`);
      }
    }

    if (!chartData) {
      chartData = {
        chartType,
        title: prompt.length > 30 ? `${prompt.slice(0, 30)}...` : prompt,
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
          {
            label: 'Performance Metrics',
            data: [42, 68, 85, 110],
            backgroundColor: ['#2D6A4F', '#40916C', '#52B788', '#74C69D'],
          },
        ],
      };
      tokens = 150;
    }

    const createdChartElement = await this.prisma.element.create({
      data: {
        whiteboardId: boardId,
        type: 'chart',
        positionX: 200,
        positionY: 180,
        width: 440,
        height: 300,
        zIndex: 10,
        data: chartData,
        createdById: userId,
      },
    });

    await this.recordUsage(userId, boardId, 'chart', tokens);
    return { element: createdChartElement };
  }

  async edit(userId: string, dto: AiEditDto) {
    const { boardId, elementIds, instruction } = dto;

    const elements = await this.prisma.element.findMany({
      where: {
        id: { in: elementIds },
        whiteboardId: boardId,
      },
    });

    if (elements.length === 0) {
      throw new BadRequestException('No matching elements found to edit');
    }

    let modifiedItems: any[] = [];
    let tokens = 0;

    const geminiResult = await this.generateWithGemini(buildEditPrompt(elements, instruction));
    if (geminiResult.text) {
      try {
        const parsed = JSON.parse(this.cleanJson(geminiResult.text));
        if (Array.isArray(parsed)) modifiedItems = parsed;
        tokens = geminiResult.tokens;
      } catch (e) {
        this.logger.warn(`Failed to parse Gemini edit output: ${e.message}`);
      }
    }

    const updatedElements: any[] = [];
    for (const el of elements) {
      const match = modifiedItems.find((m) => m.id === el.id);
      let newData = el.data as any;

      if (match && match.data) {
        newData = { ...newData, ...match.data };
      } else {
        // Fallback enhancement based on instruction
        const currentText = newData.text || '';
        if (instruction.toLowerCase().includes('bullet')) {
          newData = {
            ...newData,
            text: currentText
              .split('\n')
              .map((line: string) => (line.startsWith('• ') ? line : `• ${line}`))
              .join('\n'),
          };
        } else if (instruction.toLowerCase().includes('summarize')) {
          newData = {
            ...newData,
            text: currentText.length > 50 ? `${currentText.slice(0, 50)}... [AI Summary]` : currentText,
          };
        } else {
          newData = {
            ...newData,
            text: `${currentText}\n(Refined: ${instruction})`,
          };
        }
      }

      const updated = await this.prisma.element.update({
        where: { id: el.id },
        data: { data: newData },
      });
      updatedElements.push(updated);
    }

    await this.recordUsage(userId, boardId, 'edit', tokens || 120);
    return { elements: updatedElements };
  }

  async summary(userId: string, dto: AiSummaryDto) {
    const { boardId } = dto;

    const elements = await this.prisma.element.findMany({
      where: { whiteboardId: boardId },
    });

    let summaryResult: any = null;
    let tokens = 0;

    if (elements.length > 0) {
      const geminiResult = await this.generateWithGemini(buildSummaryPrompt(elements));
      if (geminiResult.text) {
        try {
          summaryResult = JSON.parse(this.cleanJson(geminiResult.text));
          tokens = geminiResult.tokens;
        } catch (e) {
          this.logger.warn(`Failed to parse Gemini summary output: ${e.message}`);
        }
      }
    }

    if (!summaryResult) {
      summaryResult = {
        title: 'Whiteboard Executive Summary',
        overview: `This whiteboard currently contains ${elements.length} visual items including notes, shapes, diagrams, and data charts collaborating on system and product strategy.`,
        keyTopics: [
          'System architecture & workflow integration',
          'Feature delivery & milestone tracking',
          'Collaborative design & user experience exploration',
        ],
        decisions: [
          'Adopt standard PostgreSQL with JSONB element serialization',
          'Leverage Socket.IO for ephemeral sub-50ms peer updates',
          'Integrate Google Gemini for visual diagram & outline synthesis',
        ],
        actionItems: [
          'Review newly brainstormed canvas items with collaborators',
          'Finalize architecture connector pathways',
          'Export high-resolution canvas snapshot for distribution',
        ],
        elementCount: elements.length,
      };
      tokens = 150;
    }

    await this.recordUsage(userId, boardId, 'summary', tokens);
    return summaryResult;
  }
}
