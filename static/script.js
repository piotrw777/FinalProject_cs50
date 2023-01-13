function addEventListeners() {
    //const username = document.getElementById("username");
    //const usernameValid = document.getElementById("username-valid");

    //no tick at the beginning
    //usernameValid.style.display = "none";

    //username.addEventListener("input", function(){
//
    //});    

    //closing alerts
    let closeButton = document.querySelector('.close');

    closeButton.addEventListener('click', function() {
    document.querySelector('.alert').remove();
});
}

document.addEventListener('DOMContentLoaded', addEventListeners);
