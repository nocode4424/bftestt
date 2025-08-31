import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '@/integrations/supabase/client';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'bluefin-admin-secret-key-change-in-production';
const SALT_ROUNDS = 12;

export interface AdminUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  restaurant_id: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
}

export class AdminAuth {
  // Hash password for storage
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password against hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token for admin
  static generateToken(adminUser: AdminUser): string {
    return jwt.sign(
      {
        id: adminUser.id,
        username: adminUser.username,
        restaurant_id: adminUser.restaurant_id,
        role: adminUser.role
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
  }

  // Verify JWT token
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Login admin user
  static async login(username: string, password: string): Promise<{ admin: AdminUser; token: string }> {
    try {
      // Get admin user from database
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        throw new Error('Invalid username or password');
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, adminUser.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid username or password');
      }

      // Update last login time
      await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminUser.id);

      // Log access
      await supabase
        .from('admin_access_logs')
        .insert({
          admin_user_id: adminUser.id,
          action: 'login',
          timestamp: new Date().toISOString()
        });

      // Generate token
      const token = this.generateToken(adminUser);

      // Remove password hash from response
      const { password_hash, ...safeAdmin } = adminUser;

      return {
        admin: safeAdmin as AdminUser,
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Create new admin user
  static async createAdmin(userData: {
    username: string;
    password: string;
    full_name: string;
    email: string;
    restaurant_id: string;
    role?: string;
  }): Promise<AdminUser> {
    try {
      // Hash password
      const password_hash = await this.hashPassword(userData.password);

      // Insert new admin user
      const { data: newAdmin, error } = await supabase
        .from('admin_users')
        .insert({
          username: userData.username,
          password_hash,
          full_name: userData.full_name,
          email: userData.email,
          restaurant_id: userData.restaurant_id,
          role: userData.role || 'admin'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create admin user: ${error.message}`);
      }

      // Remove password hash from response
      const { password_hash: _, ...safeAdmin } = newAdmin;
      return safeAdmin as AdminUser;
    } catch (error) {
      console.error('Create admin error:', error);
      throw error;
    }
  }

  // Get admin by ID
  static async getAdmin(adminId: string): Promise<AdminUser | null> {
    try {
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('id, username, full_name, email, restaurant_id, role, is_active, last_login_at')
        .eq('id', adminId)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        return null;
      }

      return adminUser as AdminUser;
    } catch (error) {
      console.error('Get admin error:', error);
      return null;
    }
  }

  // Log admin access
  static async logAccess(adminUserId: string, action: string, resourceAccessed?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await supabase
        .from('admin_access_logs')
        .insert({
          admin_user_id: adminUserId,
          action,
          resource_accessed: resourceAccessed,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Log access error:', error);
      // Don't throw - logging failure shouldn't break the request
    }
  }
}