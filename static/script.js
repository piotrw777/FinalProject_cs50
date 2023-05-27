function addEventListeners() {
    document.querySelectorAll('.download-button').forEach(
        function(button) {
            button.onclick = function() {
                button.innerHTML = button.id;
                window.location.assign('/download_pdf?filename=' + button.id);
            }
        }
    )
};

document.addEventListener('DOMContentLoaded', addEventListeners);
