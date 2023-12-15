(function(){

    const lat =  20.2767887;  // latitud 
    const lng = -97.9581006; // Longitud 
    const mapa = L.map('mapa-inicio').setView([lat, lng ], 16);

    let markers = new L.FeatureGroup().addTo(mapa)

    let propiedades = [];

    // Filtros de las casas
    const filtros = {
        categoria: '',
        precio: ''
    }

    // Variables para extraer esos datos
    const categoriasSelect = document.querySelector('#categorias');
    const preciosSelect = document.querySelector('#precios');


    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

    //Filtrados de categorias y precios
    categoriasSelect.addEventListener('change', e => {
        filtros.categoria = +e.target.value
        filtrarPropiedades();
    })

    preciosSelect.addEventListener('change', e => {
        filtros.precio = +e.target.value
        filtrarPropiedades();
    })

    const obtenerPropiedades = async () => {
        try {
            const url = '/api/propiedades'
            const respuesta = await fetch(url) // este feach sirve para ver si la conexion es correcta
            propiedades = await respuesta.json()

           mostrarPropiedades(propiedades)

        } catch (error) {
            console.log(error)
        }
    }

    const mostrarPropiedades = propiedades => {

        // Limpiar los markers Previos, ClearLeayers va limpiar los markers previos 
        markers.clearLayers()

       propiedades.forEach(propiedad => {

        // Agregar los pines
        const marker = new L.marker([propiedad?.lat, propiedad?.lng], {
            autoPan:true
        })
        .addTo(mapa)
        .bindPopup(`
           <p class="text-indigo-600 font-bold">${propiedad.categoria.nombre}</p>
           <h1 class="text-xl font-extrabold uppercase my-3">${propiedad?.titulo}</h1>
           <img src="/uploads/${propiedad?.imagen}" alt="Imagenes de la propiedad ${propiedad.titulo}">
           <p class="text-gray-600 font-bold">${propiedad.precio.nombre}</p>
           <a href="/propiedad/${propiedad.id}" class="bg-indigo-600 block p-2 text-center  font-bold uppercase">Ver Propiedad</a>

        `)


        markers.addLayer(marker)
       })

    }
    
    const filtrarPropiedades = () => {
        const resultado = propiedades.filter( filtrarCategoria ).filter( filtrarPrecio ) //Este filter nos va a ayudar a iterar cada una de la pripiedades
        mostrarPropiedades(resultado)
    }

    const filtrarCategoria = (propiedad) => filtros.categoria ? propiedad.categoriaId === filtros.categoria : propiedad 
    
    const filtrarPrecio = (propiedad) => filtros.precio ? propiedad.precioId === filtros.precio : propiedad 


    obtenerPropiedades()

})()

// JSON JS OBJECT NOTATION: NOS SIRVE PARA TRANSPORTAR DATOS 