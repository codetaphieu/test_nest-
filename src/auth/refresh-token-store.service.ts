import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createHash } from 'crypto';
import { createClient } from 'redis';

@Injectable()
export class RefreshTokenStoreService implements OnModuleInit, OnModuleDestroy {
  private readonly client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  async onModuleInit() {
    this.client.on('error', (error) => {
      console.error('Redis error:', error);
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  async store(token: string, userId: string, ttlSeconds: number) {
    await this.client.set(this.key(token), userId, {
      EX: ttlSeconds,
    });
  }

  async exists(token: string) {
    return (await this.client.exists(this.key(token))) === 1;
  }

  async revoke(token: string) {
    await this.client.del(this.key(token));
  }

  private key(token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    return `refresh-token:${tokenHash}`;
  }
}
