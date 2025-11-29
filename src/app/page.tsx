'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Spinner } from '@/components/ui/spinner';

export default function EntryRedirect() {
  const router = useRouter();

  React.useEffect(() => {
    const go = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          router.replace('/dashboard');
        } else {
          router.replace('/auth');
        }
      } catch {
        router.replace('/auth');
      }
    };
    go();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-[60vh]">
      <Spinner />
    </div>
  );
};
