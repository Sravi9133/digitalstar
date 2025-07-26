
"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function RefTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refSource = searchParams.get('ref');
    // Only set the refSource in sessionStorage if it doesn't already exist.
    // This makes the first referral code "stick" for the entire session.
    if (refSource && !sessionStorage.getItem('refSource')) {
      sessionStorage.setItem('refSource', refSource);
    }
  }, [searchParams]);

  // This component does not render anything
  return null;
}
