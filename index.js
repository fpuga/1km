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

    const wmsOptions = {
        format: "image/png",
        transparent: true,
        version: "1.3.0",
        tileSize: 512,
        layers: "OI.OrthoimageCoverage",
        attribution:
            'PNOA cedido por © <a href="http://www.ign.es/ign/main/index.do" target="_blank">Instituto Geográfico Nacional de España</a>',
        opacity: 1,
        crossOrigin: true,
    };

    L.tileLayer.wms("http://www.ign.es/wms-inspire/pnoa-ma?", wmsOptions).addTo(map);

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
        return fetch(url, {mode: "no-cors"}).then(response => response.json());
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

    map.on("click", e => {
        lc.stop();
        drawOverlay(e);
    });

    map.on("locationfound", e => {
        drawOverlay(e);
    });
})();
