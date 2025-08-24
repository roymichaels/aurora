// [AURORA-BEGIN:metadata-hybrid]
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createHash } from 'crypto';
import fetch from 'node-fetch';

import { getCidForKey, AssetKey } from '../utils/cid-registry';
import { ipfsUri } from '../utils/pinata';

async function fetchStats(wallet: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const apiKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  let xp = 0;
  let streakDays = 0;
  let goalsCompleted = 0;
  let updatedAt = new Date().toISOString();
  if (supabaseUrl && apiKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/user_stats?user_id=eq.${wallet}`, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const json: any = await res.json();
        const row = json[0];
        if (row) {
          xp = row.total_xp ?? 0;
          streakDays = row.streak_count ?? 0;
          goalsCompleted = row.goals_completed ?? 0;
          updatedAt = row.updated_at || updatedAt;
        }
      }
    } catch {}
  }
  return { xp, streakDays, goalsCompleted, updatedAt };
}

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/nft/metadata/:kind/:tokenId', async (req, reply) => {
    const params = z
      .object({ kind: z.enum(['auroraid', 'seasonpass', 'badge']), tokenId: z.string() })
      .safeParse(req.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'invalid_params' });
    }
    const { kind, tokenId } = params.data;
    let key: AssetKey;
    if (kind === 'auroraid') key = 'auroraid/base';
    else if (kind === 'seasonpass') key = 'seasonpass/base';
    else key = `badge/${tokenId}`;

    const cid = await getCidForKey(key);
    if (!cid) {
      return reply.code(404).send({ error: 'asset_not_found' });
    }

    const stats = await fetchStats(tokenId);
    const attributes = [
      { trait_type: 'XP', value: stats.xp },
      { trait_type: 'Streak Days', value: stats.streakDays },
      { trait_type: 'Goals Completed', value: stats.goalsCompleted },
    ];
    const etag = createHash('sha1').update(JSON.stringify(attributes)).digest('hex');
    reply.header('ETag', etag);
    reply.header('Cache-Control', 'public, max-age=300');

    const name =
      kind === 'badge' ? `Badge ${tokenId}` : kind === 'seasonpass' ? 'Season Pass' : 'AuroraID';
    const description = `Aurora ${kind}`;
    return {
      name,
      description,
      image: ipfsUri(cid),
      external_url: process.env.APP_ORIGIN || '',
      attributes,
      updatedAt: stats.updatedAt,
    };
  });
};

export default plugin;
// [AURORA-END:metadata-hybrid]
