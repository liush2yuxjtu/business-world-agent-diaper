import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const SEED_VERSION = "business-world-diaper-v1";
export const SIMULATED_AS_OF = "2026-09-17T06:00:00.000Z";

let database: DatabaseSync | null = null;

function resolveMockDbPath() {
  const configured = process.env.BUSINESS_WORLD_MOCK_DB_PATH?.trim();
  if (configured) return configured;

  if (process.env.VERCEL) {
    return "/tmp/business-world-agent.sqlite";
  }

  return join(process.cwd(), ".eve", "business-world-agent.sqlite");
}

function createSchema(db: DatabaseSync) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS mock_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS persona (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      segment TEXT NOT NULL,
      primary_need TEXT NOT NULL,
      price_sensitivity TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content_asset (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      format TEXT NOT NULL,
      persona_focus TEXT NOT NULL,
      published_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content_metric (
      content_id TEXT PRIMARY KEY,
      play_count INTEGER NOT NULL,
      like_count INTEGER NOT NULL,
      comment_count INTEGER NOT NULL,
      share_count INTEGER NOT NULL,
      collect_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audience_comment (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      text TEXT NOT NULL,
      sentiment TEXT NOT NULL,
      intent TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS live_room (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      started_at TEXT NOT NULL,
      duration_sec INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS live_metric (
      room_id TEXT PRIMARY KEY,
      exposure_uv INTEGER NOT NULL,
      watch_uv INTEGER NOT NULL,
      avg_watch_sec INTEGER NOT NULL,
      peak_online INTEGER NOT NULL,
      comment_count INTEGER NOT NULL,
      like_count INTEGER NOT NULL,
      product_click_uv INTEGER NOT NULL,
      add_cart_uv INTEGER NOT NULL,
      paid_orders INTEGER NOT NULL,
      gmv_cents INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaign (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      objective TEXT NOT NULL,
      status TEXT NOT NULL,
      budget_cents INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaign_metric (
      campaign_id TEXT PRIMARY KEY,
      spend_cents INTEGER NOT NULL,
      impressions INTEGER NOT NULL,
      clicks INTEGER NOT NULL,
      conversions INTEGER NOT NULL,
      revenue_cents INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      size TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      stock INTEGER NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS business_order (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS aftersale (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      refund_cents INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function seedDatabase(db: DatabaseSync) {
  const row = db.prepare("SELECT value FROM mock_meta WHERE key = 'seed_version'").get() as
    | { value: string }
    | undefined;
  if (row?.value === SEED_VERSION) return;

  db.exec("BEGIN");
  try {
    for (const table of [
      "aftersale",
      "business_order",
      "product",
      "campaign_metric",
      "campaign",
      "live_metric",
      "live_room",
      "audience_comment",
      "content_metric",
      "content_asset",
      "persona",
    ]) {
      db.exec(`DELETE FROM ${table}`);
    }

    const insertPersona = db.prepare(
      "INSERT INTO persona (id, name, segment, primary_need, price_sensitivity) VALUES (?, ?, ?, ?, ?)",
    );
    [
      ["xiaoyu", "小雨", "新手妈妈", "安全、透气、夜间不漏", "medium"],
      ["alin", "阿琳", "精打细算宝妈", "大包装、稳定复购、直播福利", "high"],
      ["wangayi", "王阿姨", "带娃长辈", "简单、放心、舒适、可信口碑", "medium"],
      ["mia", "Mia", "分享型妈妈", "颜值、内容感、社交认同", "low"],
    ].forEach((values) => insertPersona.run(...values));

    const insertContent = db.prepare(
      "INSERT INTO content_asset (id, platform, title, format, persona_focus, published_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
    [
      ["video-001", "douyin", "一片纸尿裤能不能睡整夜？", "测评", "xiaoyu", "2026-09-14T12:00:00Z"],
      ["video-002", "douyin", "大包装到底省多少？", "价格拆解", "alin", "2026-09-15T11:00:00Z"],
      ["video-003", "douyin", "三分钟看懂透气层", "科普", "wangayi", "2026-09-16T09:00:00Z"],
      ["video-004", "douyin", "宝宝出街也要好看", "UGC", "mia", "2026-09-16T14:30:00Z"],
    ].forEach((values) => insertContent.run(...values));

    const insertContentMetric = db.prepare(
      "INSERT INTO content_metric (content_id, play_count, like_count, comment_count, share_count, collect_count) VALUES (?, ?, ?, ?, ?, ?)",
    );
    [
      ["video-001", 182000, 9400, 1680, 2100, 3200],
      ["video-002", 126000, 6100, 1320, 980, 2400],
      ["video-003", 88000, 5300, 740, 1200, 2900],
      ["video-004", 96000, 7800, 910, 1750, 1600],
    ].forEach((values) => insertContentMetric.run(...values));

    const insertComment = db.prepare(
      "INSERT INTO audience_comment (id, content_id, persona_id, text, sentiment, intent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    [
      ["comment-001", "video-001", "xiaoyu", "晚上十二点到早上七点真的不会漏吗？", "neutral", "proof", "2026-09-14T13:20:00Z"],
      ["comment-002", "video-001", "wangayi", "有没有更直白的尺码建议？", "neutral", "education", "2026-09-14T14:10:00Z"],
      ["comment-003", "video-002", "alin", "直播间两箱装还有券吗？", "positive", "promotion", "2026-09-15T11:30:00Z"],
      ["comment-004", "video-002", "alin", "算下来一片多少钱？", "neutral", "price", "2026-09-15T12:05:00Z"],
      ["comment-005", "video-003", "xiaoyu", "红屁屁宝宝适合吗？", "neutral", "safety", "2026-09-16T09:40:00Z"],
      ["comment-006", "video-003", "wangayi", "这个解释老人也能看懂。", "positive", "trust", "2026-09-16T10:12:00Z"],
      ["comment-007", "video-004", "mia", "包装很好看，想拍同款开箱。", "positive", "ugc", "2026-09-16T15:02:00Z"],
      ["comment-008", "video-004", "mia", "有没有妈妈群试用活动？", "positive", "community", "2026-09-16T15:18:00Z"],
    ].forEach((values) => insertComment.run(...values));

    const insertLive = db.prepare(
      "INSERT INTO live_room (id, title, started_at, duration_sec) VALUES (?, ?, ?, ?)",
    );
    [
      ["live-001", "夜间防漏实测专场", "2026-09-15T12:00:00Z", 7200],
      ["live-002", "囤货节双箱装专场", "2026-09-16T12:00:00Z", 9000],
    ].forEach((values) => insertLive.run(...values));

    const insertLiveMetric = db.prepare(
      "INSERT INTO live_metric (room_id, exposure_uv, watch_uv, avg_watch_sec, peak_online, comment_count, like_count, product_click_uv, add_cart_uv, paid_orders, gmv_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    [
      ["live-001", 64000, 23800, 176, 1540, 4300, 52000, 6200, 2100, 318, 1227600],
      ["live-002", 89000, 36100, 214, 2310, 6100, 78000, 9800, 3700, 566, 2481100],
    ].forEach((values) => insertLiveMetric.run(...values));

    const insertCampaign = db.prepare(
      "INSERT INTO campaign (id, name, objective, status, budget_cents) VALUES (?, ?, ?, ?, ?)",
    );
    [
      ["ad-001", "夜间防漏-短视频引流", "VIDEO_PROM_GOODS", "active", 180000],
      ["ad-002", "囤货节-直播间成交", "LIVE_PROM_GOODS", "active", 260000],
      ["ad-003", "UGC妈妈种草扩量", "VIDEO_PROM_GOODS", "learning", 120000],
    ].forEach((values) => insertCampaign.run(...values));

    const insertCampaignMetric = db.prepare(
      "INSERT INTO campaign_metric (campaign_id, spend_cents, impressions, clicks, conversions, revenue_cents) VALUES (?, ?, ?, ?, ?, ?)",
    );
    [
      ["ad-001", 132000, 410000, 18500, 286, 986700],
      ["ad-002", 224000, 530000, 24700, 512, 2260400],
      ["ad-003", 76000, 285000, 14200, 141, 458000],
    ].forEach((values) => insertCampaignMetric.run(...values));

    const insertProduct = db.prepare(
      "INSERT INTO product (id, sku, name, size, price_cents, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    [
      ["product-L", "DIAPER-L-48", "轻薄透气纸尿裤 L 48片", "L", 10900, 1860, "online"],
      ["product-XL", "DIAPER-XL-44", "轻薄透气纸尿裤 XL 44片", "XL", 11900, 1420, "online"],
      ["product-2XL", "DIAPER-2XL-40", "轻薄透气纸尿裤 2XL 40片", "2XL", 12900, 760, "online"],
    ].forEach((values) => insertProduct.run(...values));

    const insertOrder = db.prepare(
      "INSERT INTO business_order (id, persona_id, product_id, quantity, amount_cents, status, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    [
      ["order-001", "xiaoyu", "product-L", 1, 10900, "paid", "content", "2026-09-14T14:30:00Z"],
      ["order-002", "alin", "product-XL", 2, 21800, "paid", "live", "2026-09-15T13:10:00Z"],
      ["order-003", "wangayi", "product-L", 1, 10900, "paid", "live", "2026-09-15T13:24:00Z"],
      ["order-004", "mia", "product-XL", 1, 11900, "paid", "content", "2026-09-16T10:05:00Z"],
      ["order-005", "alin", "product-XL", 2, 21800, "paid", "live", "2026-09-16T13:06:00Z"],
      ["order-006", "xiaoyu", "product-2XL", 1, 12900, "refunded", "ad", "2026-09-16T13:22:00Z"],
      ["order-007", "mia", "product-L", 1, 10900, "paid", "ad", "2026-09-16T15:40:00Z"],
      ["order-008", "alin", "product-L", 3, 29700, "paid", "live", "2026-09-16T15:55:00Z"],
      ["order-009", "xiaoyu", "product-L", 1, 10900, "paid", "ad", "2026-09-17T03:20:00Z"],
      ["order-010", "wangayi", "product-XL", 1, 11900, "paid", "content", "2026-09-17T04:10:00Z"],
    ].forEach((values) => insertOrder.run(...values));

    const insertAftersale = db.prepare(
      "INSERT INTO aftersale (id, order_id, type, status, refund_cents, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    [
      ["aftersale-001", "order-006", "refund_only", "refund_success", 12900, "尺码不合适", "2026-09-17T01:00:00Z"],
      ["aftersale-002", "order-004", "return_refund", "merchant_review", 11900, "买多了", "2026-09-17T05:10:00Z"],
    ].forEach((values) => insertAftersale.run(...values));

    db.prepare(
      "INSERT OR REPLACE INTO mock_meta (key, value) VALUES ('seed_version', ?), ('simulated_as_of', ?)",
    ).run(SEED_VERSION, SIMULATED_AS_OF);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getMockDatabase() {
  if (database) return database;

  const path = resolveMockDbPath();
  mkdirSync(dirname(path), { recursive: true });
  database = new DatabaseSync(path);
  createSchema(database);
  seedDatabase(database);
  return database;
}

export function getMockStorageDescription() {
  return process.env.VERCEL
    ? "SQLite /tmp，Vercel 实例级临时数据；冷启动会按固定种子重建"
    : "SQLite .eve/business-world-agent.sqlite，本地开发数据且已被 .gitignore 排除";
}
