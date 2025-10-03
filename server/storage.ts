import {
  videos,
  magicLinks,
  accessLogs,
  adminUsers,
  companyTags,
  type Video,
  type InsertVideo,
  type MagicLink,
  type InsertMagicLink,
  type AccessLog,
  type InsertAccessLog,
  type AdminUser,
  type InsertAdminUser,
  type CompanyTag,
  type InsertCompanyTag,
  type SupervisorCreate,
  type SupervisorUpdate
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sum, or, sql } from "drizzle-orm";

export interface IStorage {
  // Video methods
  getVideo(id: string): Promise<Video | undefined>;
  getActiveVideo(): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, video: Partial<InsertVideo>): Promise<Video>;
  getAllVideos(companyTag?: string): Promise<Video[]>;
  deleteVideo(id: string): Promise<void>;
  
  // Magic link methods
  createMagicLink(magicLink: InsertMagicLink & { token: string; expiresAt: Date }): Promise<MagicLink>;
  getMagicLinkByToken(token: string): Promise<MagicLink | undefined>;
  markMagicLinkAsUsed(id: string): Promise<void>;
  
  // Access log methods
  createAccessLog(accessLog: InsertAccessLog): Promise<AccessLog>;
  updateAccessLog(id: string, updates: { watchDuration?: number; completionPercentage?: number }): Promise<void>;
  markAccessLogCompletionNotified(id: string): Promise<void>;
  getAccessLogsByVideo(videoId: string): Promise<AccessLog[]>;
  getAccessLogById(id: string): Promise<(AccessLog & { videoTitle: string | null; videoDuration: string | null; videoCategory: string | null }) | undefined>;
  getAllAccessLogs(companyTag?: string): Promise<(AccessLog & { videoTitle: string | null })[]>;
  getVideoAnalytics(videoId: string): Promise<{
    totalViews: number;
    totalWatchTime: number;
    averageCompletion: number;
    uniqueViewers: number;
  }>;

  // Admin user methods
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  getAdminUserById(id: string): Promise<AdminUser | undefined>;
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  getAllAdminUsers(): Promise<AdminUser[]>;
  updateAdminUser(id: string, adminUser: Partial<InsertAdminUser>): Promise<AdminUser>;
  deleteAdminUser(id: string): Promise<void>;
  getSupervisors(companyTag?: string): Promise<AdminUser[]>;
  createSupervisor(supervisor: SupervisorCreate & { role?: "SUPERVISOR" }): Promise<AdminUser>;
  updateSupervisor(id: string, supervisor: SupervisorUpdate & { role?: "SUPERVISOR" }): Promise<AdminUser>;

  // Company tag methods
  getCompanyTagByName(name: string): Promise<CompanyTag | undefined>;
  getAllCompanyTags(): Promise<CompanyTag[]>;
  createCompanyTag(companyTag: InsertCompanyTag): Promise<CompanyTag>;
  updateCompanyTag(id: string, companyTag: Partial<InsertCompanyTag>): Promise<CompanyTag>;
  deleteCompanyTag(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getVideo(id: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || undefined;
  }

  async getActiveVideo(): Promise<Video | undefined> {
    const [video] = await db.select().from(videos)
      .where(eq(videos.isActive, true))
      .orderBy(desc(videos.createdAt))
      .limit(1);
    return video || undefined;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db
      .insert(videos)
      .values(insertVideo)
      .returning();
    return video;
  }

  async createMagicLink(magicLink: InsertMagicLink & { token: string; expiresAt: Date }): Promise<MagicLink> {
    const [link] = await db
      .insert(magicLinks)
      .values(magicLink)
      .returning();
    return link;
  }

  async getMagicLinkByToken(token: string): Promise<MagicLink | undefined> {
    const [link] = await db.select().from(magicLinks)
      .where(eq(magicLinks.token, token));
    return link || undefined;
  }

  async markMagicLinkAsUsed(id: string): Promise<void> {
    await db.update(magicLinks)
      .set({ isUsed: true })
      .where(eq(magicLinks.id, id));
  }

  async createAccessLog(accessLog: InsertAccessLog): Promise<AccessLog> {
    const [log] = await db
      .insert(accessLogs)
      .values(accessLog)
      .returning();
    return log;
  }

  async updateAccessLog(id: string, updates: { watchDuration?: number; completionPercentage?: number }): Promise<void> {
    const normalizedUpdates: { watchDuration?: number; completionPercentage?: number } = {
      ...updates,
    };

    const { completionPercentage } = updates;
    if (typeof completionPercentage === "number") {
      normalizedUpdates.completionPercentage = Math.min(100, completionPercentage);
    }

    await db.update(accessLogs)
      .set({ ...normalizedUpdates })
      .where(eq(accessLogs.id, id));
  }

  async markAccessLogCompletionNotified(id: string): Promise<void> {
    await db
      .update(accessLogs)
      .set({ completionNotified: true })
      .where(eq(accessLogs.id, id));
  }

  async getAccessLogsByVideo(videoId: string): Promise<AccessLog[]> {
    return await db.select().from(accessLogs)
      .where(eq(accessLogs.videoId, videoId))
      .orderBy(desc(accessLogs.accessedAt));
  }

  async getAccessLogById(id: string): Promise<(AccessLog & { videoTitle: string | null; videoDuration: string | null; videoCategory: string | null }) | undefined> {
    const [result] = await db.select({
      id: accessLogs.id,
      magicLinkId: accessLogs.magicLinkId,
      email: accessLogs.email,
      userName: accessLogs.userName,
      videoId: accessLogs.videoId,
      accessedAt: accessLogs.accessedAt,
      watchDuration: accessLogs.watchDuration,
      completionPercentage: accessLogs.completionPercentage,
      companyTag: accessLogs.companyTag,
      ipAddress: accessLogs.ipAddress,
      userAgent: accessLogs.userAgent,
      completionNotified: accessLogs.completionNotified,
      videoTitle: videos.title,
      videoDuration: videos.duration,
      videoCategory: videos.category,
    })
    .from(accessLogs)
    .leftJoin(videos, eq(accessLogs.videoId, videos.id))
    .where(eq(accessLogs.id, id));
    
    return result || undefined;
  }

  async getAllVideos(companyTag?: string): Promise<Video[]> {
    const query = db.select().from(videos);
    if (companyTag) {
      const normalizedTag = companyTag.trim();
      return await query
        .where(eq(videos.companyTag, normalizedTag))
        .orderBy(desc(videos.createdAt));
    }
    return await query.orderBy(desc(videos.createdAt));
  }

  async updateVideo(id: string, video: Partial<InsertVideo>): Promise<Video> {
    const [updatedVideo] = await db
      .update(videos)
      .set(video)
      .where(eq(videos.id, id))
      .returning();
    return updatedVideo;
  }

  async deleteVideo(id: string): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  async getAllAccessLogs(companyTag?: string): Promise<(AccessLog & { videoTitle: string | null })[]> {
    const query = db.select({
      id: accessLogs.id,
      magicLinkId: accessLogs.magicLinkId,
      email: accessLogs.email,
      userName: accessLogs.userName,
      videoId: accessLogs.videoId,
      accessedAt: accessLogs.accessedAt,
      watchDuration: accessLogs.watchDuration,
      completionPercentage: accessLogs.completionPercentage,
      companyTag: accessLogs.companyTag,
      ipAddress: accessLogs.ipAddress,
      userAgent: accessLogs.userAgent,
      completionNotified: accessLogs.completionNotified,
      videoTitle: videos.title,
    })
    .from(accessLogs)
    .leftJoin(videos, eq(accessLogs.videoId, videos.id));

    if (companyTag) {
      const normalizedTag = companyTag.trim();
      return await query
        .where(
          or(
            eq(videos.companyTag, normalizedTag),
            eq(accessLogs.companyTag, normalizedTag),
          ),
        )
        .orderBy(desc(accessLogs.accessedAt));
    }
    return await query.orderBy(desc(accessLogs.accessedAt));
  }

  async getVideoAnalytics(videoId: string): Promise<{
    totalViews: number;
    totalWatchTime: number;
    averageCompletion: number;
    uniqueViewers: number;
  }> {
    const analytics = await db.select({
      totalViews: count(),
      totalWatchTime: sum(accessLogs.watchDuration),
      averageCompletion: sum(accessLogs.completionPercentage),
      uniqueViewers: count(accessLogs.email)
    }).from(accessLogs)
    .where(eq(accessLogs.videoId, videoId));

    const result = analytics[0];
    return {
      totalViews: result.totalViews || 0,
      totalWatchTime: Number(result.totalWatchTime) || 0,
      averageCompletion: result.totalViews > 0 ? Math.round((Number(result.averageCompletion) || 0) / result.totalViews) : 0,
      uniqueViewers: result.uniqueViewers || 0,
    };
  }

  // Admin user methods
  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers)
      .where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true)));
    return user || undefined;
  }

  async getAdminUserById(id: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers)
      .where(and(eq(adminUsers.id, id), eq(adminUsers.isActive, true)));
    return user || undefined;
  }

  async createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser> {
    const [user] = await db
      .insert(adminUsers)
      .values(adminUser)
      .returning();
    return user;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers)
      .where(and(
        eq(adminUsers.isActive, true),
        or(
          eq(adminUsers.role, "ADMIN"),
          eq(adminUsers.role, "SUPER_ADMIN")
        )
      ))
      .orderBy(desc(adminUsers.createdAt));
  }

  async updateAdminUser(id: string, adminUser: Partial<InsertAdminUser>): Promise<AdminUser> {
    const [updatedUser] = await db
      .update(adminUsers)
      .set(adminUser)
      .where(eq(adminUsers.id, id))
      .returning();
    return updatedUser;
  }

  async deleteAdminUser(id: string): Promise<void> {
    await db.update(adminUsers)
      .set({ isActive: false })
      .where(eq(adminUsers.id, id));
  }

  async getSupervisors(companyTag?: string): Promise<AdminUser[]> {
    const conditions = [
      eq(adminUsers.role, "SUPERVISOR"),
      eq(adminUsers.isActive, true),
    ];

    if (companyTag) {
      conditions.push(eq(adminUsers.companyTag, companyTag));
    }

    return await db.select().from(adminUsers)
      .where(and(...conditions))
      .orderBy(desc(adminUsers.createdAt));
  }

  async createSupervisor(supervisor: SupervisorCreate & { role?: "SUPERVISOR" }): Promise<AdminUser> {
    const values: InsertAdminUser = {
      email: supervisor.email,
      password: supervisor.password,
      role: "SUPERVISOR",
    };

    if (supervisor.companyTag) {
      values.companyTag = supervisor.companyTag;
    }

    const [user] = await db
      .insert(adminUsers)
      .values(values)
      .returning();
    return user;
  }

  async updateSupervisor(id: string, supervisor: SupervisorUpdate & { role?: "SUPERVISOR" }): Promise<AdminUser> {
    const updates: Partial<InsertAdminUser> = {
      role: "SUPERVISOR",
    };

    if (supervisor.email !== undefined) {
      updates.email = supervisor.email;
    }

    if (supervisor.password !== undefined) {
      updates.password = supervisor.password;
    }

    if (supervisor.companyTag !== undefined) {
      updates.companyTag = supervisor.companyTag;
    }

    const [user] = await db
      .update(adminUsers)
      .set(updates)
      .where(eq(adminUsers.id, id))
      .returning();
    return user;
  }

  // Company tag methods
  async getCompanyTagByName(name: string): Promise<CompanyTag | undefined> {
    const [companyTag] = await db.select().from(companyTags)
      .where(and(eq(companyTags.name, name), eq(companyTags.isActive, true)))
      .limit(1);
    return companyTag || undefined;
  }

  async getAllCompanyTags(): Promise<CompanyTag[]> {
    return await db.select().from(companyTags)
      .where(eq(companyTags.isActive, true))
      .orderBy(desc(companyTags.createdAt));
  }

  async createCompanyTag(insertCompanyTag: InsertCompanyTag): Promise<CompanyTag> {
    const [companyTag] = await db
      .insert(companyTags)
      .values(insertCompanyTag)
      .returning();
    return companyTag;
  }

  async updateCompanyTag(id: string, companyTag: Partial<InsertCompanyTag>): Promise<CompanyTag> {
    const [updatedCompanyTag] = await db
      .update(companyTags)
      .set(companyTag)
      .where(eq(companyTags.id, id))
      .returning();
    return updatedCompanyTag;
  }

  async deleteCompanyTag(id: string): Promise<void> {
    await db.update(companyTags)
      .set({ isActive: false })
      .where(eq(companyTags.id, id));
  }
}

export const storage = new DatabaseStorage();
