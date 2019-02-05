// This is a script
// to generate a data bundle for the frontend
// that contains up-to-date information.
// requires jQuery

export
async function generate_bundle () {
	let bundle = { };

	let semester = getCurrentSemester();
	bundle['semester'] = semester;

	let modules = await getModulesForSemester(semester);
	bundle['modules'] = modules;

	let moduleIds = modules.map(mod => mod.id);
	let courseIds = [ ];
	bundle['moduleId->courseIds'] = { };
	for (let modId of moduleIds) {
		let crsIds = await getCoursesForModule(modId);
		bundle['moduleId->courseIds'][modId] = crsIds;
		courseIds.push(...crsIds);
	}
	courseIds = array_unique(courseIds);

	let infos = [ ];
	bundle['courseId->course'] = { };
	for (let id of courseIds) {
		let info = await getInfoForCourse(semester, id).catch(err => null);
		if (!info) continue;
		bundle['courseId->course'][id] = info;
		infos.push(info);
	}
	bundle['moduleId->exams'] = { };
	for (let id of moduleIds) {
		let exams = await getExamsForModule(semester, id);
		bundle['moduleId->exams'][id] = exams;
		infos.push(...exams);
	}
	console.log('Courses\' info .length:', infos.length);
	infos = infos.filter(x => x);
	console.log('Courses\' info .length (non-null):', infos.length);
	window.infos = infos;
	return bundle;
}


function getCurrentSemester () {
	let date = new Date();
	let year = isInRange(/* Januar bis Maerz */ 1, date.getMonth()+1, 3) ? date.getFullYear()-1 : date.getFullYear();
	let isSummer = isInRange(/* April bis September */ 4, date.getMonth()+1, 9);
	return year + (isSummer ? 'S' : 'W');
}

async function getModulesForSemester (semester) {
	let xml = await download('https://m1-ufind.univie.ac.at/courses/browse/' + semester);
	return $(xml).find('module[level=1]').map(
		(_, e) => ({
			id:          $(e).attr('id'),
			longname_de: $(e).find('> title[xml\\:lang=de]').text()
		})
	).get();
}

async function getCoursesForModule (modId) {
	let tree = $(await download('https://m1-ufind.univie.ac.at/courses/browse/' + modId));
	return tree.find('course')
//		.children("type:contains('VO')").parent()
		.children("type:contains('V')").parent()  // VO / VU
	.map((_, e) => $(e).attr('id'))
	.get();
}

function array_unique (arr) {
	let ret = [];
	for (let elem of arr) {
		if (!ret.includes(elem)) { ret.push(elem) }
	}
	return ret;
}

function isInRange (min, val, max) {
	return min <= val && val <= max;
}

async function download (url) {
	return fetch(url)
	.then(res => res.ok ? res : _throw(res))
	.then(res => res.text())
}

async function getInfoForCourse (semester, crsId) {
	let tree = $(await download('https://m1-ufind.univie.ac.at/courses/' + crsId + '/2018W'));
	return {
		id: crsId,
		type: tree.find('type').text(),
		longname_de: tree.find('longname[xml\\:lang=de]').text(),
		longname_en: tree.find('longname[xml\\:lang=en]').text(),
		events: tree.find('wwevent').map(
				(_, e) => ({
					begin:   $(e).attr('begin'),
					end:     $(e).attr('end'),
					zip:     $(e).find('zip').text(),
					town:    $(e).find('town').text(),
					address: $(e).find('address').text(),
					room:    $(e).find('room').text(),
				})
			).get(),
		exams: tree.find('exam').map(
				(_, e) => ({
					begin:   $(e).attr('begin'),
					end:     $(e).attr('end'),
					zip:     $(e).find('zip').text(),
					town:    $(e).find('town').text(),
					address: $(e).find('address').text(),
					room:    $(e).find('room').text(),
				})
			).get(),
		offeredby: tree.find('offeredby').text(),
		href: `https://ufind.univie.ac.at/de/course.html?lv=${crsId}&semester=${semester}`,
	};
}

async function getExamsForModule (semester, modId) {
	let tree = $(await download('https://m1-ufind.univie.ac.at/courses/browse/' + modId));
	return tree.find('exam').map(
			(_, e) => ({
				id: $(e).parent().parent().attr('id'),
				type: 'Exam',
				longname_de: $(e).find('title[xml\\:lang=de]').text(),
				longname_en: $(e).find('title[xml\\:lang=en]').text(),
				events: [ ],
				exams: [{
					begin:   $(e).attr('begin'),
					end:     $(e).attr('end'),
					zip:     $(e).find('zip').text(),
					town:    $(e).find('town').text(),
					address: $(e).find('address').text(),
					room:    $(e).find('room').text(),
				}],
				offeredby: tree.find('offeredby').text(),
				href: `https://ufind.univie.ac.at/de/exam.html?mod=${$(e).parent().parent().attr('id')}&eq=${$(e).attr('equality')}&semester=${semester}`,
	})).get();
}

