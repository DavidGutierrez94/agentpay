/**
 * Agent initialization — sets up model provider environment
 *
 * Call initModelProvider() at the start of every agent before any SDK usage.
 * This configures the Claude Agent SDK to use OpenRouter or Anthropic.
 */

import { CONFIG, type ModelProvider } from "./config.js";

let initialized = false;

export interface ModelProviderInfo {
  provider: ModelProvider;
  model: string;
  baseUrl: string;
}

/**
 * Initialize the model provider environment.
 * Must be called before using @anthropic-ai/claude-agent-sdk.
 *
 * Sets environment variables that the SDK reads:
 * - ANTHROPIC_API_KEY → API key (OpenRouter or Anthropic)
 * - ANTHROPIC_BASE_URL → Base URL (OpenRouter or Anthropic default)
 */
export function initModelProvider(): ModelProviderInfo {
  if (initialized) {
    return getProviderInfo();
  }

  if (CONFIG.modelProvider === "openrouter") {
    if (!CONFIG.openRouter.apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY is required when MODEL_PROVIDER=openrouter. " +
          "Get your key at https://openrouter.ai/keys",
      );
    }

    // Override Anthropic SDK env vars to point to OpenRouter
    process.env.ANTHROPIC_API_KEY = CONFIG.openRouter.apiKey;
    process.env.ANTHROPIC_BASE_URL = CONFIG.openRouter.baseUrl;

    // OpenRouter-specific headers (set as env vars for SDK to pick up if supported)
    process.env.OPENROUTER_SITE_URL = CONFIG.openRouter.siteUrl;
    process.env.OPENROUTER_SITE_NAME = CONFIG.openRouter.siteName;

    console.log(`[Model Provider] ✓ OpenRouter initialized`);
    console.log(`[Model Provider]   Model: ${CONFIG.defaultModel}`);
    console.log(`[Model Provider]   Base URL: ${CONFIG.openRouter.baseUrl}`);
  } else {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY is required when MODEL_PROVIDER=anthropic. " +
          "Get your key at https://console.anthropic.com/",
      );
    }

    console.log(`[Model Provider] ✓ Anthropic Direct initialized`);
    console.log(`[Model Provider]   Model: ${CONFIG.defaultModel}`);
  }

  initialized = true;
  return getProviderInfo();
}

/**
 * Get current provider info (without initializing)
 */
export function getProviderInfo(): ModelProviderInfo {
  return {
    provider: CONFIG.modelProvider,
    model: CONFIG.defaultModel,
    baseUrl:
      CONFIG.modelProvider === "openrouter"
        ? CONFIG.openRouter.baseUrl
        : "https://api.anthropic.com",
  };
}

/**
 * Check if using OpenRouter
 */
export function isOpenRouter(): boolean {
  return CONFIG.modelProvider === "openrouter";
}

/**
 * Check if provider is initialized
 */
export function isInitialized(): boolean {
  return initialized;
}
