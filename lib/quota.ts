/**
 * Usage Quota Enforcement
 * Check and increment quota usage for workspaces
 */

import { createServiceAuthClient } from './auth';

export class QuotaExceededError extends Error {
  constructor(message: string, public quotaType: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export interface QuotaStatus {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetDate: string;
}

/**
 * Check if workspace can perform action without exceeding quota
 */
export async function checkQuota(
  workspaceId: string,
  quotaType: 'query' | 'document' | 'api_call',
  increment = 1
): Promise<QuotaStatus> {
  const supabase = createServiceAuthClient();

  // Fetch current quota
  const { data: quota, error } = await supabase
    .from('usage_quotas')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !quota) {
    throw new Error(`No quota found for workspace ${workspaceId}`);
  }

  // Check if period has expired and reset if needed
  const now = new Date();
  const periodEnd = new Date(quota.period_end);

  if (now > periodEnd) {
    // Reset quota for new period
    const { error: resetError } = await supabase
      .from('usage_quotas')
      .update({
        queries_used: 0,
        documents_used: 0,
        api_calls_used: 0,
        period_start: now.toISOString(),
        period_end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
      })
      .eq('workspace_id', workspaceId);

    if (resetError) {
      console.error('Error resetting quota:', resetError);
    }

    // Refetch quota after reset
    const { data: newQuota } = await supabase
      .from('usage_quotas')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (newQuota) {
      return {
        allowed: true,
        used: 0,
        limit: getLimit(newQuota, quotaType),
        remaining: getLimit(newQuota, quotaType),
        resetDate: newQuota.period_end,
      };
    }
  }

  const used = getUsed(quota, quotaType);
  const limit = getLimit(quota, quotaType);
  const remaining = Math.max(0, limit - used);
  const allowed = used + increment <= limit;

  return {
    allowed,
    used,
    limit,
    remaining,
    resetDate: quota.period_end,
  };
}

/**
 * Increment usage counter for workspace
 */
export async function incrementQuota(
  workspaceId: string,
  quotaType: 'query' | 'document' | 'api_call',
  increment = 1
): Promise<void> {
  const supabase = createServiceAuthClient();

  const field = `${quotaType === 'query' ? 'queries' : quotaType === 'document' ? 'documents' : 'api_calls'}_used`;

  const { error } = await supabase
    .from('usage_quotas')
    .update({
      [field]: supabase.rpc('increment', { amount: increment }),
    })
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('Error incrementing quota:', error);
    throw new Error('Failed to increment quota');
  }
}

/**
 * Check quota and throw if exceeded
 */
export async function enforceQuota(
  workspaceId: string,
  quotaType: 'query' | 'document' | 'api_call',
  increment = 1
): Promise<void> {
  const status = await checkQuota(workspaceId, quotaType, increment);

  if (!status.allowed) {
    const resetDate = new Date(status.resetDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    throw new QuotaExceededError(
      `Quota exceeded: ${status.used}/${status.limit} ${quotaType}s used this period. Resets on ${resetDate}.`,
      quotaType
    );
  }

  // Increment usage counter
  await incrementQuota(workspaceId, quotaType, increment);
}

/**
 * Get current usage for specific quota type
 */
function getUsed(quota: any, quotaType: string): number {
  switch (quotaType) {
    case 'query':
      return quota.queries_used;
    case 'document':
      return quota.documents_used;
    case 'api_call':
      return quota.api_calls_used;
    default:
      return 0;
  }
}

/**
 * Get limit for specific quota type
 */
function getLimit(quota: any, quotaType: string): number {
  switch (quotaType) {
    case 'query':
      return quota.queries_limit;
    case 'document':
      return quota.documents_limit;
    case 'api_call':
      return quota.api_calls_limit;
    default:
      return 0;
  }
}

/**
 * Get quota status for all types
 */
export async function getQuotaStatus(workspaceId: string) {
  const supabase = createServiceAuthClient();

  const { data: quota, error } = await supabase
    .from('usage_quotas')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !quota) {
    return null;
  }

  return {
    plan: quota.plan,
    queries: {
      used: quota.queries_used,
      limit: quota.queries_limit,
      remaining: Math.max(0, quota.queries_limit - quota.queries_used),
    },
    documents: {
      used: quota.documents_used,
      limit: quota.documents_limit,
      remaining: Math.max(0, quota.documents_limit - quota.documents_used),
    },
    apiCalls: {
      used: quota.api_calls_used,
      limit: quota.api_calls_limit,
      remaining: Math.max(0, quota.api_calls_limit - quota.api_calls_used),
    },
    periodStart: quota.period_start,
    periodEnd: quota.period_end,
  };
}
