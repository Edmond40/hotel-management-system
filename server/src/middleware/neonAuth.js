import NeonAuthService from '../services/NeonAuthService.js';

// Middleware to verify JWT tokens
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];

    let authResult;

    if (apiKey) {
      // API Key authentication
      authResult = await NeonAuthService.verifyApiKey(apiKey);
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // JWT Token authentication
      const token = authHeader.substring(7);
      authResult = await NeonAuthService.verifyToken(token);
    } else {
      return res.status(401).json({ error: 'No authentication provided' });
    }

    req.user = authResult.user;
    req.projects = authResult.projects || authResult.apiKey?.projects || [];
    req.session = authResult.session;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};

// Middleware to check if user has access to current project
export const checkProjectAccess = (req, res, next) => {
  const projectId = process.env.PROJECT_ID || 'hotel-management-system';
  
  if (!req.projects.includes(projectId)) {
    return res.status(403).json({ 
      error: 'No access to this project',
      availableProjects: req.projects 
    });
  }
  
  next();
};

// Middleware to check user role
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: userRoles,
        current: req.user.role 
      });
    }
    
    next();
  };
};

// Middleware to check if user is admin
export const requireAdmin = requireRole('ADMIN');

// Middleware to check if user is active
export const requireActiveUser = (req, res, next) => {
  if (!req.user.isActive) {
    return res.status(403).json({ error: 'Account is deactivated' });
  }
  next();
};

// Combined authentication middleware
export const authenticate = [verifyToken, checkProjectAccess, requireActiveUser];
