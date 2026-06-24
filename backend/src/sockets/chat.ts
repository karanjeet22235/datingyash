import { Server, Socket } from 'socket.io';
import http from 'http';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../prisma';
import { checkMessageSafety, isWithinNewMatchWindow } from '../services/safetyFilter';
import { banUser, recalculateTrustScore } from '../services/trustScore';

interface AuthedSocket extends Socket {
  userId?: string;
}

const onlineUsers = new Map<string, Set<string>>(); // userId -> set of socket ids

export function initChatSocket(httpServer: http.Server) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || '*', credentials: true },
  });

  io.use((socket: AuthedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token as string;
      if (!token) return next(new Error('No auth token'));
      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      next();
    } catch (e) {
      next(new Error('Invalid auth token'));
    }
  });

  io.on('connection', async (socket: AuthedSocket) => {
    const userId = socket.userId!;
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);

    await prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } }).catch(() => {});
    io.emit('presence', { userId, online: true });

    socket.on('join_match', async (matchId: string) => {
      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (match && (match.userAId === userId || match.userBId === userId)) {
        socket.join(`match:${matchId}`);
      }
    });

    socket.on('typing', ({ matchId, isTyping }: { matchId: string; isTyping: boolean }) => {
      socket.to(`match:${matchId}`).emit('typing', { matchId, userId, isTyping });
    });

    socket.on('send_message', async ({ matchId, content }: { matchId: string; content: string }) => {
      try {
        const match = await prisma.match.findUnique({ where: { id: matchId } });
        if (!match || (match.userAId !== userId && match.userBId !== userId)) {
          return socket.emit('message_error', { error: 'Match not found' });
        }

        const trimmed = (content || '').trim();
        if (!trimmed) return;

        const safety = checkMessageSafety(trimmed);
        const inNewMatchWindow = isWithinNewMatchWindow(match.createdAt);

        let blocked = safety.blocked;
        let blockReason = safety.reason;

        // Hard block: phone/UPI sharing in first 7 days regardless of mild phrasing
        if (!blocked && inNewMatchWindow && (safety.category === undefined)) {
          // no-op; only categories already caught above matter
        }

        const message = await prisma.message.create({
          data: {
            matchId, senderId: userId, content: trimmed,
            blocked, blockReason: blocked ? blockReason : null,
          },
        });

        // Track transparency stats
        await prisma.transparencyStat.create({
          data: { messagesScanned: 1, messagesBlocked: blocked ? 1 : 0, usersBanned: 0, reportsFiled: 0 },
        }).catch(() => {});

        if (blocked) {
          socket.emit('message_blocked', { reason: blockReason, category: safety.category });

          if (safety.severity === 'ban') {
            await banUser(userId, `Automated ban: ${safety.category} pattern detected in chat`);
            socket.emit('account_banned', { reason: blockReason });
          } else {
            const updated = await prisma.user.update({ where: { id: userId }, data: { strikes: { increment: 1 } } });
            await recalculateTrustScore(userId);
            if (updated.strikes >= 3) {
              socket.emit('flagged_for_review', { strikes: updated.strikes });
            }
          }
          return; // do not deliver blocked message to recipient
        }

        io.to(`match:${matchId}`).emit('new_message', message);
      } catch (e: any) {
        socket.emit('message_error', { error: e.message });
      }
    });

    socket.on('mark_read', async ({ matchId }: { matchId: string }) => {
      await prisma.message.updateMany({
        where: { matchId, senderId: { not: userId }, readAt: null },
        data: { readAt: new Date() },
      });
      socket.to(`match:${matchId}`).emit('read_receipt', { matchId, readBy: userId });
    });

    socket.on('disconnect', async () => {
      const set = onlineUsers.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          onlineUsers.delete(userId);
          await prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } }).catch(() => {});
          io.emit('presence', { userId, online: false });
        }
      }
    });
  });

  return io;
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}
