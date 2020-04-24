(function() {
    const mapOptions = {
        center: [40.2, -3.6],
        zoom: 6,
    };

    let map = L.map("mapid", mapOptions);

    let marker, poly;

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

    const pnoaOrthoWMS = L.tileLayer
        .wms("http://www.ign.es/wms-inspire/pnoa-ma?", wmsOptions)
        .addTo(map);

    L.tileLayer(
        "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",
        {
            maxZoom: 18,
            attribution:
                'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: "mapbox/streets-v11",
            tileSize: 512,
            zoomOffset: -1,
        }
    ); //.addTo(map);

    var options = {steps: 64, units: "kilometers"};

    const removeOverlay = () => {
        marker && marker.remove();
        poly && poly.remove();
    };

    const isoc = document.getElementById("isocrona");

    const drawOverlay = e => {
        const calcMethod = isoc.checked ? isochroneCoordinates : bufferCoordinates;
        calcMethod(e).then(coords => {
            poly = L.polygon(coords).addTo(map);
        });
    };

    const isochroneCoordinates = e => {
        const key = "Ap8yVBeoBXr-d_ZAhOiM6WT1BzOB1liVnAXxgXNny9jt9VJkHMz1hG59qzLB5BsX";
        const url = `https://dev.virtualearth.net/REST/v1/Routes/Isochrones?waypoint=${e.latlng.lat},${e.latlng.lng}&maxDistance=1&travelMode=walking&optimize=distance&key=${key}`;
        return fetch(url)
            .then(response => {
                return response.json();
            })
            .then(data => {
                const coords =
                    data.resourceSets[0].resources[0].polygons[0].coordinates;
                console.log(coords);
                return coords;
            });
    };

    const bufferCoordinates = e => {
        const circle = turf.circle([e.latlng.lat, e.latlng.lng], 1, options);
        return Promise.resolve(circle.geometry.coordinates);
    };

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
