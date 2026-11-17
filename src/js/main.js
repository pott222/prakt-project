const menuButton = document.querySelector('.burger');
const menu = document.querySelector('#site-menu');

if (menuButton && menu) {
  const closeMenu = () => {
    menu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
  };

  menuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';

    menu.classList.toggle('is-open', !isOpen);
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
  });

  menu.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) {
      closeMenu();
    }
  });

  document.addEventListener('click', (event) => {
    if (menu.classList.contains('is-open')) {
      const target = event.target;
      if (target instanceof Node && !menu.contains(target) && !menuButton.contains(target)) {
        closeMenu();
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
      menuButton.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 560 && menu.classList.contains('is-open')) {
      closeMenu();
    }
  });
}
