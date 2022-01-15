// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const replaceCssOrder = require('./mian.js')
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	console.log('Congratulations, your extension "css-order-format" is now active!');

	let disposable = vscode.commands.registerCommand('css-order-format.run', function () {
		replaceCssOrder()
		vscode.window.showInformationMessage('排序成功！');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
