type SourceSnapshot = {
  provenance: { sourceLabel: string; provider: string; sourceMode: string };
  data: { meta: { datasetVersion: string }; notes: string } | null;
};

const demoSource = {
  datasetVersion: 'business-world-diaper-pr9-v2',
  sourceLabel: 'Supabase simulated PR9 complete demo dataset',
  notes: 'PR #9 design-complete synthetic dataset. All values are simulated and stored in Supabase so every current product surface can read from one persisted state.',
};

// Only application-owned seed metadata is translated. User-authored names and notes remain intact.
export function presentSnapshot<T extends SourceSnapshot>(snapshot: T): T {
  if (snapshot.provenance.sourceMode !== 'simulated' || snapshot.data?.meta.datasetVersion !== demoSource.datasetVersion) return snapshot;
  return {
    ...snapshot,
    provenance: {
      ...snapshot.provenance,
      sourceLabel: snapshot.provenance.sourceLabel === demoSource.sourceLabel ? '纸尿裤经营演示数据' : snapshot.provenance.sourceLabel,
      provider: snapshot.provenance.provider === 'simulated' ? '合成演示数据' : snapshot.provenance.provider,
    },
    data: {
      ...snapshot.data,
      notes: snapshot.data.notes === demoSource.notes ? '此数据用于体验经营分析与情景比较，不代表真实平台或客户记录。各页面使用同一份已保存的数据。' : snapshot.data.notes,
    },
  };
}
