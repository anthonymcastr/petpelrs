import express from 'express'
import cors from 'cors'


import routesAnimais from './routes/animais'
import routesPesquisa from './routes/pesquisa'
import routesClientes from './routes/clientes'
import routesLogin from './routes/login'
import routesContatos from './routes/propostas'
import routesLoginAdmin from './routes/login-admin'
import routesAdmins from './routes/admins'
import propostasAdmin from './routes/propostasAdmin'
import routesPetshops from './routes/petshops'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())


app.use("/animais", routesAnimais)
app.use("/pesquisa", routesPesquisa)
app.use("/clientes", routesClientes)
app.use("/login", routesLogin)
app.use("/clientes/login", routesLogin)
app.use("/contatos", routesContatos)
app.use("/clientes/contatos", routesContatos)
app.use("/login-admin", routesLoginAdmin)
app.use("/admins", routesAdmins)
app.use("/admin/contatos", propostasAdmin)
app.use("/petshops", routesPetshops)

console.log("API URL teste")



app.get('/', (req, res) => {
  res.send('API: Cadastro de Animais')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})