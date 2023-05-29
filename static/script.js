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

function test() {
    let str = document.getElementById("LateXCode").value;
    let regexp = /#(.*?)#/g;

    let matches = str.matchAll(regexp);
    matches = Array.from(matches);
    let i = 0;
    let pom = "";

    while (i < matches.length) {
        pom += matches[i][1] + ' ';
        i += 1;
    }

    document.getElementById("test").innerHTML = pom;
};

document.addEventListener('DOMContentLoaded', addEventListeners);
