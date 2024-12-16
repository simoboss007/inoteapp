import Constants from 'expo-constants';

const ENV = {
  development: {
    APP_ENV: 'development',
    API_URL: 'https://dev-api.inote.app',
    STORAGE_KEY: '@inote-storage-dev',
  },
  staging: {
    APP_ENV: 'staging',
    API_URL: 'https://staging-api.inote.app',
    STORAGE_KEY: '@inote-storage-staging',
  },
  production: {
    APP_ENV: 'production',
    API_URL: 'https://api.inote.app',
    STORAGE_KEY: '@inote-storage-prod',
  },
};

const getEnvVars = (env = Constants.expoConfig.extra.APP_ENV) => {
  if (env === 'production') {
    return ENV.production;
  } else if (env === 'staging') {
    return ENV.staging;
  } else {
    return ENV.development;
  }
};

export default getEnvVars;
