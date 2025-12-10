'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BattleRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到攻词页面
    router.replace('/study/battle/battle');
  }, [router]);

  return null;
} 