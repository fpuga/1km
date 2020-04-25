(function() {
    const map = L.map("mapid", {
        center: [40.2, -3.6],
        zoom: 6,
    });

    const lc = L.control
        .locate({
            position: "topleft",
            flyTo: true,
            drawCircle: false,
            initialZoomLevel: 15,
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
        poly && poly.remove();
    };

    const drawOverlay = e => {
        const calcMethod = isoc.checked ? isochroneCoordinates : bufferCoordinates;
        calcMethod(e).then(coords => {
            poly = L.polygon(coords).addTo(map);
        });
    };

    const isochroneCoordinates = e => {
        const baseUrl = "https://tender-raman-6085e5.netlify.app";
        const pathURL = `/.netlify/functions/isochrone_api?lat=${e.latlng.lat}&lng=${e.latlng.lng}`;
        const url = baseUrl + pathURL;
        return fetch(url).then(response => response.json());
    };

    const bufferCoordinates = e => {
        const circle = turf.circle([e.latlng.lat, e.latlng.lng], 1, {
            steps: 64,
            units: "kilometers",
        });
        return Promise.resolve(circle.geometry.coordinates);
    };

    const isoc = document.getElementById("isocrona");
    let marker, poly;

    map.on("click", e => {
        lc.stop();
        removeOverlay();
        marker = new lc.options.markerClass(e.latlng, lc.options.markerStyle);
        marker.addTo(map);
        drawOverlay(e);
    });

    map.on("locationfound", e => {
        removeOverlay();
        drawOverlay(e);
    });
})();
