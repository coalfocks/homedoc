import React from 'react'

const TextInput = ({
  label,
  onChange,
  value,
  name,
  inputType = 'text'
}: {
  label: string,
  onChange: (e) => void,
  value: any,
  name: string,
  inputType: string,
}) => {
  // todo: css
  return (
    <>
      <label htmlFor="uname">{label}: </label>
      <input
        type={inputType}
        name={name}
        value={value}
        onChange={onChange}
      />
    </>
  )
}
export default TextInput
