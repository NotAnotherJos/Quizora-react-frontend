import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {RouterProvider, createBrowserRouter, Navigate} from 'react-router-dom';
import Login from './pages/login'
import Register from './pages/register'
import Dashboard from './pages/dashboard';
import GamePage from './pages/game'
import QuestionEditPage from './pages/question'
import SessionResults from './pages/SessionResults'
import PlayJoin from './pages/PlayJoin'
import SessionView from './pages/SessionView';
import PlayGame from './pages/PlayGame'

const router = createBrowserRouter([
  {
    path:'/',
    element:<Navigate to='/dashboard' />
  },
  {
    path:'/login',
    element:<Login />
  },
  {
    path:'/register',
    element:<Register />
  },
  {
    path:'/dashboard',
    element:<Dashboard />
  },
  {
    path:'/game/:game_id',
    element:<GamePage />
  },
  {
    path: '/game/:game_id/question/:question_id',
    element: <QuestionEditPage />
  },
  {
    path: '/session/:session_id',
    element: <SessionResults />
  },
  {
    path: '/play',
    element: <PlayJoin />
  },
  {
    path:'/session/:sessionId',
    element:<SessionView />
  },
  {
    path: '/play/game',
    element: <PlayGame />
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
