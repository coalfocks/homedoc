import React, { useState } from 'react'
import { redirect } from 'framework'
import TextInput from '../components/text-input.tsx'
import axios from 'axios'

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [handle, setHandle] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const register = async (): void => { 
    const errors: Array<string> = []
    if (!email) errors.push('email')
    if (!handle) errors.push('handle')
    if (!password) errors.push('password')
    if (errors.length > 0) {
      error(errors, 'The following fields are required: ')
      return
    }
    if (password !== passwordConfirm) {
      error(errors, 'Passwords don\'t match, please try again')
      return
    }
    const newUser = await axios.post('/api/user/user', {
      user: {
        first: firstName,
        last: lastName,
        email,
        phone,
        handle,
        password,
      },
    })
    console.log(newUser)
  }

  const error = (fieldNames: Array<string>, error: string): void => {
    const errorList = fieldNames.join('\n')
    alert(`${error}\n\n${errorList}`)
  }

  const handleChangeFirstName = event => setFirstName(event.target.value)
  const handleChangeLastName = event => setLastName(event.target.value)
  const handleChangeEmail = event => setEmail(event.target.value)
  const handleChangePhone = event => setPhone(event.target.value)
  const handleChangeHandle = event => setHandle(event.target.value)
  const handleChangePassword = event => setPassword(event.target.value)
  const handleChangePasswordConfirm = event => setPasswordConfirm(event.target.value)

  return (
    <div className="page">
      <head>
        <title>Login</title>
      </head>
      <h1>Homedoc</h1>
      <br/>
      <TextInput
        label="First"
        onChange={handleChangeFirstName}
        value={firstName}
        name="fname"
      />
      <br/><br/>
      <TextInput
        label="Last"
        onChange={handleChangeLastName}
        value={lastName}
        name="lname"
      />
      <br/><br/>
      <TextInput
        label="Email*"
        onChange={handleChangeEmail}
        value={email}
        name="email"
      />
      <br/><br/>
      <TextInput
        label="Phone"
        onChange={handleChangePhone}
        value={phone}
        name="phone"
      />
      <br/><br/>
      <TextInput
        label="Handle*"
        onChange={handleChangeHandle}
        value={handle}
        name="handle"
      />
      <br/><br/>
      <TextInput
        label="Password*"
        onChange={handleChangePassword}
        value={password}
        name="password"
        inputType="password"
      />
      <br/><br/>
      <TextInput
        label="Confirm Password*"
        onChange={handleChangePasswordConfirm}
        value={passwordConfirm}
        name="passwordConfirm"
        inputType="password"
      />
      <br/><br/>
      <br/>
      <button onClick={register}>Register</button>
    </div>
  )
}

