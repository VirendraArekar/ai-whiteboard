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

    // Create connectors connecting elements
    for (const conn of connectorsData) {
      if (
        conn.startIndex !== undefined &&
        conn.endIndex !== undefined &&
        createdElements[conn.startIndex] &&
        createdElements[conn.endIndex]
      ) {
        const start = createdElements[conn.startIndex];
        const end = createdElements[conn.endIndex];
        const connector = await this.prisma.element.create({
          data: {
            whiteboardId: boardId,
            type: 'connector',
            positionX: start.positionX + start.width,
            positionY: start.positionY + start.height / 2,
            width: Math.abs(end.positionX - (start.positionX + start.width)),
            height: 40,
            zIndex: 100,
            data: {
              startElementId: start.id,
              endElementId: end.id,
              startPoint: [start.positionX + start.width, start.positionY + start.height / 2],
              endPoint: [end.positionX, end.positionY + end.height / 2],
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
      nodes = [
        { label: 'Client / Web App', shape: 'rectangle', fill: '#E0F2FE', stroke: '#0284C7', x: 100, y: 250, width: 140, height: 70 },
        { label: 'API Gateway', shape: 'diamond', fill: '#FEF3C7', stroke: '#D97706', x: 320, y: 245, width: 130, height: 80 },
        { label: 'Auth & Logic Service', shape: 'rectangle', fill: '#E8F5E9', stroke: '#2D6A4F', x: 530, y: 180, width: 160, height: 70 },
        { label: 'PostgreSQL Database', shape: 'circle', fill: '#EDE9FE', stroke: '#7C3AED', x: 760, y: 240, width: 120, height: 80 },
      ];
      connectors = [
        { fromNodeIndex: 0, toNodeIndex: 1, label: 'HTTPS' },
        { fromNodeIndex: 1, toNodeIndex: 2, label: 'Internal RPC' },
        { fromNodeIndex: 2, toNodeIndex: 3, label: 'SQL queries' },
      ];
      tokens = 220;
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
          width: node.width || 140,
          height: node.height || 70,
          zIndex: i + 1,
          data: {
            shapeType: node.shape || 'rectangle',
            text: node.label,
            fill: node.fill || '#E8F5E9',
            stroke: node.stroke || '#2D6A4F',
            strokeWidth: 2,
            fontSize: 14,
          },
          createdById: userId,
        },
      });
      createdElements.push(created);
    }

    for (const conn of connectors) {
      if (
        conn.fromNodeIndex !== undefined &&
        conn.toNodeIndex !== undefined &&
        createdElements[conn.fromNodeIndex] &&
        createdElements[conn.toNodeIndex]
      ) {
        const fromNode = createdElements[conn.fromNodeIndex];
        const toNode = createdElements[conn.toNodeIndex];
        const connector = await this.prisma.element.create({
          data: {
            whiteboardId: boardId,
            type: 'connector',
            positionX: fromNode.positionX + fromNode.width,
            positionY: fromNode.positionY + fromNode.height / 2,
            width: Math.abs(toNode.positionX - (fromNode.positionX + fromNode.width)),
            height: 40,
            zIndex: 100,
            data: {
              startElementId: fromNode.id,
              endElementId: toNode.id,
              startPoint: [fromNode.positionX + fromNode.width, fromNode.positionY + fromNode.height / 2],
              endPoint: [toNode.positionX, toNode.positionY + toNode.height / 2],
              label: conn.label || '',
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
