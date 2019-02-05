// a simple data cache for the browser
// (persistency across page refreshes)
// based on indexedDB

/*
API:
async function openStore (indexedDB :: IndexedDB, name :: String) :: class {
	async function set (key :: String, value :: *);
	async function get (key :: String) :: *;
	async function clear ();
	async function remove (key :: String);
}

Behavior should be self-explanatory.

Side-note:
It took me a while to decide whether to call it `openStore' or `openStorage'.
I read up the difference, and it seems that the suffix -age indicates
that something is rather unstructured, so storage is a "pile/heap of data"
while store is "data in a certain structure/format".
Since indexedDB's data content in inherently structured (even if there is no scheme),
I finally settled to `openStore'.
*/

export
async function openStore (indexedDB = window.indexedDB, name = 'MyDatabase') {
	let db = await new Promise(function (fulfill, reject) {
		let request = indexedDB.open(name, 1);
		request.onsuccess = (event) => fulfill(request.result);
		request.onerror   = (event) => reject (request.error);
		request.onupgradeneeded = (event) => request.result.createObjectStore('myStore');
	});
	return {
		async set (key, value) {
			return new Promise(function (fulfill, reject) {
				let transaction = db.transaction('myStore', 'readwrite');
				let store = transaction.objectStore('myStore');
				let request = store.put(value, key);
				request.onsuccess = (event) => fulfill();
				request.onerror   = (event) => reject(request.error);
			})
		},
		async get (key) {
			return new Promise(function (fulfill, reject) {
				let transaction = db.transaction('myStore', 'readonly');
				let store = transaction.objectStore('myStore');
				let request = store.get(key);
				request.onsuccess = (event) => fulfill(request.result);
				request.onerror   = (event) => reject(request.error);
			})
		},
		async clear () {
			return new Promise(function (fulfill, reject) {
				let transaction = db.transaction('myStore', 'readwrite');
				let store = transaction.objectStore('myStore');
				let request = store.clear();
				request.onsuccess = (event) => fulfill();
				request.onerror   = (event) => reject(request.error);
			})
		},
		async remove (key) {
			return new Promise(function (fulfill, reject) {
				let transaction = db.transaction('myStore', 'readwrite');
				let store = transaction.objectStore('myStore');
				let request = store.delete(key);
				request.onsuccess = (event) => fulfill();
				request.onerror   = (event) => reject(request.error);
			})
		},
	}
}
