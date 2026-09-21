-- Canonical simulated dataset for the PR #9 Business World design.
-- This is synthetic demo data. Never present it as observed platform truth.

alter table public.business_world_state drop constraint if exists business_world_state_source_type_check;
alter table public.business_world_state add constraint business_world_state_source_type_check
  check (source_type = any (array['system-record'::text,'manual-entry'::text,'csv-import'::text,'official-api'::text,'simulated'::text]));

insert into public.business_world_state (id, source_label, source_type, observed_at, payload, updated_at)
values (
  'primary',
  'Supabase simulated PR9 complete demo dataset',
  'simulated',
  now(),
  '{
  "meta": {
    "dataMode": "simulated",
    "datasetVersion": "business-world-diaper-pr9-v2",
    "designSource": "PR #9 merged design handoff",
    "warning": "Synthetic demo dataset stored in Supabase. It is not observed Douyin, Qianchuan, DouDian, or customer data."
  },
  "personas": [
    {
      "id": "xiaoyu",
      "name": "小雨",
      "title": "新手家庭",
      "goal": "安全、透气、夜间不漏",
      "pain": "怕红屁屁、怕踩坑",
      "content": "测评、成分科普、真实对比",
      "trigger": "医生/达人背书、真实试用反馈",
      "population": 186000,
      "conversionRate": 3.8,
      "repeatRate": 31.2,
      "gmvShare": 28.4
    },
    {
      "id": "alin",
      "name": "阿琳",
      "title": "复购家庭",
      "goal": "高性价比、大包装、稳定复购",
      "pain": "价格波动、优惠复杂",
      "content": "囤货攻略、套装促销、直播福利",
      "trigger": "满减、赠品、直播间限时价",
      "population": 142000,
      "conversionRate": 5.9,
      "repeatRate": 46.8,
      "gmvShare": 34.7
    },
    {
      "id": "wangyi",
      "name": "王姨",
      "title": "长辈照护",
      "goal": "简单放心、舒适不刺激",
      "pain": "尺码难选、功能术语不懂",
      "content": "大字说明、专家讲解、真实家庭演示",
      "trigger": "子女推荐、口碑信任、线下体验",
      "population": 96000,
      "conversionRate": 2.7,
      "repeatRate": 24.1,
      "gmvShare": 17.3
    },
    {
      "id": "mia",
      "name": "Mia",
      "title": "内容分享者",
      "goal": "高颜值、好用、愿意分享",
      "pain": "普通内容不愿转发",
      "content": "开箱、挑战、UGC互动、育儿日常",
      "trigger": "社交认同、品牌活动、联名礼盒",
      "population": 118000,
      "conversionRate": 3.3,
      "repeatRate": 19.6,
      "gmvShare": 19.6
    }
  ],
  "content": {
    "engagementRate": 6.8,
    "weeklyOpportunities": 6,
    "totalPlays": 492000,
    "interactions": 33460,
    "topTopics": [
      {
        "title": "宝宝整夜不漏尿挑战",
        "persona": "新手家庭",
        "potential": "high"
      },
      {
        "title": "夏季透气纸尿裤测评",
        "persona": "新手家庭",
        "potential": "high"
      },
      {
        "title": "新生儿囤货清单",
        "persona": "复购家庭",
        "potential": "high"
      },
      {
        "title": "红屁屁护理误区",
        "persona": "长辈照护",
        "potential": "medium"
      },
      {
        "title": "纸尿裤尺码怎么选",
        "persona": "长辈照护",
        "potential": "high"
      },
      {
        "title": "夜用纸尿裤真实对比",
        "persona": "内容分享者",
        "potential": "medium"
      }
    ],
    "scripts": [
      {
        "name": "问题切入",
        "durationSec": 15,
        "format": "hook"
      },
      {
        "name": "真实场景",
        "durationSec": 30,
        "format": "demo"
      },
      {
        "name": "直播桥接",
        "durationSec": 45,
        "format": "cta"
      }
    ]
  },
  "live": {
    "roomEntryRate": 18.6,
    "cartRate": 10.2,
    "avgWatchSec": 214,
    "payConversionRate": 1.57,
    "exposureUv": 153000,
    "watchUv": 59900,
    "peakOnline": 2310,
    "paidOrders": 884,
    "gmv": 3708700,
    "sessions": [
      {
        "id": "live-001",
        "title": "夜间防漏实测专场",
        "durationMin": 120,
        "watchUv": 23800,
        "cartRate": 8.8,
        "paidOrders": 318,
        "gmv": 1227600
      },
      {
        "id": "live-002",
        "title": "囤货节双箱装专场",
        "durationMin": 150,
        "watchUv": 36100,
        "cartRate": 10.25,
        "paidOrders": 566,
        "gmv": 2481100
      }
    ]
  },
  "ads": {
    "budget": 428320,
    "spend": 432000,
    "roi": 4.32,
    "cpa": 36.8,
    "ctr": 2.84,
    "newCustomerCost": 42.6,
    "channelMix": [
      {
        "channel": "千川",
        "share": 40.2
      },
      {
        "channel": "信息流",
        "share": 32.5
      },
      {
        "channel": "搜索",
        "share": 18.3
      },
      {
        "channel": "再营销",
        "share": 9
      }
    ],
    "campaigns": [
      {
        "id": "ad-001",
        "name": "新手家庭拉新",
        "channel": "千川",
        "budget": 120000,
        "spend": 108600,
        "ctr": 3.12,
        "cpa": 34.8,
        "roi": 4.56,
        "status": "active"
      },
      {
        "id": "ad-002",
        "name": "复购家庭复购",
        "channel": "再营销",
        "budget": 98000,
        "spend": 90400,
        "ctr": 3.88,
        "cpa": 29.6,
        "roi": 5.21,
        "status": "active"
      },
      {
        "id": "ad-003",
        "name": "直播间引流",
        "channel": "信息流",
        "budget": 132000,
        "spend": 141300,
        "ctr": 2.41,
        "cpa": 41.3,
        "roi": 3.92,
        "status": "active"
      },
      {
        "id": "ad-004",
        "name": "核心商品转化",
        "channel": "搜索",
        "budget": 78320,
        "spend": 91700,
        "ctr": 1.96,
        "cpa": 44.9,
        "roi": 3.61,
        "status": "learning"
      }
    ],
    "creatives": [
      {
        "name": "透气实测",
        "roi": 4.8
      },
      {
        "name": "夜间防漏",
        "roi": 5.1
      },
      {
        "name": "尺码指南",
        "roi": 3.9
      },
      {
        "name": "家庭场景",
        "roi": 3.6
      }
    ]
  },
  "commerce": {
    "conversionRate": 3.24,
    "gmv": 2483221,
    "newCustomers": 18640,
    "refundRate": 4.8,
    "sellThroughRate": 71.3,
    "aov": 108.6,
    "products": [
      {
        "id": "newborn",
        "category": "日常护理",
        "name": "新生儿系列",
        "size": "NB / S",
        "price": 79,
        "gmv": 512800,
        "conversionRate": 3.6,
        "stockDays": 18,
        "refundRate": 3.9,
        "image": "diaper-newborn-concept"
      },
      {
        "id": "daily",
        "category": "日常护理",
        "name": "日常成长系列",
        "size": "M / L",
        "price": 89,
        "gmv": 1248600,
        "conversionRate": 4.2,
        "stockDays": 3,
        "refundRate": 4.5,
        "image": "diaper-daily-concept"
      },
      {
        "id": "night",
        "category": "夜间护理",
        "name": "夜间加强系列",
        "size": "XL+",
        "price": 109,
        "gmv": 721821,
        "conversionRate": 2.8,
        "stockDays": 11,
        "refundRate": 5.7,
        "image": "diaper-night-concept"
      }
    ]
  },
  "report": {
    "period": "2026-09-11/2026-09-18",
    "audience": "管理层",
    "headline": "GMV +12.5%",
    "summary": "主要由直播与优质内容带动",
    "sections": [
      "经营概览",
      "内容复盘",
      "直播复盘",
      "投放分析",
      "商品建议",
      "风险与机会"
    ]
  },
  "notes": "PR #9 design-complete synthetic dataset. All values are simulated and stored in Supabase so every current product surface can read from one persisted state."
}'::jsonb,
  now()
)
on conflict (id) do update set
  source_label = excluded.source_label,
  source_type = excluded.source_type,
  observed_at = excluded.observed_at,
  payload = excluded.payload,
  updated_at = now();
