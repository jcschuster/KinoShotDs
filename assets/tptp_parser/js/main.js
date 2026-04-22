import './style.css';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import themeList from 'monaco-themes/themes/themelist.json';

self.MonacoEnvironment = {
	getWorker: function (_workerId, _label) {
		return new editorWorker();
	},
};

monaco.languages.register({ id: 'th0' });
monaco.languages.setLanguageConfiguration('th0', {
	brackets: [
		['[', ']'],
		['(', ')'],
	],
	autoClosingPairs: [
		{ open: '[', close: ']' },
		{ open: '(', close: ')' },
	],
});

monaco.languages.setMonarchTokensProvider('th0', {
	tokenizer: {
		root: [
			[
				/\b(thf|include|axiom|hypothesis|definition|assumption|lemma|theorem|corollary|conjecture|negated_conjecture|plain|type|interpretation|unknown)\b/,
				'keyword',
			],
			[/\$(i|o|tType|oType|iType)\b/, 'type'],
			[/\$(true|false)\b/, 'constant'],
			[/(!|\?|\^)/, 'keyword.control'],
			[
				/(~|&|\||=>|<=|<=>|<~>|~&|~\||=|!=|>|@|!!|\?\?)/,
				'keyword.operator',
			],
			[/[A-Z][a-zA-Z0-9_]*/, 'variable'],
			[/[a-z][a-zA-Z0-9_]*/, 'identifier'],
			[/%.*/, 'comment'],
		],
	},
});

const MODE_BTN_ACTIVE = ['bg-blue-600', 'text-white'];
const MODE_BTN_INACTIVE = ['bg-white', 'text-gray-700', 'hover:bg-gray-100'];

