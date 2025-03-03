import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js';
import {
	getAuth,
	onAuthStateChanged,
	signOut,
} from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js';
import {
	getFirestore,
	collection,
	getDocs,
	doc,
	getDoc,
	setDoc,
	updateDoc,
	serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js';

// Firebase Config
const firebaseConfig = {
	apiKey: 'AIzaSyBatqRKwTrVlROFGAWidCGEbLmq0jxILkI',
	authDomain: 'timestamp-logbook.firebaseapp.com',
	projectId: 'timestamp-logbook',
	storageBucket: 'timestamp-logbook.firebasestorage.app',
	messagingSenderId: '619371204193',
	appId: '1:619371204193:web:02b38517c343d22731a420',
	measurementId: 'G-PQP8JL4F9P',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get elements
const userNameElement = document.getElementById('user-name');
const logbookTableBody = document.getElementById('logbook-entries');

// Function to get today's date in YYYY-MM-DD format
function getCurrentDate() {
	const today = new Date();
	const year = today.getFullYear();
	const month = (today.getMonth() + 1).toString().padStart(2, '0');
	const day = today.getDate().toString().padStart(2, '0');
	return `${year}-${month}-${day}`; // Format YYYY-MM-DD
}

// Function to format Firestore timestamps
function formatDate(timestamp) {
	if (!timestamp?.seconds) return 'N/A';
	const date = new Date(timestamp.seconds * 1000);
	return date.toLocaleDateString();
}

function formatTime(timestamp) {
	if (!timestamp?.seconds) return 'N/A';
	const date = new Date(timestamp.seconds * 1000);
	return date.toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
		hour12: true,
	});
}

// Function to calculate whole hours worked
function calculateHoursWorked(loginTimestamp, logoutTimestamp) {
	if (!loginTimestamp?.seconds || !logoutTimestamp?.seconds) return 0;

	const loginTime = new Date(loginTimestamp.seconds * 1000);
	const logoutTime = new Date(logoutTimestamp.seconds * 1000);

	const timeDiff = (logoutTime - loginTime) / (1000 * 60 * 60);
	return Math.max(Math.floor(timeDiff), 0);
}

// Function to fetch and display logbook entries
async function fetchUserLogbook(userId) {
	try {
		const logbookRef = collection(db, 'Users', userId, 'Logbook');
		const logbookSnapshot = await getDocs(logbookRef);
		logbookTableBody.innerHTML = '';

		if (logbookSnapshot.empty) {
			logbookTableBody.innerHTML = `<tr><td colspan="5">No log entries found</td></tr>`;
			updateResultCard(0);
			return;
		}

		let totalHours = 0;

		logbookSnapshot.forEach((doc) => {
			const data = doc.data();
			const formattedDate = formatDate(data.date);
			const formattedLogin = formatTime(data.login);
			const formattedLogout = formatTime(data.logout);
			const hoursWorked = calculateHoursWorked(data.login, data.logout);

			totalHours += hoursWorked;

			logbookTableBody.insertAdjacentHTML(
				'beforeend',
				`
				<tr>
					<td>${formattedDate}</td>
					<td>${formattedLogin}</td>
					<td>${formattedLogout}</td>
					<td>${hoursWorked}</td>
					<td>${data.condition || 'N/A'}</td>
				</tr>
			`
			);
		});

		updateResultCard(totalHours);
	} catch (error) {
		console.error('Error fetching logbook:', error);
		logbookTableBody.innerHTML = `<tr><td colspan="5">Error loading logbook</td></tr>`;
		updateResultCard(0);
	}
}

// Select elements in the result section
const totalHoursElement = document.querySelector('.total-hours h4:last-child');
const hoursRemainingElement = document.querySelector(
	'.hours-remaining h4:last-child'
);
const daysRemainingElement = document.querySelector(
	'.days-remaining h4:last-child'
);

// Function to update the result section
function updateResultCard(totalHours) {
	const requiredHours = 486;
	const remainingHours = Math.max(requiredHours - totalHours, 0);
	const daysRemaining = Math.ceil(remainingHours / 8);

	totalHoursElement.textContent = totalHours;
	hoursRemainingElement.textContent = remainingHours;
	daysRemainingElement.textContent = daysRemaining;
}

// Handle user authentication state
onAuthStateChanged(auth, async (user) => {
	if (user) {
		try {
			const userDoc = await getDoc(doc(db, 'Users', user.uid));
			const userData = userDoc.exists() ? userDoc.data() : null;
			userNameElement.textContent = `Welcome, ${userData?.username || 'User'}!`;

			fetchUserLogbook(user.uid);
		} catch (error) {
			console.error('Error fetching user data:', error);
			userNameElement.textContent = 'Welcome, User!';
		}
	} else {
		window.location.href = '/pages/login-page/login-page.html';
	}
});

document.addEventListener('DOMContentLoaded', () => {
	const loginBtn = document.querySelector('.login-btn');
	const logoutBtn = document.querySelector('.logout-btn');

	// Function to log login/logout times in Firestore
	async function logTimestamp(type) {
		const user = auth.currentUser;
		if (!user) return;

		const userId = user.uid;
		const todayDate = getCurrentDate();
		const logbookRef = doc(db, 'Users', userId, 'Logbook', todayDate);
		const logbookSnap = await getDoc(logbookRef);

		try {
			if (logbookSnap.exists()) {
				// Update the existing log entry (either login or logout)
				if (type === 'login') {
					await updateDoc(logbookRef, { login: serverTimestamp() });
				} else if (type === 'logout') {
					await updateDoc(logbookRef, { logout: serverTimestamp() });
				}
			} else {
				// Create a new log entry if it doesn't exist
				await setDoc(logbookRef, {
					date: serverTimestamp(),
					login: type === 'login' ? serverTimestamp() : null,
					logout: type === 'logout' ? serverTimestamp() : null,
					condition: 'Present',
				});
			}

			// Refresh logbook data
			fetchUserLogbook(userId);
		} catch (error) {
			console.error(`Error logging ${type}:`, error);
		}
	}

	// Event listeners for Login and Logout buttons
	loginBtn.addEventListener('click', () => logTimestamp('login'));
	logoutBtn.addEventListener('click', () => logTimestamp('logout'));
});

// Logout function
document.getElementById('logout-btn')?.addEventListener('click', () => {
	signOut(auth)
		.then(() => (window.location.href = '/pages/login-page/login-page.html'))
		.catch((error) => console.error('Error signing out:', error));
});
