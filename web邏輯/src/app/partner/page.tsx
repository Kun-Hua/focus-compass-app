'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// 基礎資料型別（以實際資料庫為準）
type PartnerRole = 'mentor' | 'peer' | 'spouse' | 'other';

type AccountabilityPartner = {
  id: string;
  owner_user_id: string;
  partner_email: string | null;
  partner_user_id: string | null;
  role: PartnerRole;
  visibility: {
    netCommittedMinutes?: boolean;
    honestyRatio?: boolean;
    interruptionFrequency?: boolean;
    totalDurationMinutes?: boolean;
    commitmentRate?: boolean;
  };
  status: 'pending' | 'active' | 'revoked';
  invite_token: string | null;
  created_at: string;
};

const defaultVisibility = {
  netCommittedMinutes: true,
  honestyRatio: true,
  interruptionFrequency: true,
  totalDurationMinutes: true,
  commitmentRate: true,
};

export default function PartnerPage() {
  const [nickname, setNickname] = useState('');
  const [partnerUserId, setPartnerUserId] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [role, setRole] = useState<PartnerRole>('peer');
  const [visibility, setVisibility] = useState(defaultVisibility);
  const [partners, setPartners] = useState<AccountabilityPartner[]>([]);
  const [incoming, setIncoming] = useState<AccountabilityPartner[]>([]);
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: 改為實際登入使用者 ID；目前使用匿名用戶或從 Supabase auth 取得
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // --- Weekly metrics (migrated from Weekly Report) ---
  const [metrics, setMetrics] = useState({
    netCommittedMinutes: 0,
    totalDurationMinutes: 0,
    honestyRatio: 0,
    interruptionFrequency: 0,
    commitmentRate: 0,
  });
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [rangeType, setRangeType] = useState<'day' | 'week' | 'month'>('week');
  const currentRange = useMemo(() => {
    if (rangeType === 'day') return getTodayRangeLocal();
    if (rangeType === 'month') return getCurrentMonthRangeLocal();
    return getCurrentWeekRangeLocal();
  }, [rangeType]);
  const [reverseVisibility, setReverseVisibility] = useState<Record<string, AccountabilityPartner['visibility']>>({});
  const [partnerMetricsMap, setPartnerMetricsMap] = useState<Record<string, typeof metrics>>({});
  const [sortKey, setSortKey] = useState<'netCommittedMinutes' | 'commitmentRate'>('netCommittedMinutes');

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
    };
    fetchUser();
  }, []);

  const canSubmit = useMemo(() => !!role && !!partnerUserId, [role, partnerUserId]);

  const toggleVisibility = (key: keyof typeof defaultVisibility) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchPartners = async () => {
    if (!currentUserId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('AccountabilityPartner')
        .select('*')
        .eq('owner_user_id', currentUserId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data as AccountabilityPartner[]) || [];
      setPartners(rows);
      // 收集夥伴 user_id 以查暱稱
      const ids = Array.from(new Set(rows.map(r => r.partner_user_id).filter(Boolean))) as string[];
      if (ids.length > 0) {
        const { data: profs, error: pErr } = await supabase
          .from('profiles')
          .select('user_id, nickname')
          .in('user_id', ids);
        if (!pErr && Array.isArray(profs)) {
          const m: Record<string, string> = { ...nicknames };
          profs.forEach((p: any) => { if (p?.user_id) m[p.user_id] = p.nickname || ''; });
          setNicknames(m);
        }
        const { data: reverseRows } = await supabase
          .from('AccountabilityPartner')
          .select('owner_user_id, partner_user_id, visibility, status')
          .in('owner_user_id', ids)
          .eq('partner_user_id', currentUserId);
        const visMap: Record<string, AccountabilityPartner['visibility']> = {};
        (reverseRows as any[] | null)?.forEach(r => {
          if (r && r.owner_user_id) visMap[r.owner_user_id] = r.visibility || {};
        });
        setReverseVisibility(visMap);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartners(); }, [currentUserId]);

  const fetchIncoming = async () => {
    if (!currentUserId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('AccountabilityPartner')
        .select('*')
        .eq('partner_user_id', currentUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data as AccountabilityPartner[]) || [];
      setIncoming(rows);
      // 收集 owner user_id 以查暱稱
      const ids = Array.from(new Set(rows.map(r => r.owner_user_id).filter(Boolean))) as string[];
      if (ids.length > 0) {
        const { data: profs, error: pErr } = await supabase
          .from('profiles')
          .select('user_id, nickname')
          .in('user_id', ids);
        if (!pErr && Array.isArray(profs)) {
          const m: Record<string, string> = { ...nicknames };
          profs.forEach((p: any) => { if (p?.user_id) m[p.user_id] = p.nickname || ''; });
          setNicknames(m);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncoming(); }, [currentUserId]);

  useEffect(() => {
    async function loadWeekly() {
      if (!currentUserId) return;
      try {
        const m = await computeWeeklyMetricsLocal(currentUserId, currentRange.startIso, currentRange.endIso);
        setMetrics(m);
        setRange({ start: currentRange.startIso, end: currentRange.endIso });
      } catch (e) {}
    }
    loadWeekly();
  }, [currentUserId, currentRange.startIso, currentRange.endIso]);

  useEffect(() => {
    async function loadPartnersWeekly() {
      if (!currentUserId) return;
      const actives = partners.filter(p => p.status === 'active' && !!p.partner_user_id);
      if (actives.length === 0) {
        setPartnerMetricsMap({});
        return;
      }
      const map: Record<string, typeof metrics> = {};
      await Promise.all(actives.map(async (p) => {
        const pid = p.partner_user_id as string;
        try {
          const { data, error } = await supabase.rpc('get_partner_weekly', {
            p_partner: pid,
            p_start: currentRange.startIso,
            p_end: currentRange.endIso,
          });
          if (error) throw error;
          const pm = (data as any)?.partner || null;
          if (pm) {
            map[pid] = {
              netCommittedMinutes: pm.netCommittedMinutes ?? null,
              totalDurationMinutes: pm.totalDurationMinutes ?? null,
              honestyRatio: pm.honestyRatio ?? null,
              interruptionFrequency: pm.interruptionFrequency ?? null,
              commitmentRate: pm.commitmentRate ?? null,
            } as any;
          }
        } catch {
          // 忽略單筆失敗，避免阻塞其他夥伴
        }
      }));
      setPartnerMetricsMap(map);
    }
    loadPartnersWeekly();
  }, [currentUserId, partners, currentRange.startIso, currentRange.endIso]);

  const createInvite = async () => {
    if (!currentUserId) return;
    setLoading(true);
    setError(null);
    try {
      // 檢查我方目前未撤銷（pending/active）的夥伴數量
      {
        const { count, error: cErr } = await supabase
          .from('AccountabilityPartner')
          .select('id', { count: 'exact', head: true })
          .eq('owner_user_id', currentUserId)
          .in('status', ['pending', 'active']);
        if (cErr) throw cErr;
        if ((count || 0) >= 5) {
          setError('已達上限：最多 5 位夥伴，請先移除或取消部分夥伴再新增');
          return;
        }
      }
      const payload = {
        owner_user_id: currentUserId,
        partner_email: null,
        partner_user_id: partnerUserId,
        role,
        visibility,
        status: 'pending',
      } as Partial<AccountabilityPartner> & { owner_user_id: string; role: PartnerRole; visibility: AccountabilityPartner['visibility']; status: AccountabilityPartner['status']; };

      const { data, error } = await supabase
        .from('AccountabilityPartner')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      setNickname('');
      setPartnerUserId(null);
      await fetchPartners();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const revokePartner = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('AccountabilityPartner')
        .update({ status: 'revoked' })
        .eq('id', id);
      if (error) throw error;
      await fetchPartners();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePartner = async (id: string) => {
    const ok = typeof window !== 'undefined' ? window.confirm('確定要永久刪除這位夥伴嗎？此動作無法復原。') : true;
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('AccountabilityPartner')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchPartners();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptInviteInline = async (id: string) => {
    if (!currentUserId) return;
    setLoading(true);
    setError(null);
    try {
      // 接受前檢查我方的夥伴數量（因為稍後會建立反向關係，會使我方數量 +1）
      {
        const { count, error: cErr } = await supabase
          .from('AccountabilityPartner')
          .select('id', { count: 'exact', head: true })
          .eq('owner_user_id', currentUserId)
          .in('status', ['pending', 'active']);
        if (cErr) throw cErr;
        if ((count || 0) >= 5) {
          setError('已達上限：最多 5 位夥伴，無法接受新的邀請');
          return;
        }
      }
      const { data: inviteRow, error: qErr } = await supabase
        .from('AccountabilityPartner')
        .select('*')
        .eq('id', id)
        .single();
      if (qErr) throw qErr;
      if (!inviteRow) throw new Error('找不到邀請');
      if (inviteRow.status === 'revoked') throw new Error('邀請已被取消');
      const ownerId: string = inviteRow.owner_user_id;

      const { error: uErr } = await supabase
        .from('AccountabilityPartner')
        .update({ status: 'active', partner_user_id: currentUserId })
        .eq('id', id);
      if (uErr) throw uErr;

      const { data: reverseRows, error: rErr } = await supabase
        .from('AccountabilityPartner')
        .select('id, status')
        .eq('owner_user_id', currentUserId)
        .eq('partner_user_id', ownerId);
      if (rErr) throw rErr;
      const existingReverse = Array.isArray(reverseRows) && reverseRows.length > 0 ? reverseRows[0] : null;
      if (!existingReverse) {
        const reversePayload = {
          owner_user_id: currentUserId,
          partner_user_id: ownerId,
          partner_email: null as string | null,
          role: inviteRow.role as PartnerRole,
          visibility: inviteRow.visibility,
          status: 'active' as const,
          invite_token: null as string | null,
        };
        const { error: iErr } = await supabase
          .from('AccountabilityPartner')
          .insert(reversePayload as any);
        if (iErr) throw iErr;
      } else if ((existingReverse as any).status !== 'active') {
        const { error: auErr } = await supabase
          .from('AccountabilityPartner')
          .update({ status: 'active' })
          .eq('id', (existingReverse as any).id);
        if (auErr) throw auErr;
      }

      await fetchIncoming();
      await fetchPartners();
    } catch (e: any) {
      setError(e?.message || '接受失敗');
    } finally {
      setLoading(false);
    }
  };

  const declineInviteInline = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: uErr } = await supabase
        .from('AccountabilityPartner')
        .update({ status: 'revoked' })
        .eq('id', id);
      if (uErr) throw uErr;
      await fetchIncoming();
    } catch (e: any) {
      setError(e?.message || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">夥伴 (Partner)</h1>
      <section className="rounded-md border p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-base font-semibold">本用戶與夥伴的每週數據</div>
              <div className="text-xs text-gray-500 mt-0.5">排序：{sortKey === 'netCommittedMinutes' ? '專注時長' : '承諾達成率'}（降冪）</div>
              <div className="text-xs text-gray-500">統計範圍：<span className="font-mono">{range ? `${new Date(range.start).toLocaleDateString()} ~ ${new Date(range.end).toLocaleDateString()}` : '-'}</span></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="inline-flex gap-1" aria-label="排序">
                <button className={`px-2 py-1 text-xs border rounded ${sortKey==='netCommittedMinutes'?"bg-black text-white":"bg-white"}`} onClick={() => setSortKey('netCommittedMinutes')}>專注時長</button>
                <button className={`px-2 py-1 text-xs border rounded ${sortKey==='commitmentRate'?"bg-black text-white":"bg-white"}`} onClick={() => setSortKey('commitmentRate')}>承諾達成率</button>
              </div>
              <div className="inline-flex gap-1" aria-label="範圍">
                <button className={`px-2 py-1 text-xs border rounded ${rangeType==='day'?"bg-black text-white":"bg-white"}`} onClick={() => setRangeType('day')}>本日</button>
                <button className={`px-2 py-1 text-xs border rounded ${rangeType==='week'?"bg-black text-white":"bg-white"}`} onClick={() => setRangeType('week')}>本週</button>
                <button className={`px-2 py-1 text-xs border rounded ${rangeType==='month'?"bg-black text-white":"bg-white"}`} onClick={() => setRangeType('month')}>本月</button>
              </div>
            </div>
          </div>
          {partners.filter(p => p.status === 'active' && !!p.partner_user_id).length > 5 && (
            <div className="mb-2 text-xs text-gray-500">僅顯示前 5 位夥伴</div>
          )}
          <div className="space-y-4">
            {(() => {
              const actives = partners.filter(p => p.status === 'active' && !!p.partner_user_id);
              if (actives.length === 0) {
                return (
                  <div className="text-sm text-gray-500">目前沒有可比較的 active 夥伴。建立或接受邀請後會在此顯示比較表。</div>
                );
              }
              const scored = actives.map(p => {
                const pid = p.partner_user_id as string;
                const pm = partnerMetricsMap[pid];
                const raw = sortKey === 'commitmentRate' ? (pm?.commitmentRate) : (pm?.netCommittedMinutes);
                const score = (raw ?? null) !== null && !Number.isNaN(Number(raw)) ? Number(raw) : -1; // 無資料排最後
                return { p, score };
              });
              scored.sort((a, b) => b.score - a.score);
              return scored.slice(0, 5).map(({ p }) => {
                const pid = p.partner_user_id as string;
                const pname = nicknames[pid] || '(匿名)';
                const pm = partnerMetricsMap[pid];
                const fmt = (v: any, type: 'num' | 'pct') => {
                  if (v == null) return '—';
                  if (type === 'pct') return `${Math.round((Number(v) || 0) * 100)}%`;
                  return String(v);
                };
                return (
                  <div key={p.id} className="rounded border p-3 bg-white">
                    <div className="mb-2 text-sm text-gray-600">夥伴：{pname}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2 border">指標</th>
                            <th className="text-right p-2 border">我</th>
                            <th className="text-right p-2 border">{pname}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-2 border">淨投入 (分)</td>
                            <td className="p-2 border text-right">{metrics.netCommittedMinutes}</td>
                            <td className="p-2 border text-right">{pm ? fmt(pm.netCommittedMinutes, 'num') : '…'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 border">誠實度</td>
                            <td className="p-2 border text-right">{`${Math.round(metrics.honestyRatio * 100)}%`}</td>
                            <td className="p-2 border text-right">{pm ? fmt(pm.honestyRatio, 'pct') : '…'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 border">中斷頻率/次</td>
                            <td className="p-2 border text-right">{metrics.interruptionFrequency}</td>
                            <td className="p-2 border text-right">{pm ? fmt(pm.interruptionFrequency, 'num') : '…'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 border">總投入 (分)</td>
                            <td className="p-2 border text-right">{metrics.totalDurationMinutes}</td>
                            <td className="p-2 border text-right">{pm ? fmt(pm.totalDurationMinutes, 'num') : '…'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 border">承諾達成率</td>
                            <td className="p-2 border text-right">{`${Math.round(metrics.commitmentRate * 100)}%`}</td>
                            <td className="p-2 border text-right">{pm ? fmt(pm.commitmentRate, 'pct') : '…'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </section>

      <section className="rounded-md border p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-base font-semibold">排行榜</div>
              <div className="text-xs text-gray-500 mt-0.5">排序：{sortKey === 'netCommittedMinutes' ? '專注時長' : '承諾達成率'}（降冪）</div>
              <div className="text-xs text-gray-500">統計範圍：<span className="font-mono">{range ? `${new Date(range.start).toLocaleDateString()} ~ ${new Date(range.end).toLocaleDateString()}` : '-'}</span></div>
            </div>
          </div>
          <ol className="divide-y">
            {(() => {
              const actives = partners.filter(p => p.status === 'active' && !!p.partner_user_id);
              const partnerEntries = actives.map(p => {
                const pid = p.partner_user_id as string;
                const pm = partnerMetricsMap[pid];
                const raw = sortKey === 'commitmentRate' ? (pm?.commitmentRate) : (pm?.netCommittedMinutes);
                const score = (raw ?? null) !== null && !Number.isNaN(Number(raw)) ? Number(raw) : -1;
                const name = nicknames[pid] || '(匿名)';
                return { key: p.id, name, score };
              });
              const meScore = sortKey === 'commitmentRate' ? metrics.commitmentRate : metrics.netCommittedMinutes;
              const entries = [
                { key: 'me', name: '我', score: Number(meScore) },
                ...partnerEntries,
              ];
              entries.sort((a, b) => (Number.isNaN(b.score) ? -1 : b.score) - (Number.isNaN(a.score) ? -1 : a.score));
              const top = entries.slice(0, 6);
              const fmt = (v: any) => {
                if (v == null || Number.isNaN(Number(v))) return '—';
                return sortKey === 'commitmentRate' ? `${Math.round(Number(v) * 100)}%` : String(v);
              };
              return top.map((row, idx) => {
                const isMe = row.key === 'me';
                return (
                  <li
                    key={row.key}
                    className={`py-2 flex items-center justify-between ${isMe ? 'bg-blue-50 rounded-md px-2' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-right tabular-nums">{idx + 1}</span>
                      <span className={`font-medium ${isMe ? 'text-blue-700' : ''}`}>{row.name}</span>
                    </div>
                    <div className={`text-sm ${isMe ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}>{fmt(row.score)}</div>
                  </li>
                );
              });
            })()}
          </ol>
        </section>

      <p className="text-gray-600 mb-6">邀請單一問責夥伴，設定角色與可見的數據範圍。</p>

      {!currentUserId && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          請先登入帳號以設定問責夥伴。
        </div>
      )}

      <div className="bg-white border rounded-lg p-4 shadow-sm mb-6">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">以匿名搜尋夥伴</label>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 border rounded-md p-2"
                type="text"
                placeholder="輸入對方匿名（3-20 字，英數與底線）"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setLookupError(null); setPartnerUserId(null); }}
              />
              <button
                type="button"
                className="px-3 py-2 text-sm border rounded-md"
                disabled={lookupLoading || !nickname}
                onClick={async () => {
                  setLookupLoading(true);
                  setLookupError(null);
                  setPartnerUserId(null);
                  try {
                    const re = /^[A-Za-z0-9_]{3,20}$/;
                    if (!re.test(nickname)) {
                      setLookupError('格式錯誤：僅限英數與底線，3-20 字');
                    } else {
                      const { data, error } = await supabase
                        .from('profiles')
                        .select('user_id, nickname')
                        .ilike('nickname', nickname)
                        .limit(10);
                      if (error) throw error;
                      const exact = (data || []).find((r: any) => (r.nickname || '').toLowerCase() === nickname.toLowerCase());
                      if (!exact) {
                        setLookupError('找不到此匿名的使用者');
                      } else {
                        setPartnerUserId(exact.user_id);
                      }
                    }
                  } catch (e: any) {
                    setLookupError(e.message || '查詢失敗');
                  } finally {
                    setLookupLoading(false);
                  }
                }}
              >{lookupLoading ? '查詢中…' : '查詢'}</button>
            </div>
            {partnerUserId && <div className="mt-2 text-xs text-green-700">已找到使用者 • 可建立邀請</div>}
            {lookupError && <div className="mt-2 text-xs text-red-600">{lookupError}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">夥伴角色</label>
            <select
              className="w-full border rounded-md p-2"
              value={role}
              onChange={(e) => setRole(e.target.value as PartnerRole)}
            >
              <option value="mentor">導師</option>
              <option value="peer">同儕</option>
              <option value="spouse">配偶</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">可見數據範圍</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={visibility.netCommittedMinutes} onChange={() => toggleVisibility('netCommittedMinutes')} />
                <span>淨投入時長</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={visibility.honestyRatio} onChange={() => toggleVisibility('honestyRatio')} />
                <span>誠實度比例</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={visibility.interruptionFrequency} onChange={() => toggleVisibility('interruptionFrequency')} />
                <span>中斷頻率</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={visibility.totalDurationMinutes} onChange={() => toggleVisibility('totalDurationMinutes')} />
                <span>總投入時長</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={visibility.commitmentRate} onChange={() => toggleVisibility('commitmentRate')} />
                <span>承諾達成率</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
              disabled={!canSubmit || loading || !currentUserId}
              onClick={createInvite}
            >
              產生邀請
            </button>
            {loading && <span className="text-sm text-gray-500">處理中…</span>}
            {error && (
              <span className="text-sm text-red-600">
                {error.includes('relation "AccountabilityPartner" does not exist')
                  ? '資料表尚未建立，請先在 Supabase 建立 AccountabilityPartner 與 RLS。'
                  : error}
              </span>
            )}
          </div>

          {/* 已移除邀請連結顯示，改為在本頁直接接受 */}
        </div>
      </div>

      <div className="bg白 border rounded-lg p-4 shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-3">待我接受的邀請</h2>
        {incoming.length === 0 ? (
          <p className="text-sm text-gray-500">目前沒有待接受的邀請。</p>
        ) : (
          <ul className="divide-y">
            {incoming.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">來自：{nicknames[p.owner_user_id] || '（匿名未設）'}</div>
                  <div className="text-xs text-gray-500">角色：{p.role}｜狀態：{p.status}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1 text-sm border rounded-md bg-blue-600 text白 disabled:opacity-50"
                    disabled={loading || !currentUserId}
                    onClick={() => acceptInviteInline(p.id)}
                  >接受</button>
                  <button
                    className="px-3 py-1 text-sm border rounded-md text-red-600"
                    onClick={() => declineInviteInline(p.id)}
                  >拒絕</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">已設定的夥伴</h2>
        {partners.length === 0 ? (
          <p className="text-sm text-gray-500">尚未有夥伴。</p>
        ) : (
          <ul className="divide-y">
            {(() => {
              const scored = partners.map(p => {
                const pid = p.partner_user_id as string | null;
                const pm = pid ? partnerMetricsMap[pid] : null;
                const raw = sortKey === 'commitmentRate' ? (pm?.commitmentRate) : (pm?.netCommittedMinutes);
                const score = (raw ?? null) !== null && !Number.isNaN(Number(raw)) ? Number(raw) : -1;
                return { p, score };
              });
              scored.sort((a, b) => b.score - a.score);
              return scored.slice(0, 5).map(({ p }) => (
                <li key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{nicknames[p.partner_user_id || ''] || '(連結待接受)'}</div>
                    <div className="text-xs text-gray-500">角色：{p.role}｜狀態：{p.status}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 text-sm border rounded-md text-red-600"
                      onClick={() => revokePartner(p.id)}
                    >
                      取消
                    </button>
                    <button
                      className="px-3 py-1 text-sm border rounded-md"
                      onClick={() => deletePartner(p.id)}
                    >
                      刪除
                    </button>
                  </div>
                </li>
              ));
            })()}
          </ul>
        )}
        {partners.length > 5 && (
          <div className="mt-2 text-xs text-gray-500">僅顯示前 5 位夥伴</div>
        )}
      </div>
    </div>
  );

}

  function Metric({ label, value }: { label: string; value: string | number }) {
    return (
      <div className="rounded border p-3 bg-white">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-semibold tabular-nums">{value}</div>
      </div>
    );
}

function getCurrentWeekRangeLocal() {
  const d = new Date();
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7; // Monday as 0
  const start = new Date(d);
  start.setDate(d.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function getTodayRangeLocal() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function getCurrentMonthRangeLocal() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function getLastWeekRangeTaipei() {
  const now = new Date();
  const tpe = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  const day = tpe.getDay();
  const currentWeekMonday = new Date(tpe);
  const diffToMonday = day === 0 ? -6 : 1 - day;
  currentWeekMonday.setDate(tpe.getDate() + diffToMonday);
  currentWeekMonday.setHours(0, 0, 0, 0);
  const lastWeekMonday = new Date(currentWeekMonday);
  lastWeekMonday.setDate(currentWeekMonday.getDate() - 7);
  const lastWeekSundayEnd = new Date(currentWeekMonday);
  lastWeekSundayEnd.setMilliseconds(-1);
  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);
  return { weekStart: toIsoDate(lastWeekMonday), weekEnd: toIsoDate(lastWeekSundayEnd) };
}

async function computeWeeklyMetricsLocal(userId: string, startIso: string, endIso: string) {
  const { data: goals, error: gErr } = await supabase
    .from('Goal')
    .select('goal_id')
    .eq('user_id', userId);
  if (gErr) throw gErr;
  const ids = (goals || []).map((g: any) => g.goal_id);
  if (ids.length === 0) {
    return { netCommittedMinutes: 0, totalDurationMinutes: 0, honestyRatio: 0, interruptionFrequency: 0, commitmentRate: 0 };
  }

  const { data: logs, error: lErr } = await supabase
    .from('FocusSessionLog')
    .select('duration_minutes, honesty_mode, interruption_count, start_time')
    .in('goal_id', ids)
    .gte('start_time', startIso)
    .lte('start_time', endIso);
  if (lErr) throw lErr;

  let net = 0, total = 0, ints = 0;
  (logs || []).forEach((l: any) => {
    const d = l?.duration_minutes || 0;
    total += d;
    ints += l?.interruption_count || 0;
    if (l?.honesty_mode === true) net += d;
  });
  const avgInt = (logs?.length || 0) > 0 ? ints / (logs!.length) : 0;
  const ratio = total > 0 ? net / total : 0;
  const weeklyTargetMinutes = 5 * 60;
  const commitmentRate = weeklyTargetMinutes > 0 ? Math.min(1, net / weeklyTargetMinutes) : 0;
  return {
    netCommittedMinutes: net,
    totalDurationMinutes: total,
    honestyRatio: Number(ratio.toFixed(2)),
    interruptionFrequency: Number(avgInt.toFixed(2)),
    commitmentRate: Number(commitmentRate.toFixed(2)),
  };
}
