import { useEffect, useState } from 'react';
import { hasExtensionPermission, isExtensionPage, subscribeExtensionPermissions, usesFirefoxDataConsent } from '../services/extensionPermissions';

export function useExtensionPermission(type) {
    const [allowed, setAllowed] = useState(() => type === 'geolocation' ? !isExtensionPage() : !usesFirefoxDataConsent());
    useEffect(() => {
        let current = true, generation = 0;
        const update = () => {
            const request = ++generation;
            hasExtensionPermission(type).then(value => { if (current && request === generation) setAllowed(value); });
        };
        update();
        const unsubscribe = subscribeExtensionPermissions(update);
        return () => { current = false; unsubscribe(); };
    }, [type]);
    return allowed;
}
