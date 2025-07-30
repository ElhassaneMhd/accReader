const express = require('express');
const { User } = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { protect, restrictTo } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

// Protect all routes
router.use(protect);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, client, pmta_user]
 *     responses:
 *       200:
 *         description: List of users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (req.query.role) {
      whereClause.role = req.query.role;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      attributes: { exclude: ['password', 'resetPasswordToken'] },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('getAllUsers error:', error);
    return next(new AppError('Error fetching users', 500));
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'resetPasswordToken'] }
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Users can only access their own data unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return next(new AppError('You can only access your own user data', 403));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('getUser error:', error);
    return next(new AppError('Error fetching user', 500));
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, client, pmta_user]
 *               isActive:
 *                 type: boolean
 *               mailwizzApiKey:
 *                 type: string
 *               pmtaAccess:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Users can only update their own data unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return next(new AppError('You can only update your own user data', 403));
    }

    // Restrict role updates to admin only
    if (req.body.role && req.user.role !== 'admin') {
      return next(new AppError('Only admins can update user roles', 403));
    }

    // Restrict isActive updates to admin only
    if (typeof req.body.isActive !== 'undefined' && req.user.role !== 'admin') {
      return next(new AppError('Only admins can activate/deactivate users', 403));
    }

    // Update allowed fields
    const allowedFields = ['name', 'email', 'mailwizzApiKey', 'pmtaAccess'];
    if (req.user.role === 'admin') {
      allowedFields.push('role', 'isActive');
    }

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    // Remove sensitive data from response
    user.password = undefined;

    logger.info(`User updated: ${user.email} by ${req.user.email}`);

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('updateUser error:', error);
    return next(new AppError('Error updating user', 500));
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: User deleted successfully
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Prevent admin from deleting themselves
    if (req.user.id === user.id) {
      return next(new AppError('You cannot delete your own account', 400));
    }

    await user.destroy();

    logger.info(`User deleted: ${user.email} by ${req.user.email}`);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('deleteUser error:', error);
    return next(new AppError('Error deleting user', 500));
  }
};

// Apply route handlers
router.get('/', restrictTo('admin'), getAllUsers);
router.get('/:id', getUser);
router.patch('/:id', updateUser);
router.delete('/:id', restrictTo('admin'), deleteUser);

module.exports = router;
