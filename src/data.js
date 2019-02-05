import {openStore} from './lib/data-cache-browser.js';

let baseURLs = [
	'./',
];
let cache = null;

export
async function load_data () {
	const cache = await openStore(window.indexedDB, 'vvz_today_cache');
	let data_version_local = await cache.get('data_version');
	let data_version_remote = await fetchFromBase('data_version.txt').then(res => res.text()).catch(err => data_version_local);
	let data = null;
	if (data_version_local != data_version_remote) {
		console.log('Fetching remote data...');
		data = await fetchFromBase('data_bundle.json').then(res => res.json());
		cache.set('bundle', data);
		cache.set('data_version', data_version_remote);
		console.log('Fetching remote data... done!');
	} else {
		data = await cache.get('bundle');
	}
	return data;
}


async function fetchFromBase (filename) {
	for (let base of baseURLs) {
		try {
			return await fetch(base + filename).then(res => res.ok ? res : _throw(res));
		} catch (e) { continue }
	}
	throw new Error('Failed fetching.');
}

function _throw (err) { throw err }
