const hamMenuBtn = document.querySelector(".header__main-ham-menu-cont");
const smallMenu = document.querySelector(".header__sm-menu");
const headerHamMenuBtn = document.querySelector(".header__main-ham-menu");
const headerHamMenuCloseBtn = document.querySelector(".header__main-ham-menu-close");
const headerSmallMenuLinks = document.querySelectorAll(".header__sm-menu-link");
const toggle = document.getElementById('toggleDark');
const body = docuument.querySelector('body');

toggle.addEventListener('click',function(){
      this.classList.toggle('bi-moon');
      if(this.classList.toggle('bi-brightness-high-fill')){
        body.style.background = 'white';
        body.style.color = 'black';
        body.style.transition = '2s';
      }else{
        body.style.background = 'black';
        body.style.color = 'white';
        body.style.transition = '2s';
      }
})

hamMenuBtn.addEventListener("click", () => {
    if (smallMenu.classList.contains("header__sm-menu--active")) {
        smallMenu.classList.remove("header__sm-menu--active");
    } else {
        smallMenu.classList.add("header__sm-menu--active");
    }

    if (headerHamMenuBtn.classList.contains("d-none")) {
        headerHamMenuBtn.classList.remove("d-none");
        headerHamMenuCloseBtn.classList.add("d-none");
    } else {
        headerHamMenuBtn.classList.add("d-none");
        headerHamMenuCloseBtn.classList.remove("d-none");
    }
});

for (let e = 0; e < headerSmallMenuLinks.length; e++) {
    headerSmallMenuLinks[e].addEventListener("click", () => {
        smallMenu.classList.remove("header__sm-menu--active");
        headerHamMenuBtn.classList.remove("d-none");
        headerHamMenuCloseBtn.classList.add("d-none");
    });
}

const headerLogoContainer = document.querySelector(".header__logo-container");
headerLogoContainer.addEventListener("click", () => {
    location.href = "/";
});
