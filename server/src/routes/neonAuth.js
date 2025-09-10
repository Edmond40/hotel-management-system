import express from 'express';
import NeonAuthService from '../services/NeonAuthService.js';
import { authenticate, requireAdmin } from '../middleware/neonAuth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const user = await NeonAuthService.createUser({
      name,
      email,
      password,
      role: role || 'GUEST'
    });

    const token = await NeonAuthService.generateToken(user);

    res.status(201).json({
      message: 'User created successfully',
      user,
      token,
      projects: user.projects
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await NeonAuthService.authenticate(email, password);
    const token = await NeonAuthService.generateToken(user);

    res.json({
      message: 'Login successful',
      user,
      token,
      projects: user.projects
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Logout user
router.post('/logout', authenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await NeonAuthService.logout(token);
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await NeonAuthService.getUserByGlobalId(req.user.globalUserId);
    res.json({
      user,
      projects: req.projects,
      currentProject: process.env.PROJECT_ID || 'hotel-management-system'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create API key for cross-project access
router.post('/api-keys', authenticate, async (req, res) => {
  try {
    const { name, projects } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'API key name is required' });
    }

    const apiKey = await NeonAuthService.createApiKey(
      req.user.id,
      name,
      projects || []
    );

    res.status(201).json({
      message: 'API key created successfully',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key,
        projects: apiKey.projects,
        createdAt: apiKey.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Grant project access to user (Admin only)
router.post('/grant-access', authenticate, requireAdmin, async (req, res) => {
  try {
    const { globalUserId, projectId } = req.body;

    if (!globalUserId || !projectId) {
      return res.status(400).json({ error: 'Global user ID and project ID are required' });
    }

    const user = await NeonAuthService.grantProjectAccess(globalUserId, projectId);

    res.json({
      message: 'Project access granted successfully',
      user: NeonAuthService.sanitizeUser(user)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Revoke project access (Admin only)
router.post('/revoke-access', authenticate, requireAdmin, async (req, res) => {
  try {
    const { globalUserId, projectId } = req.body;

    if (!globalUserId || !projectId) {
      return res.status(400).json({ error: 'Global user ID and project ID are required' });
    }

    const user = await NeonAuthService.revokeProjectAccess(globalUserId, projectId);

    res.json({
      message: 'Project access revoked successfully',
      user: NeonAuthService.sanitizeUser(user)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify token endpoint (for other projects to verify tokens)
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const authResult = await NeonAuthService.verifyToken(token);

    res.json({
      valid: true,
      user: authResult.user,
      projects: authResult.projects,
      session: {
        id: authResult.session.id,
        expiresAt: authResult.session.expiresAt
      }
    });
  } catch (error) {
    res.status(401).json({ 
      valid: false, 
      error: error.message 
    });
  }
});

// Clean up expired sessions (Admin only)
router.post('/cleanup', authenticate, requireAdmin, async (req, res) => {
  try {
    await NeonAuthService.cleanupExpiredSessions();
    res.json({ message: 'Expired sessions cleaned up successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
