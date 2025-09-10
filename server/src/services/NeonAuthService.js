import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

class NeonAuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key';
    this.projectId = process.env.PROJECT_ID || 'hotel-management-system';
  }

  // Generate global user ID for cross-project access
  generateGlobalUserId() {
    return crypto.randomUUID();
  }

  // Create user with cross-project support
  async createUser(userData) {
    const { name, email, password, role = 'GUEST', projects = [] } = userData;
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const globalUserId = this.generateGlobalUserId();
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        globalUserId,
        projects: [this.projectId, ...projects],
        emailVerified: false,
      },
    });

    return this.sanitizeUser(user);
  }

  // Authenticate user across projects
  async authenticate(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        sessions: true,
      },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return this.sanitizeUser(user);
  }

  // Generate JWT token with cross-project claims
  async generateToken(user) {
    const payload = {
      userId: user.id,
      globalUserId: user.globalUserId,
      email: user.email,
      role: user.role,
      projects: user.projects,
      projectId: this.projectId,
    };

    const token = jwt.sign(payload, this.jwtSecret, { 
      expiresIn: '7d',
      issuer: 'neon-auth',
      audience: user.projects,
    });

    // Store session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        projectId: this.projectId,
      },
    });

    return token;
  }

  // Verify token and check project access
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Check if session exists and is valid
      const session = await prisma.userSession.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new Error('Session expired');
      }

      // Check if user has access to current project
      if (!decoded.projects.includes(this.projectId)) {
        throw new Error('No access to this project');
      }

      return {
        user: this.sanitizeUser(session.user),
        session: session,
        projects: decoded.projects,
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Create API key for cross-project access
  async createApiKey(userId, name, projects = []) {
    const key = `neon_${crypto.randomBytes(32).toString('hex')}`;
    
    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name,
        key,
        projects: [this.projectId, ...projects],
      },
    });

    return apiKey;
  }

  // Verify API key
  async verifyApiKey(key) {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: { user: true },
    });

    if (!apiKey || !apiKey.isActive) {
      throw new Error('Invalid API key');
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new Error('API key expired');
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() },
    });

    return {
      user: this.sanitizeUser(apiKey.user),
      apiKey: apiKey,
      projects: apiKey.projects,
    };
  }

  // Grant project access to user
  async grantProjectAccess(globalUserId, projectId) {
    const user = await prisma.user.findUnique({
      where: { globalUserId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedProjects = [...new Set([...user.projects, projectId])];
    
    return await prisma.user.update({
      where: { globalUserId },
      data: { projects: updatedProjects },
    });
  }

  // Revoke project access
  async revokeProjectAccess(globalUserId, projectId) {
    const user = await prisma.user.findUnique({
      where: { globalUserId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedProjects = user.projects.filter(p => p !== projectId);
    
    return await prisma.user.update({
      where: { globalUserId },
      data: { projects: updatedProjects },
    });
  }

  // Get user by global ID (for cross-project queries)
  async getUserByGlobalId(globalUserId) {
    const user = await prisma.user.findUnique({
      where: { globalUserId },
      include: {
        sessions: true,
        apiKeys: true,
      },
    });

    return user ? this.sanitizeUser(user) : null;
  }

  // Logout and invalidate session
  async logout(token) {
    await prisma.userSession.delete({
      where: { token },
    });
  }

  // Clean up expired sessions
  async cleanupExpiredSessions() {
    await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  // Remove sensitive data from user object
  sanitizeUser(user) {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

export default new NeonAuthService();
