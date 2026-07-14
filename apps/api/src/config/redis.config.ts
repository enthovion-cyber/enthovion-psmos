export const redisConfig = () => ({
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379'
  }
});
