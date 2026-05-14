import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

const TrialBanner: React.FC = () => {
  const { user } = useAuth();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkTrial = async () => {
      const { data } = await supabase
        .from('organizations')
        .select('trial_ends_at, plan')
        .single();

      if (!data?.trial_ends_at) return;

      const now = new Date();
      const trialEnd = new Date(data.trial_ends_at);
      const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      setDaysLeft(diff);
    };

    checkTrial();
  }, [user]);

  if (daysLeft === null || dismissed) return null;

  if (daysLeft <= 0) {
    return (
      <div className="bg-red-600 text-white text-center py-2 px-4 text-sm font-medium">
        Your trial has expired. Please upgrade to continue using IT Hub Center.
      </div>
    );
  }

  if (daysLeft > 7) return null;

  return (
    <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
      <span>{daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your trial.</span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 text-white/80 hover:text-white"
      >
        &times;
      </button>
    </div>
  );
};

export default TrialBanner;
