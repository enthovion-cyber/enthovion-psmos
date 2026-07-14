export const appConfig = () => ({
  app: {
    origin: process.env.APP_ORIGIN ?? 'http://localhost:3000',
    port: Number(process.env.API_PORT ?? 4000)
  }
});
