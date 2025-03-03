import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js';
import {
	getFirestore,
	doc,
	setDoc,
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';

import {
	getAuth,
	createUserWithEmailAndPassword,
} from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js';

const firebaseConfig = {
	apiKey: 'AIzaSyBatqRKwTrVlROFGAWidCGEbLmq0jxILkI',
	authDomain: 'timestamp-logbook.firebaseapp.com',
	projectId: 'timestamp-logbook',
	storageBucket: 'timestamp-logbook.firebasestorage.app',
	messagingSenderId: '619371204193',
	appId: '1:619371204193:web:02b38517c343d22731a420',
	measurementId: 'G-PQP8JL4F9P',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

const submit = document.getElementById('submit');
submit.addEventListener('click', async function (event) {
	event.preventDefault();
	const username = document.getElementById('username').value;
	const email = document.getElementById('email').value;
	const password = document.getElementById('password').value;

	try {
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			email,
			password
		);
		const user = userCredential.user;

		// Save user data in Firestore
		await setDoc(doc(db, 'Users', user.uid), {
			username: username,
			email: email,
			password: password,
		});

		alert('User signed up and saved in Firestore!');
	} catch (error) {
		alert(error.message);
	}
});
