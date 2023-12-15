import { Sequelize } from 'sequelize'
import { Precio, Categoria, Propiedad } from '../models/index.js'

const inicio = async (req, res) => {


    const [ categorias, precios, casas, departamentos ] = await Promise.all([
        Categoria.findAll({raw: true}),
        Precio.findAll({raw: true}),
        Propiedad.findAll({
            limit: 3,
            where: {
                categoriaId: 1
            },

            include: [ {
                model: Precio,
                as: 'precio'
            }
        ],
        order: [
            ['createdAt', 'DESC']
        ]
        }),
        Propiedad.findAll({
            limit: 3,
            where: {
                categoriaId: 2
            },

            include: [ {
                model: Precio,
                as: 'precio'
            }
        ],
        order: [
            ['createdAt', 'DESC']
        ]
        })

    ])

    res.render('inicio', {
        pagina: 'Inicio',
        categorias,
        precios, 
        casas,
        departamentos,
        csrfToken: req.csrfToken() 
    })
}

const categoria = async (req, res) => {
    const { id } = req.params
    
    // Comprobar que la categoria exista 
    const categoria = await Categoria.findByPk(id)
    if(!categoria) {
        return res.redirect('/404')
    }

    // Obrtener las propidades de la categoria 
    const propiedades = await Propiedad.findAll({
        where: {
            categoriaId: id
        },
        include: [
            { model: Precio, as: 'precio'}
        ]
    })

    res.render('categoria', {
        pagina: `${categoria.nombre}s en Venta`,
        propiedades,
        csrfToken: req.csrfToken()
    })
}

const noEncontrado = (req, res) =>{
    res.render('404', {
        pagina:'No encontrada',
        csrfToken: req.csrfToken()
    })

}

const buscador = async (req, res) =>{
    const { termino } = req.body

    // Validamos que termino no este vacio 
    if(!termino.trim()) {
        return req.redirect('back') // Back sirve para regresar hacia la pagina donde estabamos
    }

    // Si tenemos algo le pasamos la propiedades
    const propiedades = await Propiedad.findAll({
        where: {
            titulo: {
                [Sequelize.Op.like]: '%' + termino + '%'
            }
        },
        include: [
            {model: Precio, as: 'precio'}
        ]
    })

    res.render('busqueda', {
        pagina:'Resultados de la Busqueda',
        propiedades,
        csrfToken: req.csrfToken()
    })
}

export {
    inicio,
    categoria,
    noEncontrado,
    buscador
}