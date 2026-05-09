import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { getSystemMessagesApi, markSystemMessageAsReadApi } from '../../services/systemMessageService';

// Thunks
export const fetchNotificationsAsync = createAsyncThunk(
    'notification/fetchAll',
    async (userId) => {
        const response = await getSystemMessagesApi(userId);
        return response.data || [];
    }
);

export const markNotificationAsReadAsync = createAsyncThunk(
    'notification/markAsRead',
    async ({ messageId, userId }) => {
        await markSystemMessageAsReadApi(messageId, userId);
        return messageId;
    }
);

const initialState = {
    messages: [],
    status: 'idle', // 'idle' | 'loading' | 'failed'
    hasNewNotification: false,
    latestMessage: null,
    lastUpdated: null,
    socketSequence: 0,
};

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        addNotificationFromSocket: (state, action) => {
            const message = action.payload;
            if (message) {
                // [WHY] Merge into existing messages or update existing one
                const existingIdx = state.messages.findIndex(m => String(m.id) === String(message.id));
                if (existingIdx === -1) {
                    state.messages = [message, ...state.messages];
                } else {
                    state.messages[existingIdx] = { ...state.messages[existingIdx], ...message };
                }
                
                // Sort by date descending to ensure consistency
                state.messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                
                // [RULE] Real-time updates must trigger immediate visibility if unread
                if (!message.is_read) {
                    state.hasNewNotification = true;
                    state.latestMessage = message;
                    state.lastUpdated = Date.now();
                    state.socketSequence += 1;
                }
            }
        },
        clearNewNotificationIndicator: (state) => {
            state.hasNewNotification = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotificationsAsync.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchNotificationsAsync.fulfilled, (state, action) => {
                state.status = 'idle';
                
                // [WHY] Use a Map for efficient, deduplicated merging of API and Socket data
                const apiMessages = action.payload || [];
                const messageMap = new Map();
                
                // 1. Seed with existing state (might contain fresh socket messages)
                state.messages.forEach(m => messageMap.set(String(m.id), m));
                
                // 2. Merge API data (might contain updates like is_read status)
                apiMessages.forEach(m => {
                    const id = String(m.id);
                    messageMap.set(id, { ...messageMap.get(id), ...m });
                });

                // 3. Update state with sorted array
                state.messages = Array.from(messageMap.values()).sort((a, b) => {
                    return new Date(b.created_at) - new Date(a.created_at);
                });
                
                const now = Date.now();
                let latestUnreadRecent = null;
                let latestUnreadRecentTime = 0;
                let hasRecentUnread = false;

                state.messages.forEach(msg => {
                    if (msg.is_read) return;

                    // Robust date parsing
                    let msgTime = new Date(msg.created_at).getTime();
                    if (isNaN(msgTime) && typeof msg.created_at === 'string') {
                        msgTime = new Date(msg.created_at.replace(' ', 'T')).getTime();
                    }

                    if (!isNaN(msgTime)) {
                        const diff = now - msgTime;
                        // Recent = within last 10 minutes
                        if (diff < 10 * 60 * 1000) {
                            hasRecentUnread = true;
                            if (msgTime > latestUnreadRecentTime) {
                                latestUnreadRecentTime = msgTime;
                                latestUnreadRecent = msg;
                            }
                        }
                    }
                });

                // [RULE] Always update visibility to match the source of truth
                state.hasNewNotification = hasRecentUnread;
                state.latestMessage = latestUnreadRecent;
                state.lastUpdated = now;
            })
            .addCase(fetchNotificationsAsync.rejected, (state) => {
                state.status = 'failed';
            })
            .addCase(markNotificationAsReadAsync.fulfilled, (state, action) => {
                const messageId = action.payload;
                const msg = state.messages.find(m => m.id === messageId);
                if (msg) {
                    msg.is_read = true;
                }
                
                // Check if we still have any recent unread messages
                if (state.latestMessage && state.latestMessage.id === messageId) {
                    const now = Date.now();
                    let nextLatest = null;
                    let nextLatestTime = 0;
                    let hasRecent = false;

                    state.messages.forEach(m => {
                        if (m.is_read) return;
                        let mTime = new Date(m.created_at).getTime();
                        if (isNaN(mTime) && m.created_at) {
                            mTime = new Date(m.created_at.replace(' ', 'T')).getTime();
                        }
                        if (!isNaN(mTime) && (now - mTime < 10 * 60 * 1000)) {
                            hasRecent = true;
                            if (mTime > nextLatestTime) {
                                nextLatestTime = mTime;
                                nextLatest = m;
                            }
                        }
                    });
                    state.hasNewNotification = hasRecent;
                    state.latestMessage = nextLatest;
                }
            });
    }
});

export const { addNotificationFromSocket, clearNewNotificationIndicator } = notificationSlice.actions;

// Selectors
export const selectNotifications = state => state.notification.messages;
export const selectHasNewNotification = state => state.notification.hasNewNotification;
export const selectLatestNotification = state => state.notification.latestMessage;
export const selectNotificationLastUpdated = state => state.notification.lastUpdated;
export const selectNotificationSequence = state => state.notification.socketSequence;

export default notificationSlice.reducer;
