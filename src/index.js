import * as app_data from './data.js';
import * as ui from './ui.js';

export
async function main () {
	const data = await app_data.load_data();
	console.log(data);

	let container_root   = $('<div>').appendTo(window.document.body);
	let container_spl    = $('<div>').appendTo(container_root).addClass(['input-field']);
	let container_filter = $('<div>').appendTo(container_root).addClass(['input-field', 'select-filter']);
	let container_output = $('<div>').appendTo(container_root).addClass(['input-field', 'output-field']);
	let ui_SPL    = ui.createUI_selectSPL(container_spl, data.modules);
	let ui_filter = ui.createUI_selectFilter(container_filter);
	let ui_output = ui.createUI_output(container_output, data);
	ui_SPL.onchange = function (state) {     // e.g. state = ['123456', '123457']
		ui_output.update({SPLs: state});
	}
	ui_filter.onchange = function (state) {  // e.g. state = 'today'
		ui_output.update({filter: state});
	}
}