export function init(ctx, payload) {
	ctx.root.innerHTML = `
	<link rel="stylesheet" href="tptp_parser_assets.css">
    <div class="font-sans p-4 bg-gray-50 border border-gray-200 rounded-lg relative text-gray-700 box-border">
        <div class="flex items-start justify-between mb-3 gap-4">
            <div class="flex items-end gap-3 flex-wrap flex-1">
                <div class="flex flex-col">
                    <label class="text-xs font-semibold text-gray-600 mb-1">Mode:</label>
                    <div id="mode-toggle" class="inline-flex rounded border border-gray-300 overflow-hidden">
                        <button type="button" data-mode="formula" class="mode-btn px-3 py-2 text-sm border-none cursor-pointer transition-colors">Formula</button>
                        <button type="button" data-mode="problem" class="mode-btn px-3 py-2 text-sm border-none border-l border-gray-300 cursor-pointer transition-colors">Problem</button>
                    </div>
                </div>

                <div class="flex flex-col flex-1 min-w-[12rem] max-w-sm">
                    <label class="text-xs font-semibold text-gray-600 mb-1">Bind result to:</label>
                    <input id="result-var" type="text" class="w-full p-2 text-sm border border-gray-300 rounded bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value="${payload.var_name || 'parsed_formula_or_problem'}" />
                </div>

                <button id="btn-parse" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border-none rounded cursor-pointer hover:bg-blue-700 whitespace-nowrap transition-colors">
                    Parse
                </button>
            </div>

            <button id="menu-toggle" class="p-2 text-gray-500 bg-transparent border-none cursor-pointer mt-5 hover:text-gray-800 transition-colors">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
        </div>

        <div id="settings-panel" class="absolute top-16 right-4 w-64 bg-white border border-gray-200 rounded shadow-lg p-4 z-50 hidden">
            <h3 class="text-sm font-semibold m-0 mb-3 text-gray-700">Configuration</h3>
            <div class="flex flex-col">
                <label class="text-xs font-semibold text-gray-600 mb-1">Editor Theme</label>
                <select id="theme-select" class="w-full p-2 text-sm border border-gray-300 rounded bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
						<option value="${payload.theme}">${payload.theme}</option>
					</select>
            </div>
        </div>

        <div id="context-wrapper" class="mb-2 hidden">
            <label class="text-xs font-semibold text-gray-600 mb-1 block">
                Context <span class="font-normal text-gray-500">(optional, e.g. <code class="font-mono">X : $i, c : $o&gt;$o</code>)</span>:
            </label>
            <div class="border border-gray-300 rounded overflow-hidden" phx-update="ignore">
                <div id="context-editor-container" style="height: 32px; width: 100%;"></div>
            </div>
        </div>

        <div class="mt-2 border border-gray-300 rounded overflow-hidden" phx-update="ignore">
            <div id="editor-container" style="height: 200px; width: 100%;"></div>
        </div>

        <div id="preview-container" class="mt-3 p-3 bg-gray-900 border border-gray-800 font-mono text-xs rounded overflow-y-auto max-h-64 whitespace-pre-wrap hidden"></div>
    </div>`;

	// --- Theme picker ---

	const themeSelect = document.getElementById('theme-select');
	const builtInThemes = {
		vs: 'Visual Studio Light',
		'vs-dark': 'Visual Studio Dark',
		'hc-black': 'High Contrast Dark',
	};

	let themeOptions = '';
	Object.entries(builtInThemes).forEach(
		([id, name]) =>
			(themeOptions += `<option value="${id}">${name}</option>`),
	);
	Object.entries(themeList).forEach(
		([_id, name]) =>
			(themeOptions += `<option value="${name}">${name}</option>`),
	);
	themeSelect.innerHTML = themeOptions;

	const currentTheme = payload.theme || 'vs';
	themeSelect.value = currentTheme;

	const applyTheme = async (themeName) => {
		if (builtInThemes[themeName]) {
			monaco.editor.setTheme(themeName);
			return;
		}

		const themeId = themeName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();

		try {
			const themeUrl = `./themes/${encodeURIComponent(themeName)}.json`;
			const response = await fetch(themeUrl);

			if (!response.ok)
				throw new Error(`HTTP error! status: ${response.status}`);

			const themeData = await response.json();

			monaco.editor.defineTheme(themeId, themeData);
			monaco.editor.setTheme(themeId);
		} catch (err) {
			console.error('Failed to load theme:', themeName, err);
			monaco.editor.setTheme('vs');
		}
	};

	// --- Mode + per-mode buffers ---

	let currentMode = payload.mode === 'formula' ? 'formula' : 'problem';
	const buffers = {
		formula: payload.formula_str ?? '',
		problem: payload.problem_str ?? '',
	};

	// --- Main editor ---

	const editorContainer = document.getElementById('editor-container');
	editorContainer.addEventListener('keydown', (e) => e.stopPropagation());

	const editor = monaco.editor.create(editorContainer, {
		value: buffers[currentMode],
		language: 'th0',
		minimap: { enabled: false },
		stickyScroll: { enabled: false },
		renderLineHighlightOnlyWhenFocus: true,
		bracketPairColorization: { enabled: true },
		automaticLayout: true,
		scrollBeyondLastLine: false,
		padding: { top: 12, bottom: 12 },
		fontSize: 14,
	});

	const mainImeObserver = new MutationObserver((_mutations, obs) => {
		const imeTextArea = editorContainer.querySelector('.ime-text-area');
		if (imeTextArea) {
			imeTextArea.setAttribute('id', 'monaco-ime-input-main');
			imeTextArea.setAttribute('name', 'monaco-ime-input-main');
			obs.disconnect();
		}
	});
	mainImeObserver.observe(editorContainer, {
		childList: true,
		subtree: true,
	});

	// --- Context editor (minimal: no line numbers, no line highlight) ---

	const contextEditorContainer = document.getElementById(
		'context-editor-container',
	);
	contextEditorContainer.addEventListener('keydown', (e) =>
		e.stopPropagation(),
	);

	const contextEditor = monaco.editor.create(contextEditorContainer, {
		value: payload.context_str || '',
		language: 'th0',
		// Strip everything that makes it look like a full code editor:
		lineNumbers: 'off',
		glyphMargin: false,
		folding: false,
		renderLineHighlight: 'none',
		renderLineHighlightOnlyWhenFocus: false,
		overviewRulerLanes: 0,
		overviewRulerBorder: false,
		hideCursorInOverviewRuler: true,
		minimap: { enabled: false },
		stickyScroll: { enabled: false },
		guides: { indentation: false },
		scrollbar: {
			vertical: 'hidden',
			horizontal: 'auto',
			useShadows: false,
			alwaysConsumeMouseWheel: false,
		},
		scrollBeyondLastLine: false,
		scrollBeyondLastColumn: 0,
		wordWrap: 'on',
		contextmenu: false,
		// Keep syntax highlighting & bracket matching:
		bracketPairColorization: { enabled: true },
		automaticLayout: true,
		padding: { top: 6, bottom: 6 },
		fontSize: 13,
	});

	const contextImeObserver = new MutationObserver((_mutations, obs) => {
		const imeTextArea =
			contextEditorContainer.querySelector('.ime-text-area');
		if (imeTextArea) {
			imeTextArea.setAttribute('id', 'monaco-ime-input-context');
			imeTextArea.setAttribute('name', 'monaco-ime-input-context');
			obs.disconnect();
		}
	});
	contextImeObserver.observe(contextEditorContainer, {
		childList: true,
		subtree: true,
	});

	applyTheme(currentTheme);

	// --- Refs + helpers ---

	const previewContainer = document.getElementById('preview-container');
	const settingsPanel = document.getElementById('settings-panel');
	const menuToggle = document.getElementById('menu-toggle');
	const contextWrapper = document.getElementById('context-wrapper');
	const resultVarInput = document.getElementById('result-var');
	const modeButtons = Array.from(
		document.querySelectorAll('#mode-toggle .mode-btn'),
	);

	const pushUpdate = (key, value) =>
		ctx.pushEvent('update', { [key]: value });

	const renderModeUI = (mode) => {
		modeButtons.forEach((btn) => {
			const active = btn.dataset.mode === mode;
			btn.classList.remove(...MODE_BTN_ACTIVE, ...MODE_BTN_INACTIVE);
			btn.classList.add(
				...(active ? MODE_BTN_ACTIVE : MODE_BTN_INACTIVE),
			);
		});

		const showContext = mode === 'formula';
		contextWrapper.classList.toggle('hidden', !showContext);

		// The context editor may have been created while hidden, so nudge
		// Monaco to re-measure when it first becomes visible.
		if (showContext) {
			requestAnimationFrame(() => contextEditor.layout());
		}
	};

	renderModeUI(currentMode);

	// --- Server events ---

	ctx.handleEvent('preview', ({ text }) => {
		previewContainer.classList.remove(
			'hidden',
			'text-red-400',
			'text-gray-300',
		);
		previewContainer.classList.add('block', 'text-green-400');
		previewContainer.textContent = text;
	});

	ctx.handleEvent('preview_error', ({ message }) => {
		previewContainer.classList.remove(
			'hidden',
			'text-green-400',
			'text-gray-300',
		);
		previewContainer.classList.add('block', 'text-red-400');
		previewContainer.textContent = message;
	});

	// --- User events ---

	editor.onDidChangeModelContent(() => {
		const value = editor.getValue();
		buffers[currentMode] = value;
		pushUpdate(
			currentMode === 'formula' ? 'formula_str' : 'problem_str',
			value,
		);
	});

	contextEditor.onDidChangeModelContent(() =>
		pushUpdate('context_str', contextEditor.getValue()),
	);

	resultVarInput.addEventListener('input', (e) =>
		pushUpdate('var_name', e.target.value),
	);

	modeButtons.forEach((btn) => {
		btn.addEventListener('click', () => {
			const newMode = btn.dataset.mode;
			if (newMode === currentMode) return;

			// Persist whatever is in the editor before swapping.
			buffers[currentMode] = editor.getValue();
			currentMode = newMode;
			editor.setValue(buffers[currentMode]);

			renderModeUI(currentMode);
			pushUpdate('mode', currentMode);
		});
	});

	themeSelect.addEventListener('change', (e) => {
		const newTheme = e.target.value;
		applyTheme(newTheme);
		pushUpdate('theme', newTheme);
	});

	menuToggle.addEventListener('click', () =>
		settingsPanel.classList.toggle('hidden'),
	);
	editor.onDidFocusEditorText(() => settingsPanel.classList.add('hidden'));
	contextEditor.onDidFocusEditorText(() =>
		settingsPanel.classList.add('hidden'),
	);

	document.getElementById('btn-parse').addEventListener('click', () => {
		previewContainer.classList.remove(
			'hidden',
			'text-red-400',
			'text-green-400',
		);
		previewContainer.classList.add('block', 'text-gray-300');
		previewContainer.textContent = `Parsing...`;
		ctx.pushEvent('quick_eval_btn', { action: 'parse' });
	});
}
