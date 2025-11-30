'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AcceptAccountabilityInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
      setUserEmail((data.user?.email as string) ?? null);
    };
    init();
  }, []);

  const acceptInvite = async () => {
    if (!token) {
      setError('缺少邀請代碼');
      return;
    }
    if (!userId) {
      setError('請先登入後再接受邀請');
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      // 接受前檢查我方的夥伴數量（pending/active）
      {
        const { count, error: cErr } = await supabase
          .from('AccountabilityPartner')
          .select('id', { count: 'exact', head: true })
          .eq('owner_user_id', userId!)
          .in('status', ['pending', 'active']);
        if (cErr) throw cErr;
        if ((count || 0) >= 5) {
          setError('已達上限：最多 5 位夥伴，無法接受新的邀請');
          return;
        }
      }
      // 1) 以 invite_token 或 id 查找邀請
      const { data: inviteRow, error: qErr } = await supabase
        .from('AccountabilityPartner')
        .select('*')
        .or(`invite_token.eq.${token},id.eq.${token}`)
        .single();
      if (qErr) throw qErr;
      if (!inviteRow) throw new Error('找不到邀請');
      if (inviteRow.status === 'revoked') throw new Error('邀請已被取消');

      const ownerId: string = inviteRow.owner_user_id;
      if (inviteRow.partner_user_id && inviteRow.partner_user_id !== userId) {
        throw new Error('此邀請已被其他帳號綁定');
      }

      // 2) 接受邀請：將此筆狀態設為 active 並綁定 partner_user_id
      const { error: uErr } = await supabase
        .from('AccountabilityPartner')
        .update({
          status: 'active',
          partner_user_id: userId,
          partner_email: inviteRow.partner_email ?? userEmail,
        })
        .eq('id', inviteRow.id);
      if (uErr) throw uErr;

      // 3) 建立互為關係（B -> A），若尚未存在
      const { data: reverseRows, error: rErr } = await supabase
        .from('AccountabilityPartner')
        .select('id, status')
        .eq('owner_user_id', userId)
        .eq('partner_user_id', ownerId);

      if (rErr) throw rErr;
      const existingReverse = Array.isArray(reverseRows) && reverseRows.length > 0 ? reverseRows[0] : null;

      if (!existingReverse) {
        const reversePayload = {
          owner_user_id: userId,
          partner_user_id: ownerId,
          partner_email: null as string | null,
          role: inviteRow.role as 'mentor' | 'peer' | 'spouse' | 'other',
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

      setMessage('已接受邀請，雙方已成為互為問責夥伴。');
    } catch (e: any) {
      setError(e?.message || '接受失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">接受問責邀請</h1>
      {!userId && (
        <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          請先登入後再接受邀請。
        </div>
      )}
      {token ? (
        <div className="text-sm text-gray-600">邀請代碼：<span className="font-mono break-all">{token}</span></div>
      ) : (
        <div className="text-sm text-red-600">缺少邀請代碼</div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
          disabled={!token || !userId || loading}
          onClick={acceptInvite}
        >
          {loading ? '處理中…' : '接受邀請'}
        </button>
        <button
          className="px-3 py-2 rounded-md border"
          onClick={() => router.push('/accountability/one-to-one')}
        >
          前往一對一報告
        </button>
      </div>

      {message && <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{message}</div>}
      {error && <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
    </div>
  );
}
