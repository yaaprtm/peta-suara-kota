import { Response } from 'express';

/**
 * Server-Sent Events service for real-time report updates
 * Clients connect to /api/reports/stream and receive events
 * when new reports are created or statuses change
 */

interface SSEClient {
  id: string;
  res: Response;
}

class SSEService {
  private clients: Map<string, SSEClient> = new Map();

  addClient(id: string, res: Response): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
    });

    // Send initial connection event
    this.sendToClient(res, 'connected', { message: 'SSE connection established' });

    // Heartbeat every 30s
    const heartbeat = setInterval(() => {
      this.sendToClient(res, 'heartbeat', { timestamp: Date.now() });
    }, 30000);

    this.clients.set(id, { id, res });

    res.on('close', () => {
      clearInterval(heartbeat);
      this.clients.delete(id);
    });
  }

  private sendToClient(res: Response, event: string, data: unknown): void {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      // Client disconnected
    }
  }

  broadcast(event: string, data: unknown): void {
    this.clients.forEach(({ res }) => {
      this.sendToClient(res, event, data);
    });
  }

  broadcastNewReport(report: unknown): void {
    this.broadcast('new_report', report);
  }

  broadcastStatusUpdate(reportId: string, newStatus: string): void {
    this.broadcast('status_update', { reportId, newStatus });
  }

  get clientCount(): number {
    return this.clients.size;
  }
}

export const sseService = new SSEService();
