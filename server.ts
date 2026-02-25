import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import { z } from "zod";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.SESSION_SECRET || "nexus-quantum-secret-key-2026";

const dbPath = process.env.VERCEL ? "/tmp/nexus.db" : "nexus.db";
const db = new Database(dbPath);

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    username TEXT,
    password TEXT,
    role TEXT DEFAULT 'user',
    balance REAL DEFAULT 0,
    active_node TEXT,
    referral_code TEXT UNIQUE,
    referred_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    currency TEXT,
    blockchain TEXT,
    tx_hash TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    currency TEXT,
    blockchain TEXT,
    address TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    node_name TEXT,
    amount REAL,
    target_amount REAL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS referral_bonuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    referred_user_id INTEGER,
    amount REAL,
    tier INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(referred_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS node_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER,
    action TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(node_id) REFERENCES user_nodes(id)
  );
`);

// Migration: Add username column if it doesn't exist
try {
  db.exec("ALTER TABLE users ADD COLUMN username TEXT");
} catch (e) {}

// Migration: Add active_node column if it doesn't exist
try {
  db.exec("ALTER TABLE users ADD COLUMN active_node TEXT");
} catch (e) {
  // Column already exists or other error
}

// Migration: Add reset_token column if it doesn't exist
try {
  db.exec("ALTER TABLE users ADD COLUMN reset_token TEXT");
} catch (e) {}

// Migration: Add preferences column if it doesn't exist
try {
  db.exec("ALTER TABLE users ADD COLUMN preferences TEXT DEFAULT '{\"market\":true,\"nodes\":true,\"bonuses\":true}'");
} catch (e) {}

// Seed Admin
const admins = [
  { email: "optrillionaire@gmail.com", password: "Asdfghjkl@123" },
  { email: "blaxk444r@gmail.com", password: "Asdfghjkl@123" }
];

for (const admin of admins) {
  const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(admin.email) as any;
  const hashedPassword = bcrypt.hashSync(admin.password, 10);

  if (!existingAdmin) {
    db.prepare("INSERT INTO users (email, password, role, referral_code) VALUES (?, ?, ?, ?)").run(
      admin.email,
      hashedPassword,
      "admin",
      "ADMIN_" + admin.email.split('@')[0].toUpperCase()
    );
  } else if (bcrypt.compareSync(admin.password, existingAdmin.password) === false) {
    // Update password if it doesn't match (optional, but good for dev)
    // db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, existingAdmin.id);
  }
}

const app = express();
app.use(express.json());
app.use(cookieParser());

const PORT = 3000;

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.nexus_token || req.headers.authorization?.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id);
    if (!user) return res.status(401).json({ error: "Unauthorized: User not found" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

const adminOnly = (req: any, res: any, next: any) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  next();
};

// Validation Schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).optional(),
  password: z.string().min(8),
  referralCode: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// API Routes
app.post("/api/register", (req, res) => {
  try {
    const { email, username, password, referralCode } = RegisterSchema.parse(req.body);
    const hashedPassword = bcrypt.hashSync(password, 10);
    const refUser = referralCode ? db.prepare("SELECT id FROM users WHERE referral_code = ?").get(referralCode) : null;
    const newRefCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    
    const result = db.prepare("INSERT INTO users (email, username, password, referral_code, referred_by) VALUES (?, ?, ?, ?, ?)").run(
      email,
      username || null,
      hashedPassword,
      newRefCode,
      refUser ? (refUser as any).id : null
    );
    
    const token = jwt.sign({ id: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('nexus_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ id: result.lastInsertRowid, token });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.issues[0].message });
    }
    res.status(400).json({ error: "Email already exists or registration failed" });
  }
});

app.post("/api/login", (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.cookie('nexus_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (e: any) {
    res.status(400).json({ error: "Invalid input" });
  }
});

app.post("/api/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!user) {
    // For security, don't reveal if email exists, just return success
    return res.json({ message: "If an account exists, a reset link has been sent." });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  db.prepare("UPDATE users SET reset_token = ? WHERE id = ?").run(resetToken, user.id);

  // In a real app, send an email here. For demo, we'll return the token in the response
  // or simulate sending an email.
  res.json({ message: "If an account exists, a reset link has been sent.", token: resetToken });
});

app.post("/api/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Invalid token or password too short" });
  }

  const user = db.prepare("SELECT * FROM users WHERE reset_token = ?").get(token) as any;
  if (!user) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password = ?, reset_token = NULL WHERE id = ?").run(hashedPassword, user.id);

  res.json({ message: "Password has been reset successfully" });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie('nexus_token');
  res.json({ success: true });
});

app.post("/api/verify-password", authenticate, (req: any, res) => {
  const { password } = req.body;
  if (bcrypt.compareSync(password, req.user.password)) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

app.post("/api/profile/update-password", authenticate, async (req: any, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, req.user.id);
    res.json({ message: "Password updated successfully" });
  } catch (e) {
    res.status(500).json({ error: "Failed to update password" });
  }
});

app.post("/api/profile/update", authenticate, (req: any, res) => {
  const { email, username } = req.body;
  
  try {
    if (email) {
      const existing = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, req.user.id);
      if (existing) return res.status(400).json({ error: "Email already in use" });
      db.prepare("UPDATE users SET email = ? WHERE id = ?").run(email, req.user.id);
    }
    if (username) {
      db.prepare("UPDATE users SET username = ? WHERE id = ?").run(username, req.user.id);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.get("/api/me", authenticate, (req: any, res) => {
  const user = db.prepare("SELECT id, email, username, role, balance, referral_code, referred_by, created_at, preferences FROM users WHERE id = ?").get(req.user.id);
  res.json(user);
});

app.post("/api/profile/preferences", authenticate, (req: any, res) => {
  const { preferences } = req.body;
  try {
    db.prepare("UPDATE users SET preferences = ? WHERE id = ?").run(JSON.stringify(preferences), req.user.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// Market Data Simulation
app.get("/api/market-data", (req, res) => {
  const data = [];
  const now = Date.now();
  let price = 65000;
  for (let i = 30; i >= 0; i--) {
    price += (Math.random() - 0.5) * 1000;
    data.push({
      time: new Date(now - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
      price: Math.round(price),
      volume: Math.round(Math.random() * 5000 + 1000)
    });
  }
  res.json(data);
});

app.post("/api/deposits", authenticate, (req: any, res) => {
  const { amount, currency, blockchain, txHash } = req.body;
  const result = db.prepare("INSERT INTO deposits (user_id, amount, currency, blockchain, tx_hash) VALUES (?, ?, ?, ?, ?)").run(
    req.user.id,
    amount,
    currency,
    blockchain,
    txHash
  );
  res.json({ id: result.lastInsertRowid });
});

app.post("/api/withdrawals", authenticate, (req: any, res) => {
  const { amount, currency, blockchain, address } = req.body;
  if (req.user.balance < amount) return res.status(400).json({ error: "Insufficient balance" });
  
  const result = db.prepare("INSERT INTO withdrawals (user_id, amount, currency, blockchain, address) VALUES (?, ?, ?, ?, ?)").run(
    req.user.id,
    amount,
    currency,
    blockchain,
    address
  );
  
  // Deduct balance immediately or on approval? Usually on request to prevent double spend.
  db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, req.user.id);
  
  res.json({ id: result.lastInsertRowid });
});

app.get("/api/referrals", authenticate, (req: any, res) => {
  const referrals = db.prepare("SELECT email, created_at, balance FROM users WHERE referred_by = ?").all(req.user.id);
  res.json(referrals);
});

app.get("/api/history/withdrawals", authenticate, (req: any, res) => {
  const history = db.prepare("SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
  res.json(history);
});

app.get("/api/history/deposits", authenticate, (req: any, res) => {
  const history = db.prepare("SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
  res.json(history);
});

app.get("/api/user-nodes", authenticate, (req: any, res) => {
  const nodes = db.prepare("SELECT * FROM user_nodes WHERE user_id = ? AND status = 'active'").all(req.user.id);
  res.json(nodes);
});

app.get("/api/user-nodes/:id/activity", authenticate, (req: any, res) => {
  const node = db.prepare("SELECT * FROM user_nodes WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!node) return res.status(404).json({ error: "Node not found" });
  const activity = db.prepare("SELECT * FROM node_activity WHERE node_id = ? ORDER BY created_at DESC").all(req.params.id);
  res.json(activity);
});

app.post("/api/nodes/activate", authenticate, (req: any, res) => {
  const { nodeName, amount, targetAmount } = req.body;
  
  if (req.user.balance < amount) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  db.transaction(() => {
    db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, req.user.id);
    const nodeResult = db.prepare("INSERT INTO user_nodes (user_id, node_name, amount, target_amount) VALUES (?, ?, ?, ?)").run(
      req.user.id,
      nodeName,
      amount,
      targetAmount
    );
    const nodeId = nodeResult.lastInsertRowid;

    db.prepare("INSERT INTO node_activity (node_id, action, details) VALUES (?, ?, ?)").run(
      nodeId,
      "ACTIVATION",
      `Node ${nodeName} initialized with $${amount.toLocaleString()} capital.`
    );

    // MLM Rewards on Node Activation
    const user = db.prepare("SELECT referred_by FROM users WHERE id = ?").get(req.user.id) as any;
    if (user?.referred_by) {
      // Tier 1: 7%
      const bonus1 = amount * 0.07;
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(bonus1, user.referred_by);
      db.prepare("INSERT INTO referral_bonuses (user_id, referred_user_id, amount, tier) VALUES (?, ?, ?, ?)").run(user.referred_by, req.user.id, bonus1, 1);
      
      const tier2User = db.prepare("SELECT referred_by FROM users WHERE id = ?").get(user.referred_by) as any;
      if (tier2User?.referred_by) {
        // Tier 2: 3%
        const bonus2 = amount * 0.03;
        db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(bonus2, tier2User.referred_by);
        db.prepare("INSERT INTO referral_bonuses (user_id, referred_user_id, amount, tier) VALUES (?, ?, ?, ?)").run(tier2User.referred_by, req.user.id, bonus2, 2);
        
        const tier3User = db.prepare("SELECT referred_by FROM users WHERE id = ?").get(tier2User.referred_by) as any;
        if (tier3User?.referred_by) {
          // Tier 3: 1%
          const bonus3 = amount * 0.01;
          db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(bonus3, tier3User.referred_by);
          db.prepare("INSERT INTO referral_bonuses (user_id, referred_user_id, amount, tier) VALUES (?, ?, ?, ?)").run(tier3User.referred_by, req.user.id, bonus3, 3);
        }
      }
    }
  })();

  res.json({ success: true });
});

app.get("/api/referral-bonuses", authenticate, (req: any, res) => {
  const bonuses = db.prepare(`
    SELECT rb.*, u.email as referred_email, u.username as referred_username 
    FROM referral_bonuses rb
    JOIN users u ON rb.referred_user_id = u.id
    WHERE rb.user_id = ? 
    ORDER BY rb.created_at DESC
  `).all(req.user.id);
  res.json(bonuses);
});

app.post("/api/support-tickets", authenticate, (req: any, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) return res.status(400).json({ error: "Subject and message are required" });
  
  const result = db.prepare("INSERT INTO support_tickets (user_id, subject, message) VALUES (?, ?, ?)").run(req.user.id, subject, message);
  res.json({ id: result.lastInsertRowid, success: true });
});

app.get("/api/support-tickets", authenticate, (req: any, res) => {
  const tickets = db.prepare("SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
  res.json(tickets);
});

// Admin Routes
app.get("/api/admin/deposits", authenticate, adminOnly, (req, res) => {
  const deposits = db.prepare(`
    SELECT d.*, u.email as user_email 
    FROM deposits d 
    JOIN users u ON d.user_id = u.id 
    ORDER BY d.created_at DESC
  `).all();
  res.json(deposits);
});

app.post("/api/admin/deposits/:id/approve", authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  const deposit = db.prepare("SELECT * FROM deposits WHERE id = ?").get(id) as any;
  if (!deposit || deposit.status !== "pending") return res.status(400).json({ error: "Invalid deposit" });

  db.transaction(() => {
    db.prepare("UPDATE deposits SET status = 'approved' WHERE id = ?").run(id);
    db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(deposit.amount, deposit.user_id);
  })();
  
  res.json({ success: true });
});

app.post("/api/admin/deposits/:id/decline", authenticate, adminOnly, (req, res) => {
  db.prepare("UPDATE deposits SET status = 'declined' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.get("/api/admin/withdrawals", authenticate, adminOnly, (req, res) => {
  const withdrawals = db.prepare(`
    SELECT w.*, u.email as user_email 
    FROM withdrawals w 
    JOIN users u ON w.user_id = u.id 
    ORDER BY w.created_at DESC
  `).all();
  res.json(withdrawals);
});

app.post("/api/admin/withdrawals/:id/approve", authenticate, adminOnly, (req, res) => {
  db.prepare("UPDATE withdrawals SET status = 'approved' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.post("/api/admin/withdrawals/:id/decline", authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  const withdrawal = db.prepare("SELECT * FROM withdrawals WHERE id = ?").get(id) as any;
  if (!withdrawal || withdrawal.status !== "pending") return res.status(400).json({ error: "Invalid withdrawal" });

  db.transaction(() => {
    db.prepare("UPDATE withdrawals SET status = 'declined' WHERE id = ?").run(id);
    db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(withdrawal.amount, withdrawal.user_id);
  })();
  res.json({ success: true });
});

app.get("/api/admin/support-tickets", authenticate, adminOnly, (req, res) => {
  const tickets = db.prepare(`
    SELECT t.*, u.email as user_email 
    FROM support_tickets t 
    JOIN users u ON t.user_id = u.id 
    ORDER BY t.created_at DESC
  `).all();
  res.json(tickets);
});

app.post("/api/admin/support-tickets/:id/resolve", authenticate, adminOnly, (req, res) => {
  db.prepare("UPDATE support_tickets SET status = 'resolved' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.get("/api/admin/users", authenticate, adminOnly, (req, res) => {
  const users = db.prepare("SELECT * FROM users").all();
  res.json(users);
});

app.post("/api/admin/users/:id/adjust", authenticate, adminOnly, (req, res) => {
  const { amount } = req.body; // Positive for reward, negative for penalty
  db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, req.params.id);
  res.json({ success: true });
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else if (!process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

// Only listen if not running in Vercel (serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
