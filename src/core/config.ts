export const defaultConfig = {
  host: process.env.SSH_HOST,
  username: process.env.SSH_USERNAME,
  privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH,
  password: process.env.SSH_PASSWORD,
  port: parseInt(process.env.SSH_PORT || '22'),
};