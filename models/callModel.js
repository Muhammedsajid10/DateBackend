let activeCalls = {};

const startCallAttempt = (callerSocketId, calleeSocketId) => {
    activeCalls[callerSocketId] = calleeSocketId;
    activeCalls[calleeSocketId] = callerSocketId;
    console.log(`Call attempt started in model: ${callerSocketId} <-> ${calleeSocketId}`);
};

const confirmCall = (user1SocketId, user2SocketId) => {
    activeCalls[user1SocketId] = user2SocketId;
    activeCalls[user2SocketId] = user1SocketId;
    console.log(`Call confirmed in model: ${user1SocketId} <-> ${user2SocketId}`);
};

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

const getPeerInCall = (userSocketId) => {
    return activeCalls[userSocketId] || null;
};

const isUserInCall = (userSocketId) => {
    return !!activeCalls[userSocketId];
};

module.exports = {
    startCallAttempt,
    confirmCall,
    endCallForUser,
    getPeerInCall,
    isUserInCall,

};

