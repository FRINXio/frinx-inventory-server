const ENVIRONMENT = process.env.NODE_ENV || 'development';
const isProd = ENVIRONMENT === 'production';
const isDev = ENVIRONMENT === 'development';
const isTest = ENVIRONMENT === 'testing';

if (!(isProd || isDev || isTest)) {
  throw new Error('server: isProd or isDev or isTest has to be true');
}

export default isDev;
