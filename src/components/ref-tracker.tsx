
"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function RefTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refSource = searchParams.get('ref');
    if (refSource) {
      // Store the referral source in session storage to persist it across navigation
      // within the same tab/session.
      sessionStorage.setItem('refSource', refSource);
    }
  }, [searchParams]);

  // This component does not render anything
  return null;
}
