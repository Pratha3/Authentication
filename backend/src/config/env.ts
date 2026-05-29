import dotenv from "dotenv";

dotenv.config();

type OptionalEnv = {
  JWT_EXPIRES_IN: string;
  NODE_ENV: string;
  PORT: number;
  CLIENT_URL: string;
  BACKEND_URL: string | null;
  EMAIL_USER: string | null;
  EMAIL_PASS: string | null;
  WHATSAPP_ENABLED: boolean;
  SMS_ENABLED: boolean;
  SMS_PROVIDER: string | null;
};

type Env = OptionalEnv & {
  MONGO_URI: string;
  JWT_SECRET: string;
};

function getRequired(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptional(name: string, fallback: string | null = null): string | null {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function getBoolean(name: string, fallback = false): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  return ["true", "1", "yes", "on"].includes(value);
}

function getPort(): number {
  const raw = process.env.PORT?.trim();
  if (!raw) return 5000;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error("PORT must be a valid TCP port number.");
  }
  return parsed;
}

function validateJwtSecret(secret: string): void {
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long.");
  }
  if (secret === "change_this_to_a_long_random_secret_minimum_32_chars") {
    throw new Error("JWT_SECRET must be changed from the example value.");
  }
}

function loadEnv(): Env {
  const jwtSecret = getRequired("JWT_SECRET");
  validateJwtSecret(jwtSecret);

  return {
    MONGO_URI: getRequired("MONGO_URI"),
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: getOptional("JWT_EXPIRES_IN", "7d")!,
    NODE_ENV: getOptional("NODE_ENV", "development")!,
    PORT: getPort(),
    CLIENT_URL: getOptional("CLIENT_URL", "http://localhost:3000")!,
    BACKEND_URL: getOptional("BACKEND_URL"),
    EMAIL_USER: getOptional("EMAIL_USER"),
    EMAIL_PASS: getOptional("EMAIL_PASS"),
    WHATSAPP_ENABLED: getBoolean("WHATSAPP_ENABLED"),
    SMS_ENABLED: getBoolean("SMS_ENABLED", true),
    SMS_PROVIDER: getOptional("SMS_PROVIDER"),
  };
}

export const env = loadEnv();
