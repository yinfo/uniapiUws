const table = 'settings'
const {Pool} = require('pg')
const dbErrors = require('../main_modules/db_errors')
const connectionString = $storage.getPostgresString()
const pool = new Pool({connectionString})

module.exports = {
//-------------------------------------------------------------------------------
//--------------------------- test_json ---------------------------------------
//-------------------------------------------------------------------------------
    createTable: async function () {
        const createTableText = `
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";
            
            CREATE  TABLE IF NOT EXISTS settings (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name  VARCHAR (50) UNIQUE,
              data JSONB
            );
            `
        await pool.query(createTableText)
    },

    findOneOrCreate: async function ({name, data}) {
        try {
            const {rows} = await pool.query('SELECT * FROM settings where name=$1', [name])
            if(rows.length > 0){
                return rows[0]
            } else if(data){//нужно создать новый и вернуть его
                const {rows:newRows } = await pool.query('INSERT INTO settings(name,data) VALUES($1,$2) RETURNING *' , [name,data])
                return newRows.length > 0 ? newRows[0]: null
            } else {
                return null
            }
        }catch (e) {
            throw overrideError(e)
        }
    },
    getAll: async function()  {
        try {
            return await pool.query(`SELECT * FROM settings;`, null)
            // return await pool.query(`SELECT * FROM ${table}`, null)
        } catch (e) {
            console.error(e.message)
            throw overrideError(e)
        }
    },

}


const overrideError = (e) => {
    const code = e.code
    const errorId = dbErrors[code] ? dbErrors[code] : 'unknown_db_error'
    return {
        code,
        errorId,
        message: e.message,
        stack: e.stack,
    }
}










