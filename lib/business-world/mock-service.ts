import { getMockDatabase, getMockStorageDescription, SIMULATED_AS_OF } from "./mock-db";

export type ScenarioLever =
  | "content_engagement"
  | "live_watch_time"
  | "ad_efficiency"
  | "checkout_conversion"
  | "repeat_purchase";

function sourceMetadata() {
  return {
    sourceMode: "simulated" as const,
    provider: "mock-sqlite",
    asOf: SIMULATED_AS_OF,
    storage: getMockStorageDescription(),
    warning: "这些数值是确定性的 Demo / simulated 数据，不是抖音、巨量千川或抖店真实经营数据。",
  };
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function moneyYuan(cents: number) {
  return Math.round(cents) / 100;
}

export function getBusinessWorldSnapshot() {
  const db = getMockDatabase();
  const personaCount = db.prepare("SELECT COUNT(*) AS count FROM persona").get() as { count: number };
  const content = db
    .prepare(`
      SELECT
        COALESCE(SUM(play_count), 0) AS plays,
        COALESCE(SUM(like_count + comment_count + share_count + collect_count), 0) AS interactions
      FROM content_metric
    `)
    .get() as { interactions: number; plays: number };
  const live = db
    .prepare(`
      SELECT
        COALESCE(SUM(exposure_uv), 0) AS exposure_uv,
        COALESCE(SUM(watch_uv), 0) AS watch_uv,
        COALESCE(SUM(paid_orders), 0) AS paid_orders,
        COALESCE(SUM(gmv_cents), 0) AS gmv_cents
      FROM live_metric
    `)
    .get() as { exposure_uv: number; gmv_cents: number; paid_orders: number; watch_uv: number };
  const ads = db
    .prepare(`
      SELECT
        COALESCE(SUM(spend_cents), 0) AS spend_cents,
        COALESCE(SUM(conversions), 0) AS conversions,
        COALESCE(SUM(revenue_cents), 0) AS revenue_cents
      FROM campaign_metric
    `)
    .get() as { conversions: number; revenue_cents: number; spend_cents: number };
  const commerce = db
    .prepare(`
      SELECT
        COUNT(*) AS total_orders,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_orders,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END), 0) AS paid_revenue_cents,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount_cents ELSE 0 END), 0) AS refunded_order_cents
      FROM business_order
    `)
    .get() as {
      paid_orders: number;
      paid_revenue_cents: number;
      refunded_order_cents: number;
      total_orders: number;
    };
  const aftersales = db
    .prepare("SELECT COUNT(*) AS count, COALESCE(SUM(refund_cents), 0) AS refund_cents FROM aftersale")
    .get() as { count: number; refund_cents: number };
  const topContent = db
    .prepare(`
      SELECT ca.id, ca.title, ca.persona_focus, cm.play_count, cm.like_count, cm.comment_count, cm.share_count
      FROM content_asset ca
      JOIN content_metric cm ON cm.content_id = ca.id
      ORDER BY cm.play_count DESC
      LIMIT 1
    `)
    .get();
  const topCampaign = db
    .prepare(`
      SELECT c.id, c.name, c.objective, cm.spend_cents, cm.conversions, cm.revenue_cents
      FROM campaign c
      JOIN campaign_metric cm ON cm.campaign_id = c.id
      WHERE cm.spend_cents > 0
      ORDER BY (1.0 * cm.revenue_cents / cm.spend_cents) DESC
      LIMIT 1
    `)
    .get() as
    | { conversions: number; id: string; name: string; objective: string; revenue_cents: number; spend_cents: number }
    | undefined;
  const topPersona = db
    .prepare(`
      SELECT p.id, p.name, p.segment, COUNT(o.id) AS paid_orders, COALESCE(SUM(o.amount_cents), 0) AS revenue_cents
      FROM persona p
      LEFT JOIN business_order o ON o.persona_id = p.id AND o.status = 'paid'
      GROUP BY p.id, p.name, p.segment
      ORDER BY revenue_cents DESC
      LIMIT 1
    `)
    .get();

  return {
    ...sourceMetadata(),
    world: {
      personas: numberValue(personaCount.count),
      content: {
        plays: numberValue(content.plays),
        interactions: numberValue(content.interactions),
        interactionRate: content.plays > 0 ? content.interactions / content.plays : 0,
      },
      live: {
        exposureUv: numberValue(live.exposure_uv),
        watchUv: numberValue(live.watch_uv),
        watchRate: live.exposure_uv > 0 ? live.watch_uv / live.exposure_uv : 0,
        paidOrders: numberValue(live.paid_orders),
        gmvYuan: moneyYuan(numberValue(live.gmv_cents)),
      },
      ads: {
        spendYuan: moneyYuan(numberValue(ads.spend_cents)),
        conversions: numberValue(ads.conversions),
        revenueYuan: moneyYuan(numberValue(ads.revenue_cents)),
        roi: ads.spend_cents > 0 ? ads.revenue_cents / ads.spend_cents : 0,
        cpaYuan: ads.conversions > 0 ? moneyYuan(ads.spend_cents / ads.conversions) : 0,
      },
      commerce: {
        totalOrders: numberValue(commerce.total_orders),
        paidOrders: numberValue(commerce.paid_orders),
        paidRevenueYuan: moneyYuan(numberValue(commerce.paid_revenue_cents)),
        refundedOrderYuan: moneyYuan(numberValue(commerce.refunded_order_cents)),
        aftersaleCases: numberValue(aftersales.count),
        aftersaleRefundYuan: moneyYuan(numberValue(aftersales.refund_cents)),
      },
    },
    signals: {
      topContent,
      topCampaign: topCampaign
        ? {
            ...topCampaign,
            spendYuan: moneyYuan(topCampaign.spend_cents),
            revenueYuan: moneyYuan(topCampaign.revenue_cents),
            roi: topCampaign.revenue_cents / topCampaign.spend_cents,
          }
        : null,
      topPersona,
    },
  };
}

export function getContentInsights({ limit = 5, personaId }: { limit?: number; personaId?: string }) {
  const db = getMockDatabase();
  const assets = db
    .prepare(`
      SELECT
        ca.id,
        ca.platform,
        ca.title,
        ca.format,
        ca.persona_focus AS personaFocus,
        ca.published_at AS publishedAt,
        cm.play_count AS playCount,
        cm.like_count AS likeCount,
        cm.comment_count AS commentCount,
        cm.share_count AS shareCount,
        cm.collect_count AS collectCount
      FROM content_asset ca
      JOIN content_metric cm ON cm.content_id = ca.id
      ORDER BY cm.play_count DESC
      LIMIT ?
    `)
    .all(limit);
  const comments = personaId
    ? db
        .prepare(`
          SELECT ac.id, ac.content_id AS contentId, ac.persona_id AS personaId, p.name AS personaName,
                 ac.text, ac.sentiment, ac.intent, ac.created_at AS createdAt
          FROM audience_comment ac
          JOIN persona p ON p.id = ac.persona_id
          WHERE ac.persona_id = ?
          ORDER BY ac.created_at DESC
          LIMIT 20
        `)
        .all(personaId)
    : db
        .prepare(`
          SELECT ac.id, ac.content_id AS contentId, ac.persona_id AS personaId, p.name AS personaName,
                 ac.text, ac.sentiment, ac.intent, ac.created_at AS createdAt
          FROM audience_comment ac
          JOIN persona p ON p.id = ac.persona_id
          ORDER BY ac.created_at DESC
          LIMIT 20
        `)
        .all();
  const themes = personaId
    ? db
        .prepare(`
          SELECT intent, COUNT(*) AS count
          FROM audience_comment
          WHERE persona_id = ?
          GROUP BY intent
          ORDER BY count DESC, intent ASC
        `)
        .all(personaId)
    : db
        .prepare(`
          SELECT intent, COUNT(*) AS count
          FROM audience_comment
          GROUP BY intent
          ORDER BY count DESC, intent ASC
        `)
        .all();

  return {
    ...sourceMetadata(),
    filter: { personaId: personaId ?? null },
    assets,
    comments,
    commentThemes: themes,
    officialApiTarget: "抖音开放平台：视频数据 data.external.item / video.data.bind + 评论 item.comment",
  };
}

export function getLiveInsights({ roomId }: { roomId?: string }) {
  const db = getMockDatabase();
  const rows = roomId
    ? (db
        .prepare(`
          SELECT lr.id, lr.title, lr.started_at AS startedAt, lr.duration_sec AS durationSec,
                 lm.exposure_uv AS exposureUv, lm.watch_uv AS watchUv, lm.avg_watch_sec AS avgWatchSec,
                 lm.peak_online AS peakOnline, lm.comment_count AS commentCount, lm.like_count AS likeCount,
                 lm.product_click_uv AS productClickUv, lm.add_cart_uv AS addCartUv,
                 lm.paid_orders AS paidOrders, lm.gmv_cents AS gmvCents
          FROM live_room lr
          JOIN live_metric lm ON lm.room_id = lr.id
          WHERE lr.id = ?
          ORDER BY lr.started_at DESC
        `)
        .all(roomId) as Record<string, unknown>[])
    : (db
        .prepare(`
          SELECT lr.id, lr.title, lr.started_at AS startedAt, lr.duration_sec AS durationSec,
                 lm.exposure_uv AS exposureUv, lm.watch_uv AS watchUv, lm.avg_watch_sec AS avgWatchSec,
                 lm.peak_online AS peakOnline, lm.comment_count AS commentCount, lm.like_count AS likeCount,
                 lm.product_click_uv AS productClickUv, lm.add_cart_uv AS addCartUv,
                 lm.paid_orders AS paidOrders, lm.gmv_cents AS gmvCents
          FROM live_room lr
          JOIN live_metric lm ON lm.room_id = lr.id
          ORDER BY lr.started_at DESC
        `)
        .all() as Record<string, unknown>[]);

  const rooms = rows.map((row) => {
    const exposureUv = numberValue(row.exposureUv);
    const watchUv = numberValue(row.watchUv);
    const productClickUv = numberValue(row.productClickUv);
    const addCartUv = numberValue(row.addCartUv);
    const paidOrders = numberValue(row.paidOrders);
    const gmvCents = numberValue(row.gmvCents);
    return {
      ...row,
      gmvYuan: moneyYuan(gmvCents),
      watchRate: exposureUv > 0 ? watchUv / exposureUv : 0,
      productClickRate: watchUv > 0 ? productClickUv / watchUv : 0,
      addCartRate: productClickUv > 0 ? addCartUv / productClickUv : 0,
      paidOrderRate: addCartUv > 0 ? paidOrders / addCartUv : 0,
    };
  });

  return {
    ...sourceMetadata(),
    filter: { roomId: roomId ?? null },
    rooms,
    officialApiTarget: "抖音开放平台：live.room.base / live.room.audience / live.room.interactive",
  };
}

export function getAdInsights({ campaignId }: { campaignId?: string }) {
  const db = getMockDatabase();
  const rows = campaignId
    ? (db
        .prepare(`
          SELECT c.id, c.name, c.objective, c.status, c.budget_cents AS budgetCents,
                 cm.spend_cents AS spendCents, cm.impressions, cm.clicks, cm.conversions,
                 cm.revenue_cents AS revenueCents
          FROM campaign c
          JOIN campaign_metric cm ON cm.campaign_id = c.id
          WHERE c.id = ?
        `)
        .all(campaignId) as Record<string, unknown>[])
    : (db
        .prepare(`
          SELECT c.id, c.name, c.objective, c.status, c.budget_cents AS budgetCents,
                 cm.spend_cents AS spendCents, cm.impressions, cm.clicks, cm.conversions,
                 cm.revenue_cents AS revenueCents
          FROM campaign c
          JOIN campaign_metric cm ON cm.campaign_id = c.id
          ORDER BY cm.spend_cents DESC
        `)
        .all() as Record<string, unknown>[]);

  const campaigns = rows.map((row) => {
    const spendCents = numberValue(row.spendCents);
    const revenueCents = numberValue(row.revenueCents);
    const clicks = numberValue(row.clicks);
    const impressions = numberValue(row.impressions);
    const conversions = numberValue(row.conversions);
    return {
      ...row,
      budgetYuan: moneyYuan(numberValue(row.budgetCents)),
      spendYuan: moneyYuan(spendCents),
      revenueYuan: moneyYuan(revenueCents),
      ctr: impressions > 0 ? clicks / impressions : 0,
      cvr: clicks > 0 ? conversions / clicks : 0,
      cpaYuan: conversions > 0 ? moneyYuan(spendCents / conversions) : 0,
      roi: spendCents > 0 ? revenueCents / spendCents : 0,
    };
  });

  return {
    ...sourceMetadata(),
    filter: { campaignId: campaignId ?? null },
    campaigns,
    officialApiTarget: "巨量引擎商业开放平台：巨量千川账户、投放计划、数据报表、素材与建议出价",
  };
}

export function getCommerceInsights({ productId }: { productId?: string }) {
  const db = getMockDatabase();
  const products = productId
    ? db
        .prepare(`
          SELECT id, sku, name, size, price_cents AS priceCents, stock, status
          FROM product
          WHERE id = ?
        `)
        .all(productId)
    : db
        .prepare(`
          SELECT id, sku, name, size, price_cents AS priceCents, stock, status
          FROM product
          ORDER BY size ASC
        `)
        .all();
  const orderSummary = productId
    ? db
        .prepare(`
          SELECT bo.product_id AS productId, p.name,
                 COUNT(*) AS orderCount,
                 SUM(CASE WHEN bo.status = 'paid' THEN 1 ELSE 0 END) AS paidOrders,
                 COALESCE(SUM(CASE WHEN bo.status = 'paid' THEN bo.amount_cents ELSE 0 END), 0) AS paidRevenueCents
          FROM business_order bo
          JOIN product p ON p.id = bo.product_id
          WHERE bo.product_id = ?
          GROUP BY bo.product_id, p.name
        `)
        .all(productId)
    : db
        .prepare(`
          SELECT bo.product_id AS productId, p.name,
                 COUNT(*) AS orderCount,
                 SUM(CASE WHEN bo.status = 'paid' THEN 1 ELSE 0 END) AS paidOrders,
                 COALESCE(SUM(CASE WHEN bo.status = 'paid' THEN bo.amount_cents ELSE 0 END), 0) AS paidRevenueCents
          FROM business_order bo
          JOIN product p ON p.id = bo.product_id
          GROUP BY bo.product_id, p.name
          ORDER BY paidRevenueCents DESC
        `)
        .all();
  const orders = productId
    ? db
        .prepare(`
          SELECT bo.id, bo.persona_id AS personaId, p.name AS personaName, bo.product_id AS productId,
                 pr.name AS productName, bo.quantity, bo.amount_cents AS amountCents,
                 bo.status, bo.source, bo.created_at AS createdAt
          FROM business_order bo
          JOIN persona p ON p.id = bo.persona_id
          JOIN product pr ON pr.id = bo.product_id
          WHERE bo.product_id = ?
          ORDER BY bo.created_at DESC
          LIMIT 30
        `)
        .all(productId)
    : db
        .prepare(`
          SELECT bo.id, bo.persona_id AS personaId, p.name AS personaName, bo.product_id AS productId,
                 pr.name AS productName, bo.quantity, bo.amount_cents AS amountCents,
                 bo.status, bo.source, bo.created_at AS createdAt
          FROM business_order bo
          JOIN persona p ON p.id = bo.persona_id
          JOIN product pr ON pr.id = bo.product_id
          ORDER BY bo.created_at DESC
          LIMIT 30
        `)
        .all();
  const aftersales = productId
    ? db
        .prepare(`
          SELECT a.id, a.order_id AS orderId, a.type, a.status, a.refund_cents AS refundCents,
                 a.reason, a.created_at AS createdAt
          FROM aftersale a
          JOIN business_order bo ON bo.id = a.order_id
          WHERE bo.product_id = ?
          ORDER BY a.created_at DESC
        `)
        .all(productId)
    : db
        .prepare(`
          SELECT id, order_id AS orderId, type, status, refund_cents AS refundCents,
                 reason, created_at AS createdAt
          FROM aftersale
          ORDER BY created_at DESC
        `)
        .all();

  return {
    ...sourceMetadata(),
    filter: { productId: productId ?? null },
    products: (products as Record<string, unknown>[]).map((row) => ({
      ...row,
      priceYuan: moneyYuan(numberValue(row.priceCents)),
    })),
    orderSummary: (orderSummary as Record<string, unknown>[]).map((row) => ({
      ...row,
      paidRevenueYuan: moneyYuan(numberValue(row.paidRevenueCents)),
    })),
    orders: (orders as Record<string, unknown>[]).map((row) => ({
      ...row,
      amountYuan: moneyYuan(numberValue(row.amountCents)),
    })),
    aftersales: (aftersales as Record<string, unknown>[]).map((row) => ({
      ...row,
      refundYuan: moneyYuan(numberValue(row.refundCents)),
    })),
    officialApiTarget: "抖店开放平台：product.detail / sku.stockNum / 订单列表 / afterSale.List + Detail",
  };
}

const ELASTICITY: Record<ScenarioLever, { value: number; assumption: string }> = {
  content_engagement: {
    value: 0.25,
    assumption: "内容互动提升对支付收入的模拟弹性设为 0.25。",
  },
  live_watch_time: {
    value: 0.35,
    assumption: "直播人均观看时长提升对支付收入的模拟弹性设为 0.35。",
  },
  ad_efficiency: {
    value: 0.45,
    assumption: "投放效率提升对支付收入的模拟弹性设为 0.45。",
  },
  checkout_conversion: {
    value: 0.7,
    assumption: "结账转化率提升对支付收入的模拟弹性设为 0.70。",
  },
  repeat_purchase: {
    value: 0.55,
    assumption: "复购改善对支付收入的模拟弹性设为 0.55。",
  },
};

export function runScenarioExperiment({
  changePercent,
  lever,
  personaId,
}: {
  changePercent: number;
  lever: ScenarioLever;
  personaId?: string;
}) {
  const db = getMockDatabase();
  const baseline = personaId
    ? (db
        .prepare(`
          SELECT COUNT(*) AS paid_orders, COALESCE(SUM(amount_cents), 0) AS revenue_cents
          FROM business_order
          WHERE status = 'paid' AND persona_id = ?
        `)
        .get(personaId) as { paid_orders: number; revenue_cents: number })
    : (db
        .prepare(`
          SELECT COUNT(*) AS paid_orders, COALESCE(SUM(amount_cents), 0) AS revenue_cents
          FROM business_order
          WHERE status = 'paid'
        `)
        .get() as { paid_orders: number; revenue_cents: number });
  const assumption = ELASTICITY[lever];
  const revenueDeltaCents = baseline.revenue_cents * assumption.value * (changePercent / 100);
  const projectedRevenueCents = baseline.revenue_cents + revenueDeltaCents;
  const projectedPaidOrders = baseline.paid_orders * (1 + assumption.value * (changePercent / 100));

  return {
    ...sourceMetadata(),
    experiment: {
      personaId: personaId ?? null,
      lever,
      changePercent,
      elasticity: assumption.value,
      assumption: assumption.assumption,
      baseline: {
        paidOrders: numberValue(baseline.paid_orders),
        revenueYuan: moneyYuan(numberValue(baseline.revenue_cents)),
      },
      projected: {
        paidOrders: Math.max(0, Math.round(projectedPaidOrders)),
        revenueYuan: moneyYuan(Math.max(0, projectedRevenueCents)),
        revenueDeltaYuan: moneyYuan(revenueDeltaCents),
      },
    },
    interpretation:
      "这是透明的启发式 Scenario Experiment，用固定弹性做方向比较。它不能替代真实 A/B 实验、平台归因或市场预测。",
  };
}
