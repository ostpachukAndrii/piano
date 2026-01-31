/**
 * Backend Client API
 *
 * Central export point for backend client implementations.
 * Use createBackendClient() to get the appropriate client for your environment.
 */

export * from './backend-client.interface';
export { TauriBackendClient } from './tauri-backend-client';
export { MockBackendClient } from './mock-backend-client';

import { BackendClient, BACKEND_CLIENT } from './backend-client.interface';
import { TauriBackendClient } from './tauri-backend-client';
import { MockBackendClient } from './mock-backend-client';

/**
 * Environment type for client selection
 */
export type BackendEnvironment = 'production' | 'development' | 'test' | 'mock';

/**
 * Configuration for creating a backend client
 */
export interface BackendClientConfig {
  environment?: BackendEnvironment;
  useMock?: boolean;
}

/**
 * Create the appropriate backend client based on environment
 *
 * @param config - Configuration options
 * @returns BackendClient instance
 *
 * @example
 * // Production (default)
 * const client = createBackendClient();
 *
 * @example
 * // Force mock for testing
 * const client = createBackendClient({ useMock: true });
 *
 * @example
 * // Automatic detection
 * const client = createBackendClient({ environment: 'test' });
 */
export function createBackendClient(
  config: BackendClientConfig = {}
): BackendClient {
  const { environment = 'production', useMock = false } = config;

  // Force mock if explicitly requested
  if (useMock) {
    return new MockBackendClient();
  }

  // Use mock in test environment
  if (environment === 'test' || environment === 'mock') {
    return new MockBackendClient();
  }

  // Use Tauri client in production and development
  return new TauriBackendClient();
}

/**
 * Singleton instance for convenience
 * Can be overridden using setDefaultBackendClient()
 */
let defaultClient: BackendClient | null = null;

/**
 * Get the default backend client instance
 * Creates one if it doesn't exist
 */
export function getBackendClient(): BackendClient {
  if (!defaultClient) {
    defaultClient = createBackendClient();
  }
  return defaultClient;
}

/**
 * Set a custom default backend client
 * Useful for testing or custom implementations
 */
export function setDefaultBackendClient(client: BackendClient): void {
  defaultClient = client;
}

/**
 * Reset the default client (useful for test cleanup)
 */
export function resetDefaultBackendClient(): void {
  defaultClient = null;
}
