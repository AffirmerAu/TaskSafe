import assert from "node:assert/strict";
import express from "express";

process.env.NEON_DATABASE_URL ??= "postgres://user:pass@localhost:5432/mock";

const { registerRoutes } = await import("./routes");
const { storage } = await import("./storage");

type AdminUserRecord = {
  id: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "ADMIN" | "SUPERVISOR";
  companyTag: string | null;
  isActive: boolean;
  createdAt: Date;
};

type OverrideMap = Partial<Record<string, (...args: any[]) => any>>;

function overrideStorage(overrides: OverrideMap) {
  const originals = new Map<string, any>();

  for (const [key, value] of Object.entries(overrides)) {
    originals.set(key, (storage as any)[key]);
    (storage as any)[key] = value;
  }

  return () => {
    for (const [key, value] of originals.entries()) {
      (storage as any)[key] = value;
    }
  };
}

const baseUser: AdminUserRecord = {
  id: "user-1",
  email: "supervisor@example.com",
  password: "hashed-password",
  role: "SUPERVISOR",
  companyTag: "ACME",
  isActive: true,
  createdAt: new Date(),
};

const sessionAdmin: AdminUserRecord = {
  id: "admin-1",
  email: "admin@example.com",
  password: "secret",
  role: "SUPER_ADMIN",
  companyTag: null,
  isActive: true,
  createdAt: new Date(),
};

function cloneUser(user: AdminUserRecord): AdminUserRecord {
  return {
    ...user,
    createdAt: new Date(user.createdAt.getTime()),
  };
}

const adminUsers: AdminUserRecord[] = [cloneUser(baseUser)];

let failures = 0;

const restoreStorage = overrideStorage({
  async getAdminUserById(id: string) {
    const match = adminUsers.find(user => user.id === id);
    return match ? cloneUser(match) : undefined;
  },
  async updateAdminUser(id: string, updates: Partial<AdminUserRecord>) {
    const user = adminUsers.find(record => record.id === id);
    if (!user) {
      throw new Error("User not found");
    }
    Object.assign(user, updates);
    return cloneUser(user);
  },
  async getAllAdminUsers() {
    return adminUsers
      .filter(user => user.isActive)
      .map(user => cloneUser(user));
  },
});

let httpServer: import("http").Server | undefined;

async function closeServer() {
  if (!httpServer) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    httpServer!.close(error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

try {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).session = { adminUser: sessionAdmin };
    next();
  });

  httpServer = await registerRoutes(app);

  await new Promise<void>((resolve, reject) => {
    httpServer!.listen(0, "127.0.0.1", () => resolve());
    httpServer!.on("error", reject);
  });

  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to determine server address");
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  const promoteResponse = await fetch(`${baseUrl}/api/admin/users/${baseUser.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "SUPER_ADMIN" }),
  });

  assert.equal(promoteResponse.status, 200, "Promotion request should succeed");
  const promotedUser = await promoteResponse.json();
  assert.equal(promotedUser.role, "SUPER_ADMIN", "User should be promoted to super admin");
  assert.equal(promotedUser.companyTag, null, "Company tag should be cleared after promotion");

  const listResponse = await fetch(`${baseUrl}/api/admin/users`);
  assert.equal(listResponse.status, 200, "Fetching all users should succeed");
  const users = await listResponse.json();
  assert.ok(Array.isArray(users), "Users response should be an array");
  assert.equal(users[0].companyTag, null, "Cleared company tag should persist");

  console.log("✓ promotes supervisors to super admin and clears company tag");
} catch (error) {
  failures += 1;
  console.error("✗ promotes supervisors to super admin and clears company tag");
  console.error(error);
} finally {
  await closeServer();
  restoreStorage();
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log("All admin routes tests passed.");
}
