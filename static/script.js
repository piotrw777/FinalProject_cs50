function addEventListeners() {
    document.querySelectorAll('.download-button').forEach(
        function(button) {
            button.onclick = function() {
                button.innerHTML = button.id;
                window.location.assign('/download_pdf?filename=' + button.id); }});

    //closing alerts
    let closeButton = document.querySelector('.close');
    closeButton.addEventListener('click', function() {
    document.querySelector('.alert').remove(); })};

document.addEventListener('DOMContentLoaded', addEventListeners);
