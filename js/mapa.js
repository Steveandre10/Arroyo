// Mapa de Barranquilla redibujado en azules, con alertas de ejemplo
// Usa MapLibre + teselas gratuitas de OpenFreeMap (no necesita API key)

const contenedorMapa = document.getElementById('mapa-arroyos');

// Alertas de ejemplo (lat, lng sobre la calle real)
const alertas = [
    { calle: 'Calle 84', barrio: 'Las Tres Ave Marías', nivel: 'alto', hace: 3, coords: [-74.80688, 11.02275] },
    { calle: 'Calle 76', barrio: 'La Concepción', nivel: 'alto', hace: 6, coords: [-74.79641, 11.01159] },
    { calle: 'Carrera 21', barrio: 'San José', nivel: 'alto', hace: 4, coords: [-74.79358, 10.96195] },
    { calle: 'Carrera 65', barrio: 'El Golf', nivel: 'alto', hace: 9, coords: [-74.81119, 11.01512] },
    { calle: 'Carrera 46', barrio: 'Barrio América', nivel: 'medio', hace: 12, coords: [-74.80765, 10.99547] }
];

const colores = {
    cuadras: '#0B2552',
    agua: '#061733',
    parques: '#0D2D5C',
    edificios: '#10336A',
    callesMenores: '#2D6CC0',
    callesPrincipales: '#4FC3F7',
    texto: '#9CC4F0'
};

const estiloAzul = {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
        omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' }
    },
    layers: [
        { id: 'fondo', type: 'background', paint: { 'background-color': colores.cuadras } },
        { id: 'parques', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': colores.parques } },
        {
            id: 'verde', type: 'fill', source: 'omt', 'source-layer': 'landcover',
            filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood']]],
            paint: { 'fill-color': colores.parques, 'fill-opacity': 0.6 }
        },
        { id: 'agua', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': colores.agua } },
        {
            id: 'arroyos-canales', type: 'line', source: 'omt', 'source-layer': 'waterway',
            paint: { 'line-color': '#1A4E96', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 16, 2] }
        },
        {
            id: 'edificios', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 14,
            paint: { 'fill-color': colores.edificios, 'fill-opacity': 0.7 }
        },
        {
            id: 'calles-menores', type: 'line', source: 'omt', 'source-layer': 'transportation',
            filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]],
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': colores.callesMenores,
                'line-opacity': 0.55,
                'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.4, 14, 1.2, 17, 5]
            }
        },
        {
            id: 'calles-medias', type: 'line', source: 'omt', 'source-layer': 'transportation',
            filter: ['in', ['get', 'class'], ['literal', ['secondary', 'tertiary']]],
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': colores.callesMenores,
                'line-opacity': 0.9,
                'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.8, 14, 2, 17, 8]
            }
        },
        {
            id: 'calles-principales', type: 'line', source: 'omt', 'source-layer': 'transportation',
            filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]],
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': colores.callesPrincipales,
                'line-opacity': 0.85,
                'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.2, 14, 3, 17, 11]
            }
        },
        {
            id: 'nombres-calles', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 14,
            layout: {
                'symbol-placement': 'line',
                'text-field': ['get', 'name'],
                'text-font': ['Noto Sans Regular'],
                'text-size': 11
            },
            paint: { 'text-color': colores.texto, 'text-halo-color': colores.cuadras, 'text-halo-width': 1.5 }
        },
        {
            id: 'barrios', type: 'symbol', source: 'omt', 'source-layer': 'place',
            filter: ['in', ['get', 'class'], ['literal', ['suburb', 'neighbourhood', 'quarter']]],
            minzoom: 12.5,
            layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Noto Sans Regular'],
                'text-size': 11,
                'text-transform': 'uppercase',
                'text-letter-spacing': 0.1
            },
            paint: { 'text-color': colores.texto, 'text-opacity': 0.55, 'text-halo-color': colores.cuadras, 'text-halo-width': 1 }
        }
    ]
};

const iconoAlerta = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>';

function textoNivel(nivel) {
    return nivel === 'alto' ? 'Arroyo crecido' : 'Precaución';
}

function limitesAlertas() {
    const lngs = alertas.map(a => a.coords[0]);
    const lats = alertas.map(a => a.coords[1]);
    return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
}

function crearMapa() {
    const esCelular = window.innerWidth < 800;

    const mapa = new maplibregl.Map({
        container: contenedorMapa,
        style: estiloAzul,
        // Encuadra todas las alertas (en computador deja espacio para el panel)
        bounds: limitesAlertas(),
        fitBoundsOptions: { padding: esCelular ? 50 : { top: 70, bottom: 70, left: 330, right: 80 } },
        minZoom: 11,
        maxZoom: 17,
        attributionControl: { compact: true },
        cooperativeGestures: true,
        locale: {
            'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rueda del mouse para hacer zoom',
            'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rueda del mouse para hacer zoom',
            'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa',
            'NavigationControl.ZoomIn': 'Acercar',
            'NavigationControl.ZoomOut': 'Alejar'
        },
        pitchWithRotate: false,
        dragRotate: false
    });

    mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    const lista = document.querySelector('.mapa-lista');

    alertas.forEach(alerta => {
        // Zona que parpadea + signo de alerta
        const marcador = document.createElement('button');
        marcador.type = 'button';
        marcador.className = 'alerta-mapa alerta-' + alerta.nivel;
        marcador.setAttribute('aria-label', textoNivel(alerta.nivel) + ' en ' + alerta.calle);
        marcador.innerHTML = '<span class="alerta-zona"></span><span class="alerta-zona"></span><span class="alerta-icono">' + iconoAlerta + '</span>';

        const popup = new maplibregl.Popup({ offset: 22, closeButton: false, className: 'popup-arroyo' })
            .setHTML(
                '<p class="popup-nivel popup-' + alerta.nivel + '">' + textoNivel(alerta.nivel) + '</p>' +
                '<h4>Arroyo de la ' + alerta.calle + '</h4>' +
                '<p class="popup-detalle">' + alerta.barrio + ' · hace ' + alerta.hace + ' min</p>'
            );

        new maplibregl.Marker({ element: marcador })
            .setLngLat(alerta.coords)
            .setPopup(popup)
            .addTo(mapa);

        // Lista del panel: al tocar, el mapa vuela hasta la alerta
        const item = document.createElement('li');
        item.innerHTML =
            '<button type="button"><i class="ley-' + (alerta.nivel === 'alto' ? 'rojo' : 'amarillo') + '"></i>' +
            '<span><strong>' + alerta.calle + '</strong><small>' + alerta.barrio + '</small></span>' +
            '<em>' + alerta.hace + ' min</em></button>';
        item.querySelector('button').addEventListener('click', () => {
            mapa.flyTo({ center: alerta.coords, zoom: 15, speed: 0.8 });
            document.querySelectorAll('.maplibregl-popup').forEach(p => p.remove());
            popup.setLngLat(alerta.coords).addTo(mapa);
        });
        lista.appendChild(item);
    });
}

// El mapa solo se carga cuando la seccion esta cerca, para no hacer lenta la pagina
if (contenedorMapa) {
    if (!window.maplibregl) {
        contenedorMapa.classList.add('mapa-error');
        contenedorMapa.textContent = 'No se pudo cargar el mapa.';
    } else {
        const vigia = new IntersectionObserver(entradas => {
            if (entradas[0].isIntersecting) {
                vigia.disconnect();
                crearMapa();
            }
        }, { rootMargin: '400px' });
        vigia.observe(contenedorMapa);
    }
}
