interface StorageQuota {
  used: number;
  limit: number;
  percentUsed: number;
}

interface StorageOptions {
  maxSize?: number;
  compress?: boolean;
  onQuotaWarning?: (quota: StorageQuota) => void;
  onQuotaExceeded?: () => void;
}

const DEFAULT_LIMIT = 4 * 1024 * 1024; // 4MB conservative limit
const WARNING_THRESHOLD = 0.8; // Warn at 80%

export class StorageManager {
  private onQuotaWarning?: (quota: StorageQuota) => void;
  private onQuotaExceeded?: () => void;

  constructor(options: StorageOptions = {}) {
    this.onQuotaWarning = options.onQuotaWarning;
    this.onQuotaExceeded = options.onQuotaExceeded;
  }

  /**
   * Get current storage quota info
   */
  getQuota(): StorageQuota {
    const used = this.calculateStorageSize();
    const limit = DEFAULT_LIMIT;
    return {
      used,
      limit,
      percentUsed: used / limit,
    };
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, "test");
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Safely set item with quota management
   */
  async setItem(key: string, value: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error("localStorage is not available");
    }

    try {
      // Try direct write first
      localStorage.setItem(key, value);
      
      // Check quota after write
      const quota = this.getQuota();
      if (quota.percentUsed > WARNING_THRESHOLD) {
        this.onQuotaWarning?.(quota);
      }
      
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        // Quota exceeded - attempt recovery
        console.warn("Storage quota exceeded. Attempting cleanup...");
        this.onQuotaExceeded?.();
        
        // Clear non-critical data
        const cleared = await this.clearCacheData();
        
        if (cleared) {
          try {
            // Retry write after cleanup
            localStorage.setItem(key, value);
            return true;
          } catch {
            // Still failed after cleanup
            throw new Error(
              "Storage quota exceeded even after cleanup. Please clear browser history and try again."
            );
          }
        }
        
        throw new Error("Storage quota exceeded. Unable to save changes.");
      }
      
      throw error;
    }
  }

  /**
   * Get item safely
   */
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("Failed to read from storage:", error);
      return null;
    }
  }

  /**
   * Remove item safely
   */
  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Failed to remove from storage:", error);
      return false;
    }
  }

  /**
   * Clear non-critical cache data to make space
   */
  private async clearCacheData(): Promise<boolean> {
    const keysToTry = [
      "promptui_history",    // Clear old history first
      "promptui_layout_width", // Layout can be recalculated
      "promptui_files",      // Multi-file cache (less important)
    ];

    let totalCleared = 0;
    
    for (const key of keysToTry) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const size = value.length;
          localStorage.removeItem(key);
          totalCleared += size;
          console.log(`Cleared ${key} (${this.formatSize(size)})`);
        }
      } catch {
        // Continue to next key
      }
    }

    // If we cleared significant space, return success
    return totalCleared > 500 * 1024; // At least 500KB freed
  }

  /**
   * Calculate total storage size
   */
  private calculateStorageSize(): number {
    let total = 0;
    try {
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          const item = localStorage.getItem(key);
          total += (item?.length || 0) + key.length;
        }
      }
    } catch {
      // Quota exceeded error during calculation
    }
    return total;
  }

  /**
   * Format bytes to human readable
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  /**
   * Get quota status formatted for display
   */
  getQuotaStatus(): string {
    const quota = this.getQuota();
    return `${this.formatSize(quota.used)} / ${this.formatSize(quota.limit)} (${(
      quota.percentUsed * 100
    ).toFixed(0)}%)`;
  }
}
