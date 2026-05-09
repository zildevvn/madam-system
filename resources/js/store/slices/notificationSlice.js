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
};

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        addNotificationFromSocket: (state, action) => {
            const message = action.payload;
            if (message) {
                // Avoid duplicates
                if (!state.messages.find(m => m.id === message.id)) {
                    state.messages = [message, ...state.messages];
                }

                // Update new indicator and latest message
                state.hasNewNotification = true;
                state.latestMessage = message;
                state.lastUpdated = Date.now();
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
                state.messages = action.payload;

                // Recalculate hasNewNotification and latestMessage based on 10 min rule
                const now = Date.now();
                let latestUnreadRecent = null;
                let latestUnreadRecentTime = 0;
                let hasRecentUnread = false;

                state.messages.forEach(msg => {
                    if (msg.is_read) return;

                    let msgTime = new Date(msg.created_at).getTime();
                    if (isNaN(msgTime) && msg.created_at) {
                        msgTime = new Date(msg.created_at.replace(' ', 'T')).getTime();
                    }

                    if (!isNaN(msgTime)) {
                        const diff = now - msgTime;
                        if (diff < 10 * 60 * 1000) {
                            hasRecentUnread = true;
                            if (msgTime > latestUnreadRecentTime) {
                                latestUnreadRecentTime = msgTime;
                                latestUnreadRecent = msg;
                            }
                        }
                    }
                });

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
                    // Recalculate if the one we just read was the latest
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

export default notificationSlice.reducer;
