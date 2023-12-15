import { unlink } from 'node:fs/promises'
import { body, validationResult } from 'express-validator'
import { Precio, Categoria, Propiedad, Mensaje, Usuario} from '../models/index.js'
import { esVendedor, formatearFecha } from '../helpers/index.js'

const admin = async (req, res) => {

    // Leer QueryString

    const { pagina: paginaActual } = req.query
    console.log(paginaActual)

    const expresion = /^[1-9]$/ // la expresion regular dice que solo acepta digitos del cero al 9
    // la flecha hacia arriba comprueba que siempre inicie con digitos y el signo de dolar hace que termine con digito


    if(!expresion.test(paginaActual)){
        return res.redirect('/mis-propiedades?pagina=1')
    }

    try {
        const { id } = req.usuario

        // Limites y Offset para el paginador
        const limit = 10;

        const offset = ((paginaActual * limit) - limit)

        const [propiedades,total] = await Promise.all([
            Propiedad.findAll({
                limit,
                offset,
                where: {
                    usuarioId : id
                },
                include: [
                    { model: Categoria, as: 'categoria' },
                    { model: Precio, as: 'precio' },
                    { model: Mensaje, as: 'mensajes'}
                ],
            }),
            Propiedad.count({
                where: {
                    usuarioId : id
                }
            })
        ])// aqui se incluye el modelo de categoria
        

        res.render('propiedades/admin', {
            pagina: 'Mis Propiedades',
            propiedades,
            csrfToken: req.csrfToken(),
            paginas: Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total,
            offset,
            limit
        })
    } catch (error) {
        console.log(error)
    }

}

// Formulario para crear una nueva propiedad
const crear = async (req, res) =>{
    // Consultamos modelo de precio y categoria
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    })
}
// Le pasamos un csrftoken al formulario
const guardar = async (req, res) =>{
    
    // Validacion
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        // Consultamos modelo de precio y categoria
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('propiedades/crear', {
            pagina: 'Crear Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }


    // Crear un Registro

    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId} = req.body

    const { id : usuarioId } = req.usuario


    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId,
            categoriaId,
            usuarioId,
            imagen: ''
        })

        const { id } = propiedadGuardada

        res.redirect(`/propiedades/agregar-imagen/${id}`)
    } catch (error) {
        console.log(error)
    }
}

const agregarImagen = async (req, res) =>{

    const { id } = req.params
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    // Validar que la propiedad no este publicada
    if(propiedad.publicado) {
        return res.redirect('/mis-propiedades')
    }

    // Validar que la propiedad pertenece a quien visite esta pagina
    if( req.usuario.id.toString() !== propiedad.usuarioId.toString() ){
        return res.redirect('/mis-propiedades')
    }

    res.render('propiedades/agregar-imagen', {
        pagina: `Agregar Imagen: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        propiedad
    })
}

const almacenarImagen = async (req,res, next) =>{

    const { id } = req.params
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id) // SELECT * FROM TBB_PROPIEDADES WHERE ID = ID

    if(!propiedad){
        console.log("La propiedad buscada no existe")
        return res.redirect('/mis-propiedades')
    }

    // Validar que la propiedad no este publicada
    if(propiedad.publicado) {
        return res.redirect('/mis-propiedades')
    }

    // Validar que la propiedad pertenece a quien visite esta pagina
    if( req.usuario.id.toString() !== propiedad.usuarioId.toString() ){
        return res.redirect('/mis-propiedades')
    }

    try {
        //console.log(req.file)

        //almacenar la imagen y publica propiedad
        propiedad.imagen = req.file.filename
        propiedad.publicado = 1

        await propiedad.save()

        next()


    } catch (error) {
        console.log(error)
    }
}

const editar = async (req,res) =>{

    const { id } = req.params

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ) {
        return res.redirect('/mis-propiedades')
    }

    // Consultamos modelo de precio y categoria
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    res.render('propiedades/editar', {
        pagina: `Editar Propiedad: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: propiedad
    })
    

}

const guardarCambios = async(req, res) => {

    // Verificar la validacion

    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        // Consultamos modelo de precio y categoria
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

       return res.render('propiedades/editar', {
            pagina: 'Editar Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    
    }

    const { id } = req.params

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ) {
        return res.redirect('/mis-propiedades')
    }

    //Reescribir el objeto y actualizarlo

    try {
       
        const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId} = req.body

        propiedad.set({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId,
            categoriaId
        })
        
        await propiedad.save();

        res.redirect('/mis-propiedades') // se reescribe el objeto y se guardad en la base de datos


    } catch (error) {
        console.log(error)
    }

}

const eliminar = async (req, res) => {

    const { id } = req.params

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ) {
        return res.redirect('/mis-propiedades')
    }

    // Eliminar la imagen
    await unlink(`public/uploads/${propiedad.imagen}`)

    console.log(`Se elimino la imagen ${propiedad.imagen}`)

    //Eliminar la propiedad
    await propiedad.destroy()
    res.redirect('/mis-propiedades')

}


// Modifica el estado de la propiedad
const cambiarEstado = async (req, res) => {

    const { id } = req.params

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ) {
        return res.redirect('/mis-propiedades')
    }

    // Actualizar
    propiedad.publicado = !propiedad.publicado

    await propiedad.save()

    res.json({
        resultado: 'ok'
    })
}



// Muestra una propiedad
const mostrarPropiedad = async (req, res) => {
    const { id } = req.params

    // Comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include : [
            { model: Precio, as: 'precio' },
            { model: Categoria, as: 'categoria' }

        ]
    })

    if(!propiedad || !propiedad.publicado) {
        return res.redirect('/404')
    }


    res.render('propiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId)
    })
}

const enviarMensaje = async (req, res) => {

    const { id } = req.params

    // Comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include : [
            { model: Precio, as: 'precio' },
            { model: Categoria, as: 'categoria' }

        ]
    })

    if(!propiedad) {
        return res.redirect('/404')
    }

    // Renderizar los errores
    
     // Validacion
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){

        return res.render('propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
            errores: resultado.array()
        })

    }

    const { mensaje } = req.body
    const { id: propiedadId } = req.params
    const { id: usuarioId } = req.usuario


    // Almacena el mensaje
    await Mensaje.create({
        mensaje,
        propiedadId,
        usuarioId     
    })

    res.redirect('/')

   /* res.render('propiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
        enviado: true
    })*/
}

// Leer mensajes recibidos
const verMensajes = async (req, res) => {

    const { id } = req.params

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Mensaje, as: 'mensajes',

                include: [
                    {model: Usuario.scope('eliminarPassword'), as: 'usuario'}
                ]
            },
        ],
    })

    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ) {
        return res.redirect('/mis-propiedades')
    }

    res.render('propiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes, 
        formatearFecha
    })
}



export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    cambiarEstado,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes
}

//Siempre hay que tener validacion
