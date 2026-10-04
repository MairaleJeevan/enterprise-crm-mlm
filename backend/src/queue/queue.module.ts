import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CommissionProcessor } from './commission.processor';

// Hosted Redis (Railway, Upstash, Render) gives a single URL with credentials;
// rediss:// means TLS. Fall back to host/port for local development.
function redisOptions() {
  if (process.env.REDIS_URL) {
    const url = new URL(process.env.REDIS_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
      // Railway's private network is IPv6-only
      family: 0,
    };
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  };
}

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      redis: redisOptions(),
    }),
    BullModule.registerQueue({
      name: 'sales',
    }),
  ],
  providers: [CommissionProcessor],
  exports: [BullModule],
})
export class QueueModule {}
