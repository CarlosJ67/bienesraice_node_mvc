(function() {
   
    // Ocupamos el Logical Or1
    const lat = document.querySelector('#lat').value || 20.2767887;  // latitud 
    const lng = document.querySelector('#lng').value || -97.9581006; // Longitud 
    const mapa = L.map('mapa').setView([lat, lng ], 16);
    let marker;
    
    // Utilizar Provider y Geocoder
    const geocodeService = L.esri.Geocoding.geocodeService(); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);
  
    //Creando el Pin 
    marker = new L.marker([lat, lng],{
        draggable: true,
        autoPan: true  //este hace que una vez mueva el pin se vuelva a centrar el mapa
    })
    .addTo(mapa)

    // Detectar el movimiento del Pin
    marker.on('moveend', function(e){
        marker = e.target
        const posicion = marker.getLatLng();//metodo
        mapa.panTo(new L.LatLng(posicion.lat, posicion.lng))

        //Obtener la informacion de las calles al soltar el pin  
        geocodeService.reverse().latlng(posicion, 16).run(function(error, resultado){
            //console.log(resultado)

            marker.bindPopup(resultado.address.LongLabel);

            // Llenar los campos
            document.querySelector('.calle').textContent = resultado?.address?.Address ?? '';
            document.querySelector('#calle').value = resultado?.address?.Address ?? '';
            document.querySelector('#lat').value = resultado?.latlng?.lat ?? '';
            document.querySelector('#lng').value = resultado?.latlng?.lng ?? '';


        })

    })


})()