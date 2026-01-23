import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from '../../lib/db.js';

interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10");

/**
 * Generate JWT tokens (access + refresh)
 */
const generateTokens = (userId: string, username: string) => {
  const accessToken = jwt.sign({ userId, username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ userId, username }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

/**
 * @route   POST /api/v1/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
export const signup = async (req: Request, res: Response) => {
  try {
    const { username, password, month, day, year, gender } = req.body;

    // Check if username already exists
    const existingUserResult = await db.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );

    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username already taken",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Get client IP and device info
    const ipAddress = req.ip || req.socket.remoteAddress || "";
    const deviceFingerprint = req.headers["user-agent"] || "";

    // Create user (using camelCase column names)
    // Set displayName = username by default
    const userResult = await db.query(
      `INSERT INTO users (username, "displayName", password, "birthMonth", "birthDay", "birthYear", gender, "ipAddress", "deviceFingerprint")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, username, "displayName" as display_name, "isVerified" as is_verified, "createdAt" as created_at`,
      [
        username,
        username,
        hashedPassword,
        month,
        parseInt(day),
        parseInt(year),
        gender || null,
        ipAddress,
        deviceFingerprint,
      ],
    );

    const user = userResult.rows[0];

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.username,
    );

    // Store refresh token in database
    await db.query('UPDATE users SET "refreshToken" = $1 WHERE id = $2', [
      refreshToken,
      user.id,
    ]);

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          isVerified: user.is_verified,
          createdAt: user.created_at,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const userResult = await db.query(
      'SELECT id, username, "displayName" as display_name, password, "isBanned" as is_banned, "banReason" as ban_reason, "isVerified" as is_verified FROM users WHERE username = $1',
      [username],
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Username not found",
      });
    }

    const user = userResult.rows[0];

    // Check if user is banned
    if (user.is_banned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned",
        reason: user.ban_reason || "No reason provided",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.username,
    );

    // Get client IP and device info
    const ipAddress = req.ip || req.socket.remoteAddress || "";
    const deviceFingerprint = req.headers["user-agent"] || "";

    // Update user login info and set presence to online
    await db.query(
      'UPDATE users SET "refreshToken" = $1, "lastLogin" = $2, "ipAddress" = $3, "deviceFingerprint" = $4, "presenceStatus" = $5, "lastOnline" = $6 WHERE id = $7',
      [refreshToken, new Date(), ipAddress, deviceFingerprint, 'online', new Date(), user.id],
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
          isVerified: user.is_verified,
          lastLogin: new Date(),
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 */
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    // Extract user ID from JWT (would be set by auth middleware)
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Clear refresh token and set presence to offline
    await db.query('UPDATE users SET "refreshToken" = NULL, "presenceStatus" = $1, "lastOnline" = $2 WHERE id = $3', [
      'offline',
      new Date(),
      userId,
    ]);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Find user and verify refresh token matches
    const userResult = await db.query(
      'SELECT id, username, "refreshToken" as refresh_token FROM users WHERE id = $1',
      [decoded.userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    if (user.refresh_token !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user.id, user.username);

    // Update refresh token in database
    await db.query('UPDATE users SET "refreshToken" = $1 WHERE id = $2', [
      tokens.refreshToken,
      user.id,
    ]);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: tokens,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify user email
 * @access  Public
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Find user with verification token
    const userResult = await db.query(
      'SELECT id FROM users WHERE "verificationToken" = $1',
      [token],
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    const user = userResult.rows[0];

    // Update user as verified
    await db.query(
      'UPDATE users SET "isVerified" = true, "verificationToken" = NULL WHERE id = $1',
      [user.id],
    );

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
