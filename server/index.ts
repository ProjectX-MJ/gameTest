import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'colyseus';
import { GameManager } from './GameManager';
import { QuickDrawRoom } from './QuickDrawRoom';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const gameServer = new Server({ server: httpServer });
const gameManager = new GameManager();
QuickDrawRoom.setManager(gameManager);

gameServer.define('quickdraw', QuickDrawRoom);

const router = express.Router();

router.post('/rooms', async (req, res) => {
  try {
    const { settings } = req.body ?? {};
    const { room, playerId } = await gameManager.createRoom(settings ?? {});

    return res.json({
      success: true,
      room: {
        id: room.id,
        code: room.code,
        status: room.status,
        players: room.players,
        settings: room.settings,
        currentRound: room.currentRound,
        score: room.score,
      },
      playerId,
    });
  } catch (error: any) {
    console.error('Create room error:', error);
    return res.status(500).json({ error: error.message ?? 'Failed to create room' });
  }
});

router.post('/rooms/:code/join', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await gameManager.joinRoom(code);

    return res.json({
      success: true,
      room: {
        id: result.room.id,
        code: result.room.code,
        status: result.room.status,
        players: result.room.players,
        settings: result.room.settings,
        currentRound: result.room.currentRound,
        score: result.room.score,
      },
      playerId: result.playerId,
      role: result.role,
    });
  } catch (error: any) {
    console.error('Join room error:', error);
    const message = error.message ?? 'Failed to join room';
    const status = message === 'Room not found' || message === 'Room data not found' ? 404 : message === 'Room is full' ? 400 : 500;
    return res.status(status).json({ error: message });
  }
});

router.post('/rooms/:id/ready', async (req, res) => {
  try {
    const { id } = req.params;
    const { playerId, ready } = req.body;
    const { allReady } = await gameManager.toggleReady(id, playerId, ready);
    return res.json({ success: true, allReady });
  } catch (error: any) {
    console.error('Ready room error:', error);
    const message = error.message ?? 'Failed to update ready status';
    const status = message === 'Room not found' || message === 'Player not found' ? 404 : message === 'Game already started' ? 400 : 500;
    return res.status(status).json({ error: message });
  }
});

router.post('/rooms/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { playerId } = req.body;
    await gameManager.startGame(id, playerId);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Start game error:', error);
    const message = error.message ?? 'Failed to start game';
    let status = 500;
    if (message === 'Room not found') status = 404;
    else if (message.includes('already') || message.includes('ready')) status = 400;
    return res.status(status).json({ error: message });
  }
});

router.get('/rooms/:id', (req, res) => {
  try {
    const { id } = req.params;
    const room = gameManager.getRoom(id);
    return res.json({ success: true, room });
  } catch (error: any) {
    console.error('Get room error:', error);
    const message = error.message ?? 'Failed to get room';
    return res.status(message === 'Room not found' ? 404 : 500).json({ error: message });
  }
});

router.post('/rooms/:id/stroke', async (req, res) => {
  try {
    const { id } = req.params;
    const { stroke, playerId } = req.body;
    await gameManager.addStroke(id, playerId, stroke);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Add stroke error:', error);
    const message = error.message ?? 'Failed to add stroke';
    const status = message.includes('drawer') ? 403 : message === 'Room not found' ? 404 : 500;
    return res.status(status).json({ error: message });
  }
});

router.post('/rooms/:id/guess', async (req, res) => {
  try {
    const { id } = req.params;
    const { guess, playerId } = req.body;
    const result = await gameManager.addGuess(id, playerId, guess);
    return res.json({ success: true, correct: result.correct, score: result.score });
  } catch (error: any) {
    console.error('Guess error:', error);
    const message = error.message ?? 'Failed to process guess';
    const status = message.includes('guesser') ? 403 : message === 'Room not found' ? 404 : 500;
    return res.status(status).json({ error: message });
  }
});

router.post('/rooms/:id/clear', async (req, res) => {
  try {
    const { id } = req.params;
    const { playerId } = req.body;
    await gameManager.clearCanvas(id, playerId);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Clear canvas error:', error);
    const message = error.message ?? 'Failed to clear canvas';
    const status = message.includes('drawer') ? 403 : message === 'Room not found' ? 404 : 500;
    return res.status(status).json({ error: message });
  }
});

router.post('/rooms/:id/skip-word', async (req, res) => {
  try {
    const { id } = req.params;
    const { playerId } = req.body;
    const result = await gameManager.skipWord(id, playerId);
    return res.json({ success: true, newWord: result.newWord });
  } catch (error: any) {
    console.error('Skip word error:', error);
    const message = error.message ?? 'Failed to skip word';
    const status = message.includes('drawer') ? 403 : message === 'Room not found' ? 404 : 500;
    return res.status(status).json({ error: message });
  }
});

router.post('/rooms/:id/next-round', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await gameManager.nextRound(id);
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Next round error:', error);
    const message = error.message ?? 'Failed to start next round';
    const status = message === 'Room not found' ? 404 : 500;
    return res.status(status).json({ error: message });
  }
});

router.post('/rooms/:id/end-game', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await gameManager.endGame(id);
    return res.json({ success: true, finalScore: result.finalScore });
  } catch (error: any) {
    console.error('End game error:', error);
    const message = error.message ?? 'Failed to end game';
    const status = message === 'Room not found' ? 404 : 500;
    return res.status(status).json({ error: message });
  }
});

router.post('/rooms/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const { playerId } = req.body;
    await gameManager.leaveRoom(id, playerId);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Leave room error:', error);
    const message = error.message ?? 'Failed to leave room';
    const status = message === 'Room not found' ? 404 : 500;
    return res.status(status).json({ error: message });
  }
});

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/make-server-b985c1b9', router);

const PORT = Number(process.env.PORT ?? 2567);
httpServer.listen(PORT, () => {
  console.log(`Colyseus server listening on :${PORT}`);
});
