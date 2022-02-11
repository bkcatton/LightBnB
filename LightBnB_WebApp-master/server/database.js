const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');
const pool = new Pool({
  user: 'bencatton',
  password: '',
  host: 'localhost',
  database: 'lightbnb'
});
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
  .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`, [user.name, user.email, user.password])
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
  .query(`SELECT * 
          FROM reservations
          WHERE guest_id=$1
          LIMIT 10`, [guest_id])
  .then((result) => {
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  // 1
  console.log(options);
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city || options.minimum_price_per_night || options.maximum_price_per_night || options.minimum_rating || options.owner_id) {
    queryString += `WHERE`;
  }
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` city LIKE $${queryParams.length}`;
  }
  if (options.city && options.minimum_price_per_night) {
    queryString += ` AND`;
  }
  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night}00`);
    queryString += ` cost_per_night > $${queryParams.length}`;
  }
  if ((options.city || options.minimum_price_per_night) && options.maximum_price_per_night) {
    queryString += ` AND`;
  }
  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night}00`);
    queryString += ` cost_per_night < $${queryParams.length}`;
  }
  if ((options.city || options.minimum_price_per_night || options.maximum_price_per_night) && options.minimum_rating) {
    queryString += ` AND`;
  }
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += ` rating >= $${queryParams.length}`;
  }
  if ((options.city || options.minimum_price_per_night || options.maximum_price_per_night || options.minimum_rating) && options.owner_id) {
    queryString += ` AND`;
  }
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += ` owner_id = $${queryParams.length}`;
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  console.log(property);
let values = [];
for (let items in property) {
  values.push(property[items]);
}
  values[5] = values[5]*100;
  console.log(values);
  return pool
  .query(`INSERT INTO properties (
    title, 
    description,  
    number_of_bedrooms, 
    number_of_bathrooms, 
    parking_spaces, 
    cost_per_night, 
    thumbnail_photo_url, 
    cover_photo_url, 
    street, 
    country, 
    city, 
    province, 
    post_code, 
    owner_id,
    active) 
    VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
    RETURNING *;
    `, values)
  .then((result) => {
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });

  
} 
exports.addProperty = addProperty;
