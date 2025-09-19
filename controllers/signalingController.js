const activeUserStore = require("../models/activeUserStore");
const callModel = require("../models/callModel");
const GroupCall = require("../models/groupcallModel");

// This function will be called with the io instance and each socket connection
const initializeSignaling = (io, socket) => {
    console.log(`Signaling controller initialized for socket: ${socket.id}`);

    // Use socket.id as a temporary userId for this session.
    // In a real app, this would be replaced by an authenticated userId.
    const currentUserId = socket.id; 
    activeUserStore.addUser(socket.id, currentUserId);

    // ====== ONE-TO-ONE CALL HANDLERS ======

    // Handle call initiation
    socket.on("call-user", (data) => {
        const { targetUserId, sdpOffer, callType = 'video' } = data;
        console.log(`Controller: User ${socket.id} (userId: ${currentUserId}) is calling user ${targetUserId}`);
        
        const targetUser = activeUserStore.findUser(targetUserId);

        if (targetUser && targetUser.socketId !== socket.id) {
            console.log(`Controller: Sending incoming-call to ${targetUser.socketId} from ${currentUserId}`);
            io.to(targetUser.socketId).emit("incoming-call", {
                callerUserId: currentUserId,
                sdpOffer: sdpOffer,
                callType: callType
            });
            callModel.startCallAttempt(socket.id, targetUser.socketId);
        } else {
            console.log(`Controller: Target user ${targetUserId} not found or is the caller.`);
            socket.emit("call-failed", { reason: "User not available or invalid user." });
        }
    });

    // Handle call accepted
    socket.on("call-accepted", (data) => {
        const { callerUserId, sdpAnswer } = data;
        console.log(`Controller: User ${socket.id} (userId: ${currentUserId}) accepted call from ${callerUserId}`);
        
        const callerUser = activeUserStore.findUser(callerUserId);

        if (callerUser) {
            io.to(callerUser.socketId).emit("call-answered", { 
                calleeUserId: currentUserId,
                sdpAnswer: sdpAnswer
            });
            callModel.confirmCall(socket.id, callerUser.socketId);
        } else {
            console.log(`Controller: Caller ${callerUserId} not found for call-accepted.`);
        }
    });

    // Handle call rejected
    socket.on("call-rejected", (data) => {
        const { callerUserId } = data;
        console.log(`Controller: User ${socket.id} (userId: ${currentUserId}) rejected call from ${callerUserId}`);
        const callerUser = activeUserStore.findUser(callerUserId);

        if (callerUser) {
            io.to(callerUser.socketId).emit("call-denied", {
                calleeUserId: currentUserId
            });
            // If a call attempt was logged, clear it
            if (callModel.getPeerInCall(socket.id) === callerUser.socketId) {
                 callModel.endCallForUser(socket.id);
            }
        }
    });

    // Handle ICE candidates for one-to-one calls
    socket.on("ice-candidate", (data) => {
        const { targetUserId, candidate } = data;
        
        let targetSocketId = null;
        const peerSocketId = callModel.getPeerInCall(socket.id);
        const targetUser = activeUserStore.findUser(targetUserId);

        if (peerSocketId && targetUser && peerSocketId === targetUser.socketId) {
            targetSocketId = peerSocketId;
        } else if (targetUser) {
            targetSocketId = targetUser.socketId;
        }

        if (targetSocketId && targetSocketId !== socket.id) {
            io.to(targetSocketId).emit("ice-candidate", {
                senderUserId: currentUserId,
                candidate: candidate
            });
        } else {
            console.log(`Controller: Target user ${targetUserId} for ICE candidate not found or is self.`);
        }
    });

    // Handle end call
    socket.on("end-call", (data) => {
        const { otherUserId } = data;
        console.log(`Controller: User ${socket.id} (userId: ${currentUserId}) is ending call with ${otherUserId}`);
        
        const peerSocketId = callModel.getPeerInCall(socket.id);
        const otherUser = activeUserStore.findUser(otherUserId);

        if (peerSocketId && otherUser && peerSocketId === otherUser.socketId) {
            io.to(peerSocketId).emit("call-ended", {
                initiatorUserId: currentUserId
            });
            callModel.endCallForUser(socket.id);
            console.log("Controller: Call ended and removed from callModel.");
        } else {
            console.log(`Controller: Could not find peer ${otherUserId} in active calls for ${socket.id} to end call.`);
            if(otherUser){
                 io.to(otherUser.socketId).emit("call-ended", {
                    initiatorUserId: currentUserId
                });
            }
        }
    });

    // ====== GROUP CALL HANDLERS ======

    // Join group call room
    socket.on("join-group-call", async (data) => {
        const { roomId, userId } = data;
        console.log(`Controller: User ${socket.id} joining group call room: ${roomId}`);
        
        try {
            // Update the group call with socket ID
            const groupCall = await GroupCall.findOne({ roomId });
            if (groupCall) {
                const participant = groupCall.participants.find(p => 
                    p.userId.toString() === userId && p.isActive
                );
                if (participant) {
                    participant.socketId = socket.id;
                    await groupCall.save();
                }
            }

            // Join socket room
            socket.join(roomId);
            
            // Notify other participants
            socket.to(roomId).emit("user-joined-group-call", {
                userId: userId,
                socketId: socket.id
            });

            socket.emit("joined-group-call", { roomId });
            
        } catch (error) {
            console.error('Join group call error:', error);
            socket.emit("group-call-error", { message: "Failed to join group call" });
        }
    });

    // Handle group call offer (when user wants to start sending their stream)
    socket.on("group-call-offer", (data) => {
        const { roomId, targetUserId, sdpOffer } = data;
        console.log(`Controller: Group call offer from ${socket.id} to ${targetUserId} in room ${roomId}`);
        
        socket.to(roomId).emit("group-call-offer", {
            fromUserId: currentUserId,
            targetUserId: targetUserId,
            sdpOffer: sdpOffer
        });
    });

    // Handle group call answer
    socket.on("group-call-answer", (data) => {
        const { roomId, targetUserId, sdpAnswer } = data;
        console.log(`Controller: Group call answer from ${socket.id} to ${targetUserId} in room ${roomId}`);
        
        socket.to(roomId).emit("group-call-answer", {
            fromUserId: currentUserId,
            targetUserId: targetUserId,
            sdpAnswer: sdpAnswer
        });
    });

    // Handle ICE candidates for group calls
    socket.on("group-ice-candidate", (data) => {
        const { roomId, targetUserId, candidate } = data;
        
        socket.to(roomId).emit("group-ice-candidate", {
            fromUserId: currentUserId,
            targetUserId: targetUserId,
            candidate: candidate
        });
    });

    // Handle participant mute/unmute
    socket.on("participant-mute-toggle", (data) => {
        const { roomId, isMuted } = data;
        
        socket.to(roomId).emit("participant-muted", {
            userId: currentUserId,
            isMuted: isMuted
        });
    });

    // Handle participant video on/off
    socket.on("participant-video-toggle", (data) => {
        const { roomId, isVideoOff } = data;
        
        socket.to(roomId).emit("participant-video-toggled", {
            userId: currentUserId,
            isVideoOff: isVideoOff
        });
    });

    // Leave group call
    socket.on("leave-group-call", async (data) => {
        const { roomId, userId } = data;
        console.log(`Controller: User ${socket.id} leaving group call room: ${roomId}`);
        
        try {
            // Update database
            const groupCall = await GroupCall.findOne({ roomId });
            if (groupCall) {
                const participant = groupCall.participants.find(p => 
                    p.userId.toString() === userId && p.isActive
                );
                if (participant) {
                    participant.isActive = false;
                    participant.leftAt = new Date();
                    participant.socketId = null;
                    await groupCall.save();
                }
            }

            // Leave socket room
            socket.leave(roomId);
            
            // Notify other participants
            socket.to(roomId).emit("user-left-group-call", {
                userId: userId
            });
            
        } catch (error) {
            console.error('Leave group call error:', error);
        }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
        console.log(`Controller: User ${socket.id} (userId: ${currentUserId}) disconnected.`);
        
        // Handle one-to-one call cleanup
        const peerSocketId = callModel.getPeerInCall(socket.id);
        if (peerSocketId) {
            const peerUser = activeUserStore.getUserBySocketId(peerSocketId);
            if(peerUser){
                console.log(`Controller: User ${currentUserId} disconnected during a call with ${peerUser.userId}`);
                io.to(peerSocketId).emit("call-ended", {
                    initiatorUserId: currentUserId,
                    reason: "User disconnected"
                });
            }
            callModel.endCallForUser(socket.id);
        }

        // Handle group call cleanup
        try {
            const groupCalls = await GroupCall.find({
                'participants.socketId': socket.id,
                status: { $in: ['waiting', 'active'] }
            });

            for (const groupCall of groupCalls) {
                const participant = groupCall.participants.find(p => p.socketId === socket.id);
                if (participant && participant.isActive) {
                    participant.isActive = false;
                    participant.leftAt = new Date();
                    participant.socketId = null;
                    
                    // Notify other participants in the room
                    socket.to(groupCall.roomId).emit("user-left-group-call", {
                        userId: participant.userId,
                        reason: "User disconnected"
                    });
                }
                await groupCall.save();
            }
        } catch (error) {
            console.error('Group call cleanup error:', error);
        }

        activeUserStore.removeUser(socket.id);
        console.log("Controller: Cleaned up user from callModel and activeUserStore.");
    });
};

module.exports = {
    initializeSignaling
};

