const arr = ['ajay', 'mohit', 'ravggggi']

const arrLen = arr.reduce((current, val) => current.length > val.length ? current : val)

console.log(arrLen)