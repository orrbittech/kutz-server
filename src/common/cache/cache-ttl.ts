import { ConfigService } from '@nestjs/config';

export function getCacheTtlMs(config: ConfigService): number {
  const raw = config.get<string>('CACHE_TTL_MS');
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 60_000;
}
