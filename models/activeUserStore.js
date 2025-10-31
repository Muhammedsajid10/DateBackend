// In-memory store for active users
let activeUsers = {}; // { socketId: { userId: string, socketId: string } }

/**
 * Adds a user to the active users list.
 * @param {string} socketId - The socket ID of the user.
 * @param {string} userId - The application-specific user ID.
 */
const addUser = (socketId, userId) => {
    activeUsers[socketId] = { userId: userId, socketId: socketId };
    console.log("User added to model:", userId, "Socket:", socketId);
    console.log("Current active users in model:", Object.values(activeUsers).map(u => u.userId));
};

/**
 * Removes a user from the active users list.
 * @param {string} socketId - The socket ID of the user to remove.
 * @returns {object | null} The user object that was removed, or null if not found.
 */
const removeUser = (socketId) => {
    const user = activeUsers[socketId];
    if (user) {
        delete activeUsers[socketId];
        console.log("User removed from model:", user.userId, "Socket:", socketId);
        console.log("Current active users in model:", Object.values(activeUsers).map(u => u.userId));
        return user;
    }
    return null;
};

/**
 * Finds a user by their application-specific user ID or socket ID.
 * @param {string} id - The user ID or socket ID to search for.
 * @returns {object | null} The user object if found, otherwise null.
 */
const findUser = (id) => {
    // Check if the id is a socketId first
    if (activeUsers[id]) {
        return activeUsers[id];
    }
    // Then check if it's a userId
    for (const socketId in activeUsers) {
        if (activeUsers[socketId].userId === id) {
            return activeUsers[socketId];
        }
    }
    return null;
};

/**
 * Gets a user by their socket ID.
 * @param {string} socketId - The socket ID.
 * @returns {object | null} The user object if found, otherwise null.
 */
const getUserBySocketId = (socketId) => {
    return activeUsers[socketId] || null;
};

/**
 * Gets all active users.
 * @returns {object[]} An array of active user objects.
 */
const getAllActiveUsers = () => {
    return Object.values(activeUsers);
};

module.exports = {
    addUser,
    removeUser,
    findUser,
    getUserBySocketId,
    getAllActiveUsers,
    // Expose activeUsers directly only if absolutely necessary and with caution
    // For better encapsulation, prefer specific getter/setter functions.
    // getRawActiveUsers: () => activeUsers // Example if direct access is needed by controller
};

