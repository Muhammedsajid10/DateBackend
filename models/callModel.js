// In-memory store for active calls
let activeCalls = {}; // { callerSocketId: calleeSocketId, calleeSocketId: callerSocketId }

/**
 * Initiates a call record between two users.
 * @param {string} callerSocketId - The socket ID of the calling user.
 * @param {string} calleeSocketId - The socket ID of the user being called.
 */
const startCallAttempt = (callerSocketId, calleeSocketId) => {
    activeCalls[callerSocketId] = calleeSocketId;
    activeCalls[calleeSocketId] = callerSocketId;
    console.log(`Call attempt started in model: ${callerSocketId} <-> ${calleeSocketId}`);
};

/**
 * Confirms a call is established. This might be redundant if startCallAttempt is sufficient.
 * For now, it does the same as startCallAttempt, but could be expanded for more states.
 * @param {string} user1SocketId - Socket ID of the first user.
 * @param {string} user2SocketId - Socket ID of the second user.
 */
const confirmCall = (user1SocketId, user2SocketId) => {
    activeCalls[user1SocketId] = user2SocketId;
    activeCalls[user2SocketId] = user1SocketId;
    console.log(`Call confirmed in model: ${user1SocketId} <-> ${user2SocketId}`);
};

/**
 * Removes a call record involving a specific user.
 * If the user is in a call, it removes both entries for the call pair.
 * @param {string} userSocketId - The socket ID of the user whose call records should be cleared.
 * @returns {string | null} The socket ID of the peer if a call was active, otherwise null.
 */
const endCallForUser = (userSocketId) => {
    const peerSocketId = activeCalls[userSocketId];
    if (peerSocketId) {
        delete activeCalls[userSocketId];
        delete activeCalls[peerSocketId];
        console.log(`Call ended in model for user: ${userSocketId}, peer was: ${peerSocketId}`);
        return peerSocketId;
    }
    console.log(`No active call found in model for user: ${userSocketId} to end.`);
    return null;
};

/**
 * Gets the peer of a user in an active call.
 * @param {string} userSocketId - The socket ID of the user.
 * @returns {string | null} The socket ID of the peer if in a call, otherwise null.
 */
const getPeerInCall = (userSocketId) => {
    return activeCalls[userSocketId] || null;
};

/**
 * Checks if a user is currently in an active call.
 * @param {string} userSocketId - The socket ID of the user.
 * @returns {boolean} True if the user is in a call, false otherwise.
 */
const isUserInCall = (userSocketId) => {
    return !!activeCalls[userSocketId];
};

module.exports = {
    startCallAttempt,
    confirmCall,
    endCallForUser,
    getPeerInCall,
    isUserInCall,
    // getRawActiveCalls: () => activeCalls // For debugging or specific controller needs
};

