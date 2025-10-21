import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import { Button, Row, Space } from "antd";
import {Link, useNavigate} from 'react-router-dom'

function App() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();
  
  const goRegister = () => {
    alert('Do some thing to check')
    navigate('./register')
  }

  return (
    <>
      <Row>
        <Space>
          <Link to='/login'>
            <Button type='primary'>Go Login</Button>
          </Link>
          <Button onClick={goRegister} danger>Go Register</Button>
        </Space>
      </Row>
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer noopener">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer noopener">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button id="counter" onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
