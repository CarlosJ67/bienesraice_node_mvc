import {check, validationResult} from 'express-validator'
import bcrypt from 'bcrypt'
import Usuario from '../models/Usuario.js'
import { generarJWT, generarId } from '../helpers/tokens.js'
import { request } from 'express'
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js'

const formularioLogin = (req, res) => {
   res.render('auth/login', {
     pagina: 'Iniciar Sesion',
     csrfToken: req.csrfToken()
   })
}
// Validamos los datos del usuario para poder iniciar sesion
const autenticar = async (req, res) =>{
  // validacion 
  await check('email').isEmail().withMessage('El Email es obligatorio').run(req)
  await check('password').notEmpty().withMessage('La Contraseña es obligatoria').run(req)

  let resultado = validationResult(req)

   if(!resultado.isEmpty()){
     //Errores
     return res.render('auth/login', {
       pagina: 'Iniciar Sesión',
       csrfToken : req.csrfToken(),
       errores: resultado.array()
     })
   }

   const { email, password} =req.body
   //Comprobar que el usuario existe
   const usuario = await Usuario.findOne({ where: { email }})
  if (!usuario){
    return res.render('auth/login', {
      pagina: 'Iniciar sesion',
      csrfToken: req.csrfToken(),
      errores: [{msg: 'El usuario No Existe'}]
    })
  }
  
  //Comprobar si el usuario esta confirmado
  if(!usuario.confirmado) {
    return res.render('auth/login', {
      pagina: 'Iniciar sesion',
      csrfToken: req.csrfToken(),
      errores: [{msg: 'Tu cuenta no ha sido confirmada'}]
    })
  }
  // Revisar el Password 
  if(!usuario.verificarPassword(password)){
    return res.render('auth/login', {
      pagina: 'Iniciar sesion',
      csrfToken: req.csrfToken(),
      errores: [{msg: 'El password es incorrecto'}]
    })
  }
  
  // Autenticar al usuario 
  const token = generarJWT({ id: usuario.id, nombre: usuario.nombre })

   console.log(token)

  //Almacenar en un cookie
  return res.cookie('_token', token, {
    httpOnly: true, //Evita los ataques crossfit, esto hace que un cookie no sea accesible desde la API de JavaScript
     // secure: true es un protocolo de certificacion, bloquador de cookie, esto los debes de activar si ya vas a ponerlo en produccion
  }).redirect('/mis-propiedades')
}

// Cerrar sesion 
const cerrarSesion = (req, res) => {

  return res.clearCookie('_token').status(200).redirect('/auth/login')
}

const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
      pagina: 'Crear Cuenta',
      csrfToken : req.csrfToken()
    })
 } 

const registrar = async (req, res) =>{
  // Validacion 
  await check('nombre').notEmpty().withMessage('El nombre no puede ir vacio').run(req)
  await check('email').isEmail().withMessage('Esto no coincide con un email').run(req)
  await check('password').isLength({ min:6 }).withMessage('El Password debe ser al menos de 6 caracteres').run(req)
  await check('password').equals(req.body.password).withMessage('El password no es igual').run(req)
  let resultado = validationResult(req)

 // return res.json({errores: resultado.array()})
  // Verificar que el resultado este vacio 
  if(!resultado.isEmpty()){
    //Errores
    return res.render('auth/registro', {
      pagina: 'Crear Cuenta',
      csrfToken : req.csrfToken(),
      errores: resultado.array(),
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email
      }
    })
  }

//Extraer los datos
const { nombre, email, password } = req.body

//verifica que el usuario no este duplicado
const existeUsuario = await Usuario.findOne({ where : { email }})
if(existeUsuario) {
  return res.render('auth/registro', {
    pagina: 'Crear Cuenta',
    csrfToken : req.csrfToken(),
    errores: [{msg: 'El Usuario ya esta Registrado'}],
    usuario: {
      nombre: req.body.nombre,
      email: req.body.email
    }
  })
 
}

//Almacenar usuario
const usuario =await Usuario.create({
  nombre,
  email,
  password,
  token: generarId()
})

//Mostrar mensaje de confirmacion 
 emailRegistro({
  nombre: usuario.nombre,
  email: usuario.email,
  token: usuario.token
 })


 //  Mostrar mensaje de confurmacion 
 res.render('templates/mensaje', {
   pagina: 'Cuenta Creada Correctamente',
   mensaje: 'Hemos Enviado un Email de Confrimacion, presiona en el enlace'
 })
}

