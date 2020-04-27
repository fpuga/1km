let map;

(function() {
    map = L.map("mapid", {
        center: [40.2, -3.6],
        zoom: 6,
    });

    const lc = L.control
        .locate({
            position: "topleft",
            flyTo: true,
            drawCircle: false,
            initialZoomLevel: 15,
            drawMarker: false,
            showPopup: false,
        })
        .addTo(map);

    const controlTR = document.querySelector(".leaflet-top.leaflet-right");
    controlTR.insertAdjacentHTML(
        "afterBegin",
        `<div class="leaflet-control leaflet-bar"><a href="#" id="modal-btn" class="leaflet-bar-part leaflet-bar-part-single"><i class="fa fa-question-circle"></i></a></div>`
    );

    let modalBtn = document.getElementById("modal-btn");
    let modal = document.querySelector(".modal");
    let closeBtn = document.querySelector(".close-btn");
    let salirBtn = document.querySelector(".salir");
    let continuarBtn = document.querySelector(".continuar");

    const modalAccepted = () => {};
    modalBtn.onclick = function(e) {
        e.preventDefault();
        modal.style.display = "block";
    };
    closeBtn.onclick = function() {
        modal.style.display = "none";
        lc.stop();
        localStorage.clear();
    };
    salirBtn.onclick = function() {
        modal.style.display = "none";
        lc.stop();
        localStorage.clear();
    };
    continuarBtn.onclick = function() {
        modal.style.display = "none";
        localStorage.setItem("privacidadaceptada", "True");
        lc.stop();
        lc.start();
    };
    window.onclick = function(e) {
        if (e.target == modal) {
            modal.style.display = "none";
            lc.stop();
            localStorage.clear();
        }
    };

    if (!localStorage.getItem("privacidadaceptada")) {
        modalBtn.click();
    } else {
        lc.start();
    }

    const wmsOptions = {
        format: "image/png",
        transparent: true,
        version: "1.3.0",
        tileSize: 512,
        layers: "IGNBaseTodo",
        attribution:
            'PNOA cedido por © <a href="http://www.ign.es/ign/main/index.do" target="_blank">Instituto Geográfico Nacional de España</a>',
        opacity: 1,
        crossOrigin: true,
    };

    L.tileLayer.wms("https://www.ign.es/wms-inspire/ign-base?", wmsOptions).addTo(map);

    const removeOverlay = () => {
        marker && marker.remove();
        polyBuf && polyBuf.remove();
        polyIso && polyIso.remove();
    };

    const round = (value, step = 0.0005) => {
        var inv = 1.0 / step;
        return Math.round(value * inv) / inv;
    };

    const drawOverlay = e => {
        removeOverlay();
        const pos = [round(e.latlng.lat), round(e.latlng.lng)];
        marker = new lc.options.markerClass(pos, lc.options.markerStyle);
        marker.addTo(map);
        // const isoc = document.getElementById("isocrona");
        // const calcMethod = isoc.checked ? isochroneCoordinates : bufferCoordinates;
        // calcMethod(e).then(coords => {
        //     poly = L.polygon(coords).addTo(map);
        // });
        bufferCoordinates(pos).then(coords => {
            if (coords) {
                polyBuf = L.polygon(coords).addTo(map);
            }
        });
        isochroneFromStore(pos)
            .then(coords => {
                if (coords) {
                    polyIso = L.polygon(coords).addTo(map);
                }
            })
            .catch(error => {
                isochroneCoordinates(pos).then(coords => {
                    if (coords) {
                        polyIso = L.polygon(coords).addTo(map);
                        const key = `${pos[0]},${pos[1]}`;
                        localStorage.setItem(key, JSON.stringify(coords));
                    }
                });
            });
    };

    const isochroneCoordinates = pos => {
        const baseUrl = "https://tender-raman-6085e5.netlify.app";
        const pathURL = `/.netlify/functions/isochrone_api?lat=${pos[0]}&lng=${pos[1]}`;
        const url = baseUrl + pathURL;
        return fetch(url).then(response => response.json());
    };

    const bufferCoordinates = pos => {
        const circle = turf.circle(pos, 1, {
            steps: 64,
            units: "kilometers",
        });
        return Promise.resolve(circle.geometry.coordinates);
    };

    const isochroneFromStore = pos => {
        const key = `${pos[0]},${pos[1]}`;
        const storedIsochrone = localStorage.getItem(key);
        if (storedIsochrone) {
            return Promise.resolve(JSON.parse(storedIsochrone));
        }
        return Promise.reject("no coords");
    };

    let marker, polyBuf, polyIso;

    // map.on("click", e => {
    //     lc.stop();
    //     drawOverlay(e);
    // });

    map.on("locationfound", e => {
        drawOverlay(e);
    });
})();
