import React, { useState } from 'react'
import { redirect } from 'framework'
import TextInput from '../components/text-input.tsx'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const signIn = () => {
  }

  const register = () => { 
    redirect('/register', true)
  }

  const handleChangeUsername = event => setUsername(event.target.value)
  const handleChangePassword = event => setPassword(event.target.value)
  // todo: logo
  // todo: css
  return (
    <div className="page">
      <head>
        <title>Login</title>
      </head>
      <h1>Homedoc</h1>
      <br/>
      <TextInput
        label="Username or Email"
        onChange={handleChangeUsername}
        value={username}
        name="uname"
      />
      <br/><br/>
      <TextInput
        label="Password"
        onChange={handleChangePassword}
        value={password}
        name="pword"
      />
      <br/><br/>
      <button onClick={signIn}>Sign in</button>
      <br/>
      <button onClick={register}>Register</button>
    </div>
  )
}

