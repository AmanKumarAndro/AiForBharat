/**
 * Simple in-memory store for the farmer's active service request.
 * Persists as long as the app is running (no AsyncStorage needed).
 */
let _activeRequest = null;

const ActiveRequestStore = {
    set: (data) => { _activeRequest = data; },
    get: () => _activeRequest,
    clear: () => { _activeRequest = null; },
};

export default ActiveRequestStore;
