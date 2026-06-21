import { useState, useEffect } from "react";
import { StorageManager } from "@/lib/storage-manager";

export function useStorageQuota() {
    const [quota, setQuota] = useState({ percentUsed: 0, status: "OK" });

    useEffect(() => {
        const storageManager = new StorageManager();
        
        const checkQuota = () => {
            if (typeof window === "undefined" || !storageManager.isAvailable()) return;
            
            const usage = storageManager.getQuota();
            let status = "OK";
            if (usage.percentUsed > 0.9) status = "CRITICAL";
            else if (usage.percentUsed > 0.7) status = "WARNING";

            setQuota({
                percentUsed: usage.percentUsed,
                status,
            });
        };

        checkQuota();
        const interval = setInterval(checkQuota, 30000); // Check every 30 seconds

        // Custom event to force check
        const handleStorageUpdate = () => checkQuota();
        window.addEventListener("storage", handleStorageUpdate);
        window.addEventListener("promptui-storage-update", handleStorageUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener("storage", handleStorageUpdate);
            window.removeEventListener("promptui-storage-update", handleStorageUpdate);
        };
    }, []);

    return { quota, status: quota.status };
}
