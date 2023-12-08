const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const databasePath = path.join(__dirname, 'userData.db')
let database = null

const intialiseDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running At http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

intialiseDatabaseAndServer()

app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body

  let hashedPassword = await bcrypt.hash(password, 10)

  let cheackTheUsername = `
        SELECT
            *
        FROM
            user
        WHERE
            username = '${username}';`

  let userData = database.get(cheackTheUsername)

  if (userData === undefined) {
    let postNewUserQuery = `
            INSERT INTO
                user(username, name, password, gender, location)
            VALUES(
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      await database.run(postNewUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  let {username, password} = request.body
  const selectUserQuery = `
        SELECT
            *
        FROM 
            user
        WHERE
            username = '${username}';`
  let dbUser = await database.get(selectUserQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid User')
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatch === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `
        SELECT *
        FROM user
        WHERE username = '${username}'`
  const userDetails = await database.get(selectUserQuery)
  if (userDetails === undefined) {
    response.status(400)
    response.send('User not registered')
  } else {
    const passwordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password,
    )
    if (passwordMatch === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updateNewPassword = `
                    UPDATE user
                    SET
                       password = '${hashedPassword}
                    WHERE username = '${username}';`

        await database.run(updateNewPassword)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
