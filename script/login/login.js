import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js';
import {
	getAuth,
	signInWithEmailAndPassword,
	onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js';
import {
	getFirestore,
	doc,
	getDoc,
} from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js';

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

// Handle login form submission
const loginForm = document.querySelector('.login-input');

if (loginForm) {
	loginForm.addEventListener('submit', async function (event) {
		event.preventDefault(); // Prevent form from submitting

		const email = document.getElementById('email')?.value.trim();
		const password = document.getElementById('password')?.value.trim();

		if (!email || !password) {
			alert('Please enter both email and password.');
			return;
		}

		try {
			const userCredential = await signInWithEmailAndPassword(
				auth,
				email,
				password
			);
			const user = userCredential.user;

			const userDoc = await getDoc(doc(db, 'Users', user.uid));

			if (userDoc.exists()) {
				const username = userDoc.data().username;
				alert(`Welcome back, ${username}! 🎉`);
			} else {
				alert('Welcome! Your profile is missing a username.');
			}

			// Redirect to logbook page after successful login
			window.location.href = '/pages/logbook-page/logbook.html';
		} catch (error) {
			alert(error.message);
		}

		return false; // Ensure form does not submit
	});
} else {
	console.error('Login form not found!');
}
