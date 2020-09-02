function alertMessage(text) {
    alert(text)
}

window.logger = (flutter_value) => {
   console.log({ js_context: this, flutter_value });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {  
e.preventDefault();  
deferredPrompt = e;
});
function showInstallPrompt() {
deferredPrompt.prompt();
}