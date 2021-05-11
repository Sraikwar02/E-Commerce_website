const backdrop=document.querySelector('.backdrop');
const sideDrawar=document.querySelector('.mobile_nav');
const menuToggle=document.querySelector('#side-menu-toggle');

function backdropClickHandler() {
    backdrop.style.display='none';
    sideDrawar.classList.remove('open');
};

function menuTOggleClickHandler() {
    backdrop.style.display='block';
    sideDrawar.classList.add('open');
}

backdrop.addEventListener('click',backdropClickHandler);
menuToggle.addEventListener('click',menuTOggleClickHandler);