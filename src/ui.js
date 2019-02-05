

export
function createUI_selectSPL (container, SPLs) {
	let entity = {
		update (input) { void input },
		onchange (x) { void x },
	};

	$(container)
	.empty()
	.append('<div>StudienProgrammLeitung:</div>')
	.append($('<select>')
		.append('<option value="">--- Please select ---</option>')
		.append(SPLs.map(({id, longname_de}) => $('<option></option>').attr('value', id).text(longname_de)))
		.append($('<option></option>').attr('value', SPLs.map(mod => mod.id).join(',')).text('^^ Alle ^^'))
		.on('change', ({currentTarget: {value: spl_ids}}) => entity.onchange(spl_ids.split(',').filter(x => x)))
		.val("")
		.trigger('change')
	)
	.children().last().focus()
	return entity;
}



export
function createUI_selectFilter (container) {
	let entity = {
		update (input) { void input },
		onchange (x) { void x },
	};

	let options = { today: 'Today', tomorrow: 'Tomorrow', exams: 'Exams' };
	$(container)
	.empty()
	.append(
		Object.keys(options)
		.map(
			(key) =>
			$('<input type="button">')
			.val(options[key])
			.on('click', (event) => {
				$(event.target).parent().attr('data-filter', key);
				entity.onchange(key);
			})
			.attr('data-filter', key)
		)
	)
	.children().first().click()
	return entity;
}

export
function createUI_output (container, data_bundle) {
	let state = { SPLs: [ ], filter: 'today' };
	let entity = {
		update (input) {
			Object.assign(state, input);

			// extract information from the bundle
			let moduleIds = state.SPLs;
			let courseIds = [].concat(...moduleIds.map(id => data_bundle['moduleId->courseIds'][id]));
			let infos = courseIds.map(id => data_bundle['courseId->course'][id]);
			infos = infos.concat([].concat(...moduleIds.map(id => data_bundle['moduleId->exams'][id])));

			// then filter it
			// first, replace 'events' by 'exams' if desired
			(state.filter == 'exams') && infos.forEach(info => info.events = info.exams);
			// then select those in the specified time range
			let todayMidnight = new Date(new Date().setHours(0,0,0,0));
			infos.forEach(info =>  info.events = info.events.filter({
				today:    event => isInRange(0, (new Date(event.begin) - todayMidnight) /1000/3600/24,  1),
				tomorrow: event => isInRange(1, (new Date(event.begin) - todayMidnight) /1000/3600/24,  2),
				exams:    event => isInRange(0, (new Date(event.begin) - todayMidnight) /1000/3600/24, 56), // eight week preview
			}[state.filter]
			))
			infos = infos.filter(
				info => info.events.length > 0
			)
			infos = infos.sort(
				(a, b) => a.events[0].begin > b.events[0].begin ? 1 : -1
			)

			// then present it
			$(container)
			.empty()
			.append(...infos.map(
				info => [
					$('<span>').html(
						$('<span>').text(info.events.map(event => `${formatTimeRange(event.begin, event.end)}   _${event.address}_`).join(',\n') + '\n')
						.html().replace(/(\s*)_([^_]*)_([^\n]*)/g, '$3$1<small>$2</small>')
					),
					textNode('\t=> '),
					$('<a target="_blank">')
						// .attr('href', `https://ufind.univie.ac.at/de/course.html?lv=${info.id}&semester=2018W`)
						.attr('href', info.href)
						.text(`${info.id}  ${info.type} ${info.longname_de}\n`),
					$('\n'),
				]
			))
		},
		onchange (x) { void x },
	};
	return entity;
}


function isInRange (min, val, max) {
	return min <= val && val <= max;
}
function formatTimeRange (begin, end, lang = 'de-DE') {
	return (
		new Date(begin).toLocaleString(lang, { day: 'numeric', month: '2-digit', hour: 'numeric', minute: '2-digit' })
		+ ' - ' +
		new Date(end).toLocaleString(lang, { hour: 'numeric', minute: '2-digit' })
	)
}
function textNode (text) {
	return document.createTextNode(text);
}
