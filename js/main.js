const zonas = document.querySelectorAll('.zona-crece');
const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function limitar(valor) {
    return Math.min(Math.max(valor, 0), 1);
}

// Cuenta de 0 al numero final (solo la primera vez que aparece)
function contar(elemento) {
    if (elemento.dataset.contado) return;
    elemento.dataset.contado = 'si';

    const final = Number(elemento.dataset.contar);
    const duracion = 1400;
    const inicio = performance.now();

    function paso(ahora) {
        const t = limitar((ahora - inicio) / duracion);
        const suave = 1 - Math.pow(1 - t, 3);
        elemento.textContent = Math.round(final * suave);
        if (t < 1) requestAnimationFrame(paso);
    }

    requestAnimationFrame(paso);
}

// Cada bloque crece hasta ocupar todo el ancho y su contenido aparece en cascada
function crecer() {
    const alto = window.innerHeight;

    zonas.forEach(zona => {
        const caja = zona.querySelector('.caja-crece');
        const posicion = zona.getBoundingClientRect().top;
        const recorrido = zona.offsetHeight - alto;

        const progreso = limitar(-posicion / recorrido);
        caja.style.setProperty('--progreso', progreso);

        // La entrada arranca un poco antes, cuando el bloque va por la mitad de la pantalla
        const entrada = limitar((alto * 0.6 - posicion) / (recorrido + alto * 0.6));
        const piezas = caja.querySelectorAll('.aparece');

        piezas.forEach((pieza, i) => {
            const umbral = 0.04 + i * (0.5 / piezas.length);
            const visible = entrada > umbral;
            pieza.classList.toggle('visible', visible);
            if (visible && pieza.dataset.contar) contar(pieza);
        });
    });
}

// El resto de secciones aparecen suave al entrar en pantalla
const observador = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
            entrada.target.classList.add('visible');
            observador.unobserve(entrada.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.revelar').forEach(el => observador.observe(el));

// El boton de la app aun no funciona
document.querySelectorAll('[aria-disabled="true"]').forEach(boton => {
    boton.addEventListener('click', evento => evento.preventDefault());
});

if (sinMovimiento) {
    document.querySelectorAll('.aparece, .revelar').forEach(el => el.classList.add('visible'));
} else {
    window.addEventListener('scroll', crecer, { passive: true });
    window.addEventListener('resize', crecer);
    crecer();
}
