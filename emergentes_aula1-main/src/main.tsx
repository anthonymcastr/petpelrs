import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import Inclusao from './routes/Inclusao.tsx';
import Listagem from './routes/Listagem.tsx';
import Sobre from './routes/Sobre.tsx';
import Login from './routes/Login.tsx';
import Contato from './routes/Contato.tsx';
import LoginAdmin from './Admin/login-admin.tsx';
import Admin from './Admin/Admin.tsx';
import Cadastro from "./routes/Cadastro"
import Inbox from './routes/Inbox.tsx';

import Layout from './Layout.tsx';
import AdminLayout from './Admin/AdminLayout.tsx';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App.tsx'

const rotas = createBrowserRouter([
  {
    element: <App />, // 👈 FUNDO GLOBAL
    children: [
      {
        path: '/',
        element: <Layout />, // 👈 layout público
        children: [
          { index: true, element: <Listagem /> },
          { path: 'inclusao', element: <Inclusao /> },
          { path: 'inbox', element: <Inbox /> },
          { path: 'sobre', element: <Sobre /> },
          { path: 'login', element: <Login /> },
          { path: 'cadastro', element: <Cadastro /> },
          { path: 'login-admin', element: <LoginAdmin /> }, 
        ],
      },
      {
        path: '/admin',
        element: <AdminLayout />, // 👈 layout admin
        children: [
          { index: true, element: <Admin /> },
          { path: 'listagem', element: <Listagem /> },
          { path: 'contato', element: <Contato /> },
        ],
      },
    ],
  },
])



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={rotas} />
  </StrictMode>
);
