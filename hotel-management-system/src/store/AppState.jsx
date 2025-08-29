import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const STORAGE_NOTIFS = 'app_notifications';
const STORAGE_EMAILS = 'app_emails';

const initialNotifications = [
	{ id: 1, text: 'New reservation created', time: '2m', read: false },
	{ id: 2, text: 'Room 202 checked in', time: '10m', read: false },
	{ id: 3, text: 'Payment received from Alex', time: '1h', read: false },
];

const initialEmails = [
	{ id: 1, from: 'john@example.com', subject: 'Early check-in request', read: false },
	{ id: 2, from: 'jane@example.com', subject: 'Invoice copy', read: false },
];

const AppStateContext = createContext(null);

function appReducer(state, action) {
	switch (action.type) {
		case 'INIT':
			return action.payload;
		case 'ADD_NOTIFICATION':
			return { ...state, notifications: [action.payload, ...state.notifications] };
		case 'MARK_NOTIFS_READ':
			return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
		case 'CLEAR_NOTIFS':
			return { ...state, notifications: [] };
		case 'ADD_EMAIL':
			return { ...state, emails: [action.payload, ...state.emails] };
		case 'MARK_EMAILS_READ':
			return { ...state, emails: state.emails.map((e) => ({ ...e, read: true })) };
		default:
			return state;
	}
}

function AppStateProvider({ children }) {
	const [state, dispatch] = useReducer(appReducer, { notifications: [], emails: [] });

	// Initialize from localStorage once
	useEffect(() => {
		const storedNotifs = localStorage.getItem(STORAGE_NOTIFS);
		const storedEmails = localStorage.getItem(STORAGE_EMAILS);
		dispatch({
			type: 'INIT',
			payload: {
				notifications: storedNotifs ? JSON.parse(storedNotifs) : initialNotifications,
				emails: storedEmails ? JSON.parse(storedEmails) : initialEmails,
			},
		});
	}, []);

	// Persist
	useEffect(() => {
		localStorage.setItem(STORAGE_NOTIFS, JSON.stringify(state.notifications));
	}, [state.notifications]);
	useEffect(() => {
		localStorage.setItem(STORAGE_EMAILS, JSON.stringify(state.emails));
	}, [state.emails]);

	const value = useMemo(
		() => ({
			notifications: state.notifications,
			emails: state.emails,
			addNotification: (n) => dispatch({ type: 'ADD_NOTIFICATION', payload: n }),
			markAllNotificationsRead: () => dispatch({ type: 'MARK_NOTIFS_READ' }),
			clearNotifications: () => dispatch({ type: 'CLEAR_NOTIFS' }),
			addEmail: (e) => dispatch({ type: 'ADD_EMAIL', payload: e }),
			markAllEmailsRead: () => dispatch({ type: 'MARK_EMAILS_READ' }),
		}),
		[state]
	);

	return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
	const ctx = useContext(AppStateContext);
	if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
	return ctx;
}

export default AppStateProvider;