// Funcion que compruebe una cuenta
const confirmar = async (req, res) => {

  const { token } = req.params;

  // Verificar si el token es valido
  const usuario = await Usuario.findOne({ where: { token }})

  if(!usuario){
    return res.render('auth/confirmar-cuenta', {
      pagina: 'Error al confirmar tu cuenta',
      mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
      error: true
    })
  }

  // Confirmar la cuenta
  usuario.token = null;
  usuario.confirmado = true; 
 await usuario.save();// es un metodo de urrm, nos sirve para guardar esos cambios en la base de datos

 res.render('auth/confirmar-cuenta', {
  pagina: 'Cuenta confirmada',
  mensaje: 'La cuenta se confirmo Correctamente'
})
 

}
// Con esta variable podemos hacer la recuperacion de tu cuenta
 const formularioOlvidePassword = (req, res) => {
  res.render('auth/olvide-password', {
    pagina: 'Recupera tu acceso a Bienes Raices',
    csrfToken : req.csrfToken()
  })

} 

const resetPassword = async (req, res) => {
  //validacion 
  await check('email').isEmail().withMessage('Esto no coincide con un email').run(req)
  let resultado = validationResult(req)

 // return res.json({errores: resultado.array()})
  // Verificar que el resultado este vacio 
  if(!resultado.isEmpty()){
    //Errores
    return res.render('auth/olvide-password', {
      pagina: 'Recupera tu acceso a Bienes Raices',
      csrfToken : req.csrfToken(),
      errores: resultado.array()
     
    })
  }

  //Buscar el usuario
  const { email } = req.body

  const usuario = await Usuario.findOne({ where: { email }} )
  if(!usuario) {
    return res.render('auth/olvide-password', {
      pagina: 'Recupera tu acceso a Bienes Raices',
      csrfToken : req.csrfToken(),// es un tipo de exploit de un sitio web en que comandos no autorizados son transmitidos por el usuario
      errores: [{msg: 'El Email no Pertenece a ningun usuario'}]
     
    })
  }
 
 //Generar un token y enviar el Email
  usuario.token = generarId();
  await usuario.save();

  // Enviar un email
  emailOlvidePassword({
    email: usuario.email,
    nombre: usuario.nombre,
    token: usuario.token
  })

  // Renderizar un mensaje
  res.render('templates/mensaje', {
    pagina: 'Reestablece tu Password',
    mensaje: 'Hemos Enviado un email con las instrucciones'
  })

}

const comprobarToken = async (req, res,) =>{

  const { token } = req.params;

  const usuario = await Usuario.findOne({where: {token}})
  if(!usuario) {
    return res.render('auth/confirmar-cuenta', {
      pagina: 'Reestablece tu Password',
      mensaje: 'Hubo un error al validar tu informacion, intenta de nuevo',
      error: true
    })
  }
  
  // Mostrar formulario para modificar el password 
  res.render('auth/reset-password', {
    pagina: 'Restablece Tu Password',
    csrfToken: req.csrfToken() 
  })

}

const nuevoPassword = async (req, res) =>{
 // Validar el password 
 await check('password').isLength({ min:6 }).withMessage('El Password debe ser al menos de 6 caracteres').run(req)
 let resultado = validationResult(req)
 // return res.json({errores: resultado.array()})
  // Verificar que el resultado este vacio 
  if(!resultado.isEmpty()){
    //Errores
    return res.render('auth/reset-password', {
      pagina: 'Reestablece tu Password',
      csrfToken : req.csrfToken(),
      errores: resultado.array()
    })
  }

  const { token } = req.params
  const { password } = req.body;

 // Identificar quien hace el cambio 
  const usuario = await Usuario.findOne({where: {token}})

 // Hashear el nuevo password
 const salt = await bcrypt.genSalt(10)// con estas dos lineas se hashea un password 
 usuario.password = await bcrypt.hash( password, salt);
 usuario.token = null; // Aqui eliminamos el token para que desaparezca de la base de datos

  await usuario.save();

  res.render('auth/confirmar-cuenta', {
    pagina: 'Password Reestablecido', 
    mensaje: 'El Password se guardo correctamente'
  })
}

export {
    formularioLogin,
    autenticar,
    cerrarSesion,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}


//Utilizar complementos que bloqueen la ejecución de scripts. Así los formularios que se envíen por el metodo POST, 
//no podrán ser enviados automáticamente sin el consentimiento del usuario.
