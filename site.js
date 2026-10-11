(() => {
  const links = [
    ['index.html','الرئيسية','home'],['about.html','من أنا','about'],['videos.html','الفيديوهات','videos'],
    ['rules.html','القوانين','rules'],['support.html','الدعم','support'],['shop.html','المتجر','shop'],['contact.html','تواصل','contact']
  ];
  const path = location.pathname.split('/').pop() || 'index.html';
  const current = links.find((x) => x[0] === path)?.[2] || 'home';
  const header = document.querySelector('[data-site-header]');
  if (header) {
    header.innerHTML = `<div class="container nav-wrap"><a class="brand" href="index.html" aria-label="MACSEKY الرئيسية"><img src="logo.png" alt="شعار MACSEKY" onerror="this.style.display='none'"><span class="brand-name">MAC<span>SEKY</span></span></a><button class="nav-toggle" type="button" aria-label="فتح القائمة" aria-expanded="false">☰</button><nav class="main-nav" aria-label="التنقل الرئيسي">${links.map(([href,label,key])=>`<a href="${href}" ${key===current?'aria-current="page"':''}>${label}</a>`).join('')}</nav></div>`;
    const toggle = header.querySelector('.nav-toggle');
    const nav = header.querySelector('.main-nav');
    toggle?.addEventListener('click', () => { const open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); toggle.textContent = open ? '✕' : '☰'; });
  }
  document.querySelectorAll('[data-year]').forEach((el) => el.textContent = new Date().getFullYear());
})();
